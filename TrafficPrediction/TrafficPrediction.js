/**
 * This script is used by index.js
*/

// Import modules
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var qm = require(config.qmPath);
//var qm = require('qminer');
//var qm = require('../../../../cpp/QMiner/index.js');
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


var TrafficPrediction = function () {
    this.base;
    this.mobisModels = {};
    this.sensorIds;
    this.stores;
    this.pathDb = path.join(__dirname, './db');
    this.pathBackup = path.join(__dirname, './backup')
}

TrafficPrediction.prototype.init = function (base) {
    this.initStores(base);
    this.initModels();
    this.initAggregates();
}

TrafficPrediction.prototype.initStores = function (base) {
    //////// INIT STORES ////////
    this.base = base;

    // create schema if not in open or openReadOnly' mode
    var counterNodes = Utils.DefineStores.createNodeStore(base);
    this.stores = Utils.DefineStores.createMeasurementStores(base);
    
    // sensor ids
    this.sensorIds = counterNodes.map(function (sensor) { return sensor.Name.replace("-", "_") })
    
    // shutdown properly when service is closed
    process.on('SIGINT', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
    process.on('SIGHUP', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
    process.on('uncaughtException', function () { this.shutdown(); this.backup(); process.exit(); }.bind(this));
}

TrafficPrediction.prototype.initModels = function () {
    //////// INIT MOBIS MODELS ////////
    // This is used by feature extractor, and updated from MobisModel
    var avrVal = Utils.Helper.newDummyModel();
    
    this.sensorIds.forEach(function (sensorId) {
        // Prepare store references
        var trafficStore = this.stores.trafficStores[sensorId];
        var resampledStore = this.stores.resampledStores[sensorId];
        var Evaluation = this.stores.evaluationStores[sensorId];
        var Predictions = this.stores.predictionStores[sensorId];
        //var mergedStore = this.stores.mergedStores[sensorId];
        
        // Define model configurations
        var modelConf = {
            base : this.base,
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
        
        this.mobisModels[sensorId] = mobisModel;
    }, this);
}

TrafficPrediction.prototype.initAggregates = function () {
    //////// INIT STREAM AGGREGATES ////////
    this.sensorIds.forEach(function (sensorId) {
        
        logger.info("\n[Stream Aggregate] Adding Stream Aggregates for sensor: " + sensorId);
        
        // Prepare store references
        var trafficStore = this.stores.trafficStores[sensorId];
        var resampledStore = this.stores.resampledStores[sensorId];
        var Evaluation = this.stores.evaluationStores[sensorId];
        var Predictions = this.stores.predictionStores[sensorId];
        
        // model
        var model = this.mobisModels[sensorId];
        
        //////// PREPROCESSING ////////
        // Todo
        
        
        //////// RESAMPLER ////////
        logger.info("[Stream Aggregate] adding Resampler");
        
        var resampleInterval = 60 * 60 * 1000;
        model['resampler'] = trafficStore.addStreamAggr({
            name: "resampler", type: "resampler",
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
                var mobisModel = this.mobisModels[id];
                
                mobisModel.predict(rec);
                //mobisModel.update(rec);
                //mobisModel.evaluate(rec);
                //mobisModel.consoleReport(rec);
                
                // do not update if the gap between last record and resampled record is bigger than 2 hours
                var lastId = (trafficStore.length > 2) ? trafficStore.length - 2 : 0
                if (rec.DateTime - trafficStore[lastId].DateTime <= 2 * 60 * 60 * 1000) {
                    
                    //mobisModel.predict(rec);
                    mobisModel.update(rec);
                    mobisModel.evaluate(rec);
                    mobisModel.consoleReport(rec);
                    
                }

            }.bind(this),
            saveJson: function () { return {} }
        });

    }, this);
}

// load each model aggregate
TrafficPrediction.prototype.saveState = function (path) { 
    var path = (typeof path === 'undefined') ? this.pathDb : path
    for (var sensorId in this.mobisModels) {
        if (this.mobisModels.hasOwnProperty(sensorId)) {
            var model = this.mobisModels[sensorId];
            logger.info("\nSaving model states for sensor " + sensorId);
            model.save(path);
        }
    }
}

// load each model aggregate
TrafficPrediction.prototype.loadState = function (path) {
    var path = (typeof path === 'undefined') ? this.pathDb : path
    for (var sensorId in this.mobisModels) {
        if (this.mobisModels.hasOwnProperty(sensorId)) {
            var model = this.mobisModels[sensorId];
            logger.info("\nLoading model states for sensor " + sensorId);
            model.load(path);
        }
    }
}

TrafficPrediction.prototype.shutdown = function () {
    // debugging purpuses - delete it later
    //logger.debug(JSON.stringify(this.mobisModels['0178_12'].recordBuffers, false, 2))
    //logger.debug(JSON.stringify(this.mobisModels['0178_12'].errorModels, false, 2))
    //logger.debug(JSON.stringify(this.mobisModels['0178_12'].locAvrgs, false, 2))
    //logger.debug(JSON.stringify(this.mobisModels['0178_12'].linregs, false, 2))
    
    if (!this.base.isClosed()) {
        logger.info("Shutting down...");
        this.saveState();
        this.base.close();
        logger.info("Model state is saved. Base is closed.");
    } else { 
        logger.debug("Base allready closed.")
    }
}

TrafficPrediction.prototype.backup = function (reopen) {
    logger.info("Creating backup...");
    
    // if true, reopen and relode state after backup
    var reopen = (typeof reopen === 'undefined') ? false : reopen;
    
    // shutdown first (close and save) before backuping
    if (!this.base.isClosed()) this.shutdown();
    
    // copy .db to .backup
    Utils.Helper.copyFolder(this.pathDb, this.pathBackup);
    logger.info("Backup created.");

    //  if reopen flag is true - reopen and load from created backup
    if (reopen) {
        logger.info("Reopening model...");
        // reopen saved base
        var base = new qm.Base({
            mode: 'open',
            dbPath: this.pathDb
            //dbPath: this.pathBackup // backup is not saved properly
        })
        base["mode"] = 'open';
        
        // load saved state
        this.init(base);
        this.loadState(this.pathDb);
        //this.loadState(this.pathBackup); // this should load from pathBackup
        console.log();
        logger.info("Model reopened.");
    }
}

// Export function for loading recs from loadStore according to DateTime
TrafficPrediction.prototype.importData = function (dataPath, limit) {
    console.log(); // just to make a new line in console
    logger.info("Loading data...");
    var loadStore = Utils.DefineStores.createLoadStore(this.base);
    qm.load.jsonFile(loadStore, dataPath);
    logger.info("Training models...");
    Utils.Data.importData([loadStore], "", limit);
}

///////////////////// EXPORTS /////////////////////
module.exports = TrafficPrediction;
