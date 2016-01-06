var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var qm = require(config.qmPath);
var path = require('path');
var logger = require("./my_modules/utils/logger/logger.js");
Utils.Helper = require('./my_modules/utils/helper.js')

// create Base in CLEAN CREATE mode
function cleanCreateMode(trafficPrediction) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: trafficPrediction.pathDb
    })
    base["mode"] = 'cleanCreate'

    // Init traffic prediction work flow
    trafficPrediction.init(base); //Initiate the traffic prediction workflow
    
    //TODO: we should probably clear backup here as well?
}

// create Base in OPEN mode
function openMode(trafficPrediction) {
    var base = new qm.Base({
        mode: 'open',
        dbPath: trafficPrediction.pathDb
    })
    base["mode"] = 'open'

    //Initiate the traffic prediction workflow
    trafficPrediction.init(base); 
    
    // load saved models
    trafficPrediction.loadState();
}

// create Base in READ ONLY mode
function readOnlyMode(trafficPrediction) {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: trafficPrediction.pathDb
    })
    base["mode"] = 'openReadOnly'
    
    //Initiate the traffic prediction workflow
    trafficPrediction.init(base);
    
    // load saved models
    trafficPredcition.loadState(); 
}

function restoreFromBackup(trafficPrediction) {
    // copy db from backup to db
    Utils.Helper.copyFolder(trafficPrediction.pathBackup, trafficPrediction.pathDb);

    // call openMode()
    openMode(trafficPrediction);
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode(trafficPrediction) {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: trafficPrediction.pathDb
    })
    base["mode"] = 'cleanCreateLoad'
    
    // Init traffic prediction work flow
    trafficPrediction.init(base); //Initiate the traffic prediction workflow

    // Import initial data
    trafficPrediction.importData(path.join(__dirname, './sandbox', config.data.measurements))
    //qm.load.jsonFile(base.store("rawStore"), "./sandbox/data1.json ");
    ////trafficPrediction.importData("./sandbox/measurements_0011_11.txt")
    ////trafficPrediction.importData("./sandbox/measurements_9_sens_3_mon.txt")
    //trafficPrediction.importData("./sandbox/measurements3sensors3months.txt")
    //trafficPrediction.importData("./sandbox/chunk1measurements3sensors3months.txt") // Small chuck of previous (from march on).
    //trafficPrediction.importData("./sandbox/measurements_obvoznica.txt")
    //trafficPrediction.importData("./sandbox/measurements_obvoznica_lite.txt", 2000)
    //trafficPrediction.importData("./sandbox/measurements_big.txt")
    //trafficPrediction.importData("./sandbox/measurements_test.txt")
    //trafficPrediction.importData("./sandbox/data-small.json")
    
    //// read all files in "./sandbox/new folder and load it one by one
    //var files = qm.fs.listFile("./sandbox/new", null, true);
    //files.forEach(function (file) {
    //    var storeNm = "trafficStore_" + file.substring(27, 34);
    //    base.store(storeNm).loadJson(file, 100);
    //})
}

// function that handles in which mode store should be opened
function start(trafficPrediction, mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode,
        'restoreFromBackup': restoreFromBackup
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        modeOptions = [];
        for (option in modes) { 
            modeOptions.push(option);    
        }
        throw new Error("Base mode '" + mode + "' does not exist! Use one of this: " + modeOptions.toString())
    }
    
    // run appropriate function
    modes[mode](trafficPrediction);
    logger.info("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode);
}

exports.start = start;
