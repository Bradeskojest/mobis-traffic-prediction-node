/**
 * This script simulates data flow from one sensors, 
 * develops prediction models
 * makes predictions and evaluates them
*/
 
// Import modules
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var qm = require(config.qmPath);
var path = require('path');
var server = require('./server/server.js');
var evaluation = qm.analytics.metrics;

// Import my modules
Utils = {};
Utils.Data = require('./my_modules/utils/importData.js');
Utils.SpecialDates = require('./my_modules/utils/special-dates/special-dates.js')
Utils.Helper = require('./my_modules/utils/helper.js')
Model = require('./my_modules/utils/mobis-model/model.js')

function init(base, load) {
    load = (typeof load === 'undefined') ? false : load;

    var CounterNode = base.store("CounterNode");
    var Evaluation = base.store("Evaluation");
    var Predictions = base.store("Predictions");
    var trafficLoadStore = base.store('trafficLoadStore');
    var trafficStore = base.store('trafficStore');
    //var mergedStore = base.store('mergedStore'); 
    var resampledStore = base.store('resampledStore');
    
    // This is used by feature extractor, and updated from MobisModel
    var avrVal = Utils.Helper.newDummyModel();
    
    ////////////////////////////// DEFINING MODEL CONFIGURATION //////////////////////////////
    var modelConf = {
        base: base,
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
    
    // create new MobiS model
    var mobisModel = new Model(modelConf);
    if (load) { mobisModel.load(path.join(__dirname, './db/0011_11')) };
    
    ///////////////////// PREPROCESSING FOR TRAFFIC DATA SOURCE /////////////////////
    // Replaces incorect speed values, with avr value
    // TODO
    
    
    //////////////////////////// RESAMPLING MERGED STORE ////////////////////////////
    // This resample aggregator creates new resampled store
    var resampleInterval = 60 * 60 * 1000;
    //qm.newStreamAggr({ //TODO: test if it would work with this?
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
    
    // Ads a join back, since it was lost with resampler
    resampledStore.addStreamAggr({
        name: "addJoinsBack",
        onAdd: function (rec) {
            rec.$addJoin("measuredBy", trafficStore.last.measuredBy)
        },
        saveJson: function () { return {} }
    })
    
    
    //////////////////////////// PREDICTION AND EVALUATION ////////////////////////////
    resampledStore.addStreamAggr({
        name: "analytics",
        onAdd: function (rec) {
            
            mobisModel.predict(rec);
            mobisModel.update(rec);
            mobisModel.evaluate(rec);
            mobisModel.consoleReport(rec);

        },
        saveJson: function () { return {} }
    });
    
    debugger

    
    // TODO: how can I move this somewhere outside??
    // shutdown function
    function shutdown(base) {
        console.log(JSON.stringify(mobisModel.recordBuffers, false, 2)) // DEBUGING
        console.log(JSON.stringify(mobisModel.errorModels, false, 2)) // DEBUGING
        console.log(JSON.stringify(mobisModel.locAvrgs, false, 2)) // DEBUGING
        console.log(JSON.stringify(mobisModel.linregs, false, 2)) // DEBUGING
        console.log("Shuting down...");
        mobisModel.save(path.join(__dirname, './db/0011_11'));
        base.close();
    }
    
    // register on close functions
    process.on('SIGINT', function () { shutdown(base); process.exit(); });
    process.on('SIGHUP', function () { shutdown(base); process.exit(); });
    process.on('uncaughtException', function () { shutdown(base); process.exit(); });
}

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: 'sensors.def',
        //dbPath: path.join(__dirname, './db')
    })

    // Init traffic prediction work flow
    init(base); //Initiate the traffic prediction workflow
    return base;
}

// create Base in OPEN mode
function openMode() {
    var base = new qm.Base({
        mode: 'open', 
        schemaPath: 'sensors.def',
        dbPath: path.join(__dirname, './db')
    })
    
    //Initiate the traffic prediction workflow
    init(base, true); 
    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly',
        schemaPath: 'sensors.def',
        dbpath: path.join(__dirname, './db')
    })
    return base;
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: 'sensors.def',
        dbPath: path.join(__dirname, './db')
    })
    
    // Init traffic prediction work flow
    init(base); //Initiate the traffic prediction workflow
    
    // Import initial data
    qm.load.jsonFile(base.store("CounterNode"), "./sandbox/countersNodes.txt");
    //qm.load.jsonFile(base.store('trafficStore'), "./sandbox/measurements_0011_11.txt");
    qm.load.jsonFile(base.store('trafficStore'), "./sandbox/measurements_0011_11_lite.txt");
    
    return base;
}


// function that handles in which mode store should be opened
function createBase(mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        throw new Error("Base mode '" + mode + "' does not exist!" + 
            "Use one of this: 'cleanCreate', 'cleanCreateLoad', 'open', 'openReadOnly'")
    }
    
    // run appropriate function
    var base = modes[mode]();
    base["mode"] = mode;
    
    console.log("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode)
    
    return base;
}

///////////////////// START SERVICE /////////////////////

// read input script argument for mode type. Default is "cleanCreate"
var scriptArgs = (process.argv[2] == null) ? "cleanCreateLoad" : process.argv[2];
var base = createBase(scriptArgs);

debugger

// Testing Loading model - Cant acces mobisModel any more!!!
//mobisModel.save(path.join(__dirname, './db/0011_11'));
//mobisModel.load(path.join(__dirname, './db/0011_11'));
//console.log(JSON.stringify(mobisModel.recordBuffers, false, 2)) // DEBUGING

console.log(base.store('trafficStore').allRecords.length); // DEBUGING
console.log("Max speed:" + base.store('resampledStore').last.measuredBy.MaxSpeed); //DEBUGING

console.log(base.getStoreList().map(function (store) { return store.storeName }))

// Start the server
server.init(base);
server.start();