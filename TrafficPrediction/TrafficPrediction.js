/**
 * This script is used by index.js
*/

// Import modules
//var qm = require('qminer');
var qm = require('../../../../cpp/QMiner/index.js');
var path = require('path');
var evaluation = qm.analytics.metrics;
var logger = require("./my_modules/utils/logger/logger.js");

// Import my modules
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js')
Utils.DefineStores = require('./my_modules/utils/define-stores/sensor-stores.js')
Model = require('./my_modules/utils/mobis-model/model.js')

//qm.delLock();
//var base = new qm.Base({
//    mode: 'createClean', 
//    dbPath: path.join(__dirname, './db')
//})

init = function (base) {
    
    //////// INIT STORES ////////
    // create schema if not in open or openReadOnly' mode
    var CounterNode = Utils.DefineStores.createNodeStore(base);
    var Stores = Utils.DefineStores.createMeasurementStores(base);
    
    var sensorIds = CounterNode.map(function (sensor) { return sensor.Name.replace("-", "_") })
    
    
    //////// INIT MOBIS MODELS ////////
    
    // This is used by feature extractor, and updated from MobisModel
    var avrVal = Utils.Helper.newDummyModel();
    var mobisModels = {};
    
    sensorIds.forEach(function (sensorId) {
        
        // Prepare store references
        var trafficStore = Stores.trafficStores[sensorId];
        var resampledStore = Stores.resampledStores[sensorId];
        var Evaluation = Stores.evaluationStores[sensorId];
        var Predictions = Stores.predictionStores[sensorId];
        //var mergedStore = Stores.mergedStores[sensorId];
        
        // Define model configurations
        var modelConf = {
            base: base,
            sensorId: sensorId,
            locAvr: avrVal, // Not sure if this is ok, has to be debuged
            stores: {
                "sourceStore": resampledStore,
                "predictionStore": Predictions,
                "evaluationStore": Evaluation,
            },
            fields: [ // From this, feature space could be build.
                { name: "NumOfCars" },
                { name: "Gap" },
                { name: "Occupancy" },
                { name: "Speed" },
                { name: "TrafficStatus" },
            ],
            
            featureSpace: [
                { type: "constant", source: resampledStore.name, val: 1 },
                //{ type: "numeric", source: store.name, field: "Ema1", normalize: false },
                //{ type: "numeric", source: store.name, field: "Ema2", normalize: false },
                { type: "numeric", source: resampledStore.name, field: "Speed", normalize: false },
                { type: "numeric", source: resampledStore.name, field: "NumOfCars", normalize: false },
                { type: "numeric", source: resampledStore.name, field: "Gap", normalize: false },
                { type: "numeric", source: resampledStore.name, field: "Occupancy", normalize: false },
                { type: "numeric", source: resampledStore.name, field: "TrafficStatus", normalize: false },
                //{ type: "jsfunc", source: store.name, name: "AvrVal", fun: getAvrVal.getVal },
                { type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: avrVal.getVal },
                //{ type: "jsfunc", source: resampledStore.name, name: "AvrVal", fun: modelConf.locAvr.getVal },
            ],
            
            predictionFields: [ //TODO: Not sure, if I want to use names of fields or fields??
                { field: resampledStore.field("NumOfCars") },
                { field: resampledStore.field("Occupancy") },
                { field: resampledStore.field("Speed") },
            ],
            
            //ftrSpace: ftrSpace, //TODO: Later this will be done automatically
            
            target: resampledStore.field("NumOfCars"),
            
            otherParams: {
                // This are optional parameters
                evaluationOffset: 10, // It was 50 before
            },
            
            predictionHorizons: [1, 3, 6, 9, 12, 15, 18],
            //predictionHorizons: horizons,
            
            //recLinRegParameters: { "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 }, // Not used yet. //Have to think about it how to use this
            errorMetrics: [
                { name: "MAE", constructor: function () { return new evaluation.MeanAbsoluteError() } },
                { name: "RMSE", constructor: function () { return new evaluation.RootMeanSquareError() } },
                { name: "MAPE", constructor: function () { return new evaluation.MeanAbsolutePercentageError() } },
                { name: "R2", constructor: function () { return new evaluation.R2Score() } }
            ]
        }
        
        logger.info("\nInitializing MobiS model for sensor: " + sensorId);
        logger.info("sourceStore: " + modelConf.stores.sourceStore.name);
        logger.info("predictionStore: " + modelConf.stores.predictionStore.name);
        logger.info("evaluationStore: " + modelConf.stores.evaluationStore.name);
        
        // Create model instance for specific sensor
        var mobisModel = new Model(modelConf);
        mobisModel["sourceStore"] = modelConf.stores.sourceStore;
        mobisModel["predictionStore"] = modelConf.stores.predictionStore;
        mobisModel["evaluationStore"] = modelConf.stores.evaluationStore;
        
        mobisModels[sensorId] = mobisModel;
    });
    

    //////// INIT STREAM AGGREGATES ////////

    sensorIds.forEach(function (sensorId) {
        
        logger.info("\n[Stream Aggregate] Adding Stream Aggregates for sensor: " + sensorId);
        
        // Prepare store references
        var trafficStore = Stores.trafficStores[sensorId];
        var resampledStore = Stores.resampledStores[sensorId];
        var Evaluation = Stores.evaluationStores[sensorId];
        var Predictions = Stores.predictionStores[sensorId];
        
        //////// PREPROCESSING ////////
        // Todo
        

        //////// RESAMPLER ////////
        
        logger.info("[Stream Aggregate] adding Resampler");
        
        var resampleInterval = 60 * 60 * 1000;
        trafficStore.addStreamAggr({
            name: "Resampled", type: "resampler",
            outStore: resampledStore.name, timestamp: "DateTime",
            fields: [{ name: "NumOfCars", interpolator: "linear" },
                 { name: "Gap", interpolator: "linear" },
                 { name: "Occupancy", interpolator: "linear" },
                 { name: "Speed", interpolator: "linear" },
                 { name: "TrafficStatus", interpolator: "linear" },
            ],
            createStore: false, interval: resampleInterval
        });
        
        
        //////// ADD JOINS BACK ////////
        
        logger.info("[Stream Aggregate] adding addJoinsBack");
        
        // Ads a join back, since it was lost with resampler
        resampledStore.addStreamAggr({
            name: "addJoinsBack",
            onAdd: function (rec) {
                rec.$addJoin("measuredBy", trafficStore.last.measuredBy)
            },
            saveJson: function () { return {} }
        })
        
        
        //////// ANALYTICS ////////
        
        logger.info("[Stream Aggregate] adding Analytics");
        
        resampledStore.addStreamAggr({
            name: "analytics",
            onAdd: function (rec) {
                
                var id = rec.measuredBy.Name.replace("-", "_")
                var mobisModel = mobisModels[id];
                
                mobisModel.predict(rec);
                mobisModel.update(rec);
                mobisModel.evaluate(rec);
                mobisModel.consoleReport(rec);
                                
                // do not update if the gap between last record and resampled record is bigger than 2 hours
                var lastId = (trafficStore.length > 2) ? trafficStore.length - 2 : 0
                if (rec.DateTime - trafficStore[lastId].DateTime <= 2 * 60 * 60 * 1000) {

                    mobisModel.predict(rec);
                    mobisModel.update(rec);
                    mobisModel.evaluate(rec);
                    mobisModel.consoleReport(rec);
                    
                }

            },
            saveJson: function () { return {} }
        });

    });

    return mobisModels;
}

// Export function for loading recs from loadStore according to DateTime
importData = function (base, dataPath, limit) {
    var loadStore = Utils.DefineStores.createLoadStore(base);
    qm.load.jsonFile(loadStore, dataPath);
    Utils.Data.importData([loadStore], "", limit);
}
///////////////////// EXPORTS /////////////////////

exports.init = init;
exports.importData = importData;