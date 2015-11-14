//var qm = require('qminer');
var qm = require('../../../../cpp/QMiner/index.js');
var trafficPrediction = require('./TrafficPrediction.js');
var path = require('path');
var logger = require("./my_modules/utils/logger/logger.js");

function loadModels (models) { 
    // load each model aggregate
    for (var sensorId in models) {
        if (models.hasOwnProperty(sensorId)) {
            var model = models[sensorId];
            logger.info("\nLoading model states for sensor " + sensorId);
            model.load(path.join(__dirname, './db'));
        }
    }
}

function saveModels(models) {
    // load each model aggregate
    for (var sensorId in models) {
        if (models.hasOwnProperty(sensorId)) {
            var model = models[sensorId];
            logger.info("\nSaving model states for sensor " + sensorId);
            model.save(path.join(__dirname, './db'));
        }
    }
}

function shutdown(base, models) {
    // debugging purpuses - delete it later
    logger.debug(JSON.stringify(models['0178_12'].recordBuffers, false, 2))
    logger.debug(JSON.stringify(models['0178_12'].errorModels, false, 2))
    logger.debug(JSON.stringify(models['0178_12'].locAvrgs, false, 2))
    logger.debug(JSON.stringify(models['0178_12'].linregs, false, 2))

    logger.info("Shuting down...");
    saveModels(models);
    base.close();
}

function closeFunctions(base, models) {
    // register on close functions
    process.on('SIGINT', function () { shutdown(base, models); process.exit(); });
    process.on('SIGHUP', function () { shutdown(base, models); process.exit(); });
    process.on('uncaughtException', function () { shutdown(base, models); process.exit(); });
}

// create Base in CLEAN CREATE mode
function cleanCreateMode(callback) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    base["mode"] = 'createClean'
    // Init traffic prediction work flow
    var models = trafficPrediction.init(base); //Initiate the traffic prediction workflow
    
    // saving state and closing base before exiting
    callback(base, models);

    return base;
}

// create Base in OPEN mode
function openMode(callback) {
    var base = new qm.Base({
        mode: 'open',
        dbPath: path.join(__dirname, './db') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    base["mode"] = 'open'
    var models = trafficPrediction.init(base); //Initiate the traffic prediction workflow
    
    // load saved models
    loadModels(models); 
    
    // saving state and closing base before exiting
    callback(base, models);

    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: path.join(__dirname, './db')
    })
    base["mode"] = 'openReadOnly'
    
    // load saved models
    loadModels(models); // load saved models
    
    return base;
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode(callback) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    base["mode"] = 'createClean'
    
    // Init traffic prediction work flow
    var models = trafficPrediction.init(base); //Initiate the traffic prediction workflow
    
    // saving state and closing base before exiting
    callback(base, models);

    // Import initial data
    logger.info("Training models...")
    //qm.load.jsonFile(base.store("rawStore"), "./sandbox/data1.json ");
    ////trafficPrediction.importData(base, "./sandbox/measurements_0011_11.txt")
    ////trafficPrediction.importData(base, "./sandbox/measurements_9_sens_3_mon.txt")
    //trafficPrediction.importData(base, "./sandbox/measurements3sensors3months.txt")
    //trafficPrediction.importData(base, "./sandbox/chunk1measurements3sensors3months.txt") // Small chuck of previous (from march on).
    //trafficPrediction.importData(base, "./sandbox/measurements_obvoznica.txt")
    trafficPrediction.importData(base, "./sandbox/measurements_obvoznica_lite.txt")
    //trafficPrediction.importData(base, "./sandbox/data-small.json")

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
    var base = modes[mode](closeFunctions);
    
    logger.info("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode)
    
    return base;
}

exports.mode = createBase;
