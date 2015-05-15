//Imports
var Service = {}; Service.Mobis = {}; Service.Mobis.Utils = {};
Utils.Baseline = require('./baselinePredictors.js'); // NOT OK!! Check the path
//Utils.tmFtr = require('./dateTimeFtr.js') // DELETE THIS
Utils.SpecialDates = require('./my_modules/utils/specialDates.js')
var analytics = require('qminer').analytics;

createBuffers = function (horizons, store) {
    // Initialize RecordBuffers definiton for all horizons 
    RecordBuffers = [];
    for (var horizon in horizons) {
        recordBuffer = {
            name: "delay_" + horizons[horizon] + "h",
            type: "recordBuffer",
            horizon: horizons[horizon] + 1
        };
        RecordBuffers.push(recordBuffer);
    };

    // Execute buffer agregates for all horizons
    for (var horizon in horizons) {
        var RecordBuffer = RecordBuffers[horizon];

        store.addStreamAggr({
            name: RecordBuffer.name, type: RecordBuffer.type, size: RecordBuffer.horizon
        });
    };
    return RecordBuffers;
};

createAvrgModels = function (targetFields) {
    // create set of locAvr models, for every target field
    var avrgs = [];
    targetFields.forEach(function (target, targetIdx) {
        avrgs[targetIdx] = Service.Mobis.Utils.Baseline.newLocAvrgs({ fields: target.field });
        avrgs[targetIdx]["predictionField"] = target.field.name;
    })
    return avrgs;
}

createLinRegModels = function (fields, horizons) {
    // create set of linear regression models 
    var linregs = []; // this will be array of objects
    for (var field in fields) { // models for prediction fields
        linregs[field] = [];
        for (var horizon in horizons) { // models for horizons
            linregs[field][horizon] = [];
            for (var i = 0; i < 2; i++) { // 2 models: working day or not
                linregs[field][horizon][i] = [];
                for (var j = 0; j < 24; j++) { // 24 models: for every hour in day
                    linregs[field][horizon][i][j] = analytics.newRecLinReg({ "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 });
                    linregs[field][horizon][i][j]["predictionField"] = fields[field].field.name;
                    linregs[field][horizon][i][j]["horizon"] = horizons[horizon];
                    linregs[field][horizon][i][j]["workingDay"] = i; // asign new field "workingDay" to model (just for demonstrational use)
                    linregs[field][horizon][i][j]["forHour"] = j; // asign new field "forHour" to model (just for demonstrational use)
                    linregs[field][horizon][i][j]["updateCount"] = 0; // how many times model was updated (just for demonstrational use)
                }
            }
        }
    }
    return linregs;
};

createErrorModels = function (fields, horizon, errMetrics) {
    var errorModels = [];
    for (var field in fields) {
        errorModels[field] = [];
        for (var horizon in horizons) {
            errorModels[field][horizon] = [];
            for (var errMetric in errMetrics) {
                errorModels[field][horizon][errMetric] = errMetrics[errMetric].constructor();
                errorModels[field][horizon][errMetric]["MetricName"] = errMetrics[errMetric].name;
                errorModels[field][horizon][errMetric]["PredictionField"] = fields[field].field.name;
            };
        };
    }
    return errorModels;
};


///////////////////////////////// 
// LOCALIZED LINEAR REGRESSION //
///////////////////////////////// 

model = function (base, horizons, ftrSpace, store, predictionStore, evaluationStore, target, evalOffset, errorMetrics, predictionFields) {
    
    this.base = base;
    this.horizons = horizons; // TODO: I think I dont need this because the variable is seen allready from the input parameter
    this.featureSpace = ftrSpace;
    this.target = target.name;
    targets = []; predictionFields.forEach(function (target) { targets.push(target.field.name) });
    this.targets = targets; // Not neceserelly
    var recordBuffers = createBuffers(horizons, store);

    this.locAvrgs = createAvrgModels(predictionFields);
    this.linregs = createLinRegModels(predictionFields, horizons); 
    
    var specialDates = new Utils.SpecialDates.SpecialDatesFtrExtractor(this.base, "./my_modules/utils/specialDates.txt", "Slovenian_holidays");
    errorModels = createErrorModels(predictionFields, horizons, errorMetrics);

    //////////////// UPDATE STEP /////////////////
    this.update = function (rec) {

        for (var predictionFieldIdx in predictionFields) {
            // Update localized average with new record
            var locAvrg = this.locAvrgs[predictionFieldIdx];
            locAvrg.update(rec);

            for (var horizonIdx in horizons) {
                // Get rec for training
                var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizonIdx].name).val.oldest.$id;

                if (trainRecId > 0) {

                    var trainRec = store[trainRecId];
                    var trainHour = trainRec.DateTime.hour;
                    //var trainWork = Service.Mobis.Utils.tmFtr.isWorkingDay(trainRec); // DELETE THIS!!
                    var trainWork = specialDates.getFeature(trainRec);

                    var predictionFieldName = predictionFields[predictionFieldIdx].field.name;
                    var targetVal = rec[predictionFieldName];
                    //trainRec.Predictions[horizonIdx].Target = targetVal; //TODO: Make a join!!!!!
                    trainRec.Predictions[horizonIdx].addJoin("Target", rec); // THIS IS THE IDEA!!

                    // Select correct linregs model to update
                    var linreg = this.linregs[predictionFieldIdx][horizonIdx][trainWork][trainHour];

                    // Update models
                    avrVal.setVal(locAvrg.getVal(rec)) // Set avrVal that is used by ftrExtractor (avrVal.getVal())
                    linreg.learn(ftrSpace.ftrVec(trainRec), targetVal); 
                    linreg.updateCount++;

                }
            }
        }
    };

    ///////////////// PREDICTION STEP ///////////////// 
    this.predict = function (rec) {

        var predictionRecs = [];

        for (var horizon in horizons) {
            // Get rec for training
            var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizon].name).val.oldest.$id;

            // Get prediction interval and time
            var predInter = rec.DateTime.timestamp - rec.$store[trainRecId].DateTime.timestamp;
            var predTime = tm.parse(rec.DateTime.string).add(predInter);

            // Select correct linregs model
            var hour = rec.DateTime.hour;
            //var work = Service.Mobis.Utils.tmFtr.isWorkingDay(rec); // DELETE THIS!!
            var work = specialDates.getFeature(rec);
            // DELETE THIS // var linreg = this.linregs[horizon][work][hour];

            // Create prediction record
            var predictionRec = {};
            predictionRec.OriginalTime = rec.DateTime.string;
            predictionRec.PredictionTime = predTime.string;
            predictionRec.PredictionHorizon = RecordBuffers[horizon].horizon - 1;

            for ( var predictionFieldIdx in predictionFields) {
                var linreg = this.linregs[predictionFieldIdx][horizon][work][hour];
                var locAvrg = this.locAvrgs[predictionFieldIdx];
                var predictionFieldName = predictionFields[predictionFieldIdx].field.name;

                avrVal.setVal(locAvrg.getVal({ "DateTime": predTime }));
                predictionRec[predictionFieldName] = linreg.predict(ftrSpace.ftrVec(rec));
            }

            // Add prediction record to predictions array
            predictionRecs.push(predictionRec);

            predictionStore.add(predictionRec);
            rec.addJoin("Predictions", predictionStore.last);
        };

        return predictionRecs;
    };

    ///////////////// EVALUATION STEP ///////////////// 
    this.evaluate = function (rec) {

        if (rec.$id < evalOffset) return; // If condition is true, stop function here.
        
        for (horizon in horizons) {

            var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizon].name).val.oldest.$id;
            var trainRec = rec.$store[trainRecId]

            errorMetrics.forEach(function (errorMetric, metricIdx) {
                var errRec = {};
                errRec["Name"] = errorMetric.name;

                for (var predictionFieldIdx in predictionFields) {
                    var predictionFieldName = predictionFields[predictionFieldIdx].field.name;
                    // find correct model and prediction
                    var errorModel = errorModels[predictionFieldIdx][horizon][metricIdx];
                    var prediction = trainRec.Predictions[horizon][predictionFieldName];
                    // update model and write to errRec
                    errorModel.update(rec[predictionFieldName], prediction);
                    errRec[predictionFieldName] = errorModel.getError();
                }

                // add errRec to Evaluation sore, and add join to Predictions store which is linked to Original store
                evaluationStore.add(errRec);
                trainRec.Predictions[horizon].addJoin("Evaluation", evaluationStore.last);
            })
        }
    }

    ///////////////// CONSOLE REPORT ///////////////// 
    this.consoleReport = function (rec) {

        if (rec.$id < evalOffset) return; // If condition is true, stop function here.

        if (resampledStore[resampledStore.length - 1].DateTime.day !== resampledStore[resampledStore.length - 2].DateTime.day) {
            console.println("");
            console.log("\n==================================\n=== REC: " + rec.DateTime.string + " ===\n==================================");
        }
        
        for (horizon in horizons) {

            var trainRecId = rec.$store.getStreamAggr(RecordBuffers[horizon].name).val.oldest.$id;
            var trainRec = rec.$store[trainRecId]

            // Only one report per day
            var print = resampledStore[resampledStore.length - 1].DateTime.day !== resampledStore[resampledStore.length - 2].DateTime.day;
            if (!print) return;
            if (resampledStore[trainRecId].Predictions[horizon] == null) return;
            if (resampledStore[trainRecId].Predictions[horizon].Evaluation[0] == null) return;
            //if (print && resampledStore[trainRecId].Predictions[horizon] !== null && resampledStore[trainRecId].Predictions[horizon].Evaluation[0] !== null) {

            // Report current predictions in the console
            console.println("");
            console.log("=== Predictions ===\n");
            console.log("Working on rec: " + rec.DateTime.string);
            console.log("Prediction from: " + trainRec.Predictions[horizon].OriginalTime.string); // Same as trainRec.DateTime.string             
            console.log("Prediction horizon: " + trainRec.Predictions[horizon].PredictionHorizon+"\n")
            //console.log("Target: " + rec[target.name]); // Same as rec[target.name]
            //console.log(target.name + ": " + trainRec.Predictions[horizon][target.name]);
            predictionFields.forEach(function (predField) {
                var predFieldNm = predField.field.name;
                var predValue = trainRec.Predictions[horizon][predFieldNm];
                console.log(predFieldNm + ": " + predValue);
            });

            // Report evaluation metrics in the console
            console.println("");
            console.log("=== Evaluation ===");
            errorMetrics.forEach(function (errorMetric, metricIdx) {
                console.log("--" + errorMetric.name + "--");
                predictionFields.forEach(function (predField) {
                    var predFieldNm = predField.field.name
                    var errorValue = trainRec.Predictions[horizon].Evaluation[metricIdx][predFieldNm];
                    console.log("\t"+predFieldNm + ": " + errorValue);
                });
            });
            
            //}
        }
    }
};

// Export Constructor for Localized Linear Regression model
exports.newModel = function (modelConf) {

    var horizons = (modelConf.predictionHorizons == null) ? 1 : modelConf.predictionHorizons;
    var ftrSpace = modelConf.ftrSpace; // TODO: what to do if it is not defined (if it is null) ?????
    var store = modelConf.stores.sourceStore;
    var predictionStore = modelConf.stores.predictionStore;
    var evaluationStore = modelConf.stores.evaluationStore;
    var target = modelConf.target;
    var evalOffset = (modelConf.otherParams.evaluationOffset == null) ? 50 : modelConf.otherParams.evaluationOffset;
    var errorMetrics = modelConf.errorMetrics;
    var predictionFields = modelConf.predictionFields;  // TODO: what to do if it is not defined (if it is null) ?????

    return new model(base, horizons, ftrSpace, store, predictionStore, evaluationStore, target, evalOffset, errorMetrics, predictionFields);
}

// About this module
exports.about = function () {
    var description = "Module with baseline predictions.";
    return description;
};