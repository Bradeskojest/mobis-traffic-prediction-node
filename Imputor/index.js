﻿var qm = require('qminer');
var path = require('path');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

// Import my modules
Utils = require('./my_modules/utils/importData.js');

qm.delLock();

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    //qm.delLock();
    //var base = qm.create('qm.conf', '', true); // How can I spec dbPath??
    
    // Init data base
    //qm.delLock();
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './sensors.def'),
        dbPath: path.join(__dirname, './db')
    })
    
    //qm.load.jsonFile(base.store("CounterNode"), path.join(__dirname, "/sandbox/countersNodes.txt"));
    qm.load.jsonFile(base.store("CounterNode"), path.join(__dirname, "/sandbox/countersNodes_big.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements3sensors3months.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/chunk2measurements3sensors3months.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements_obvoznica.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements_obvoznica_first_month.txt"));
    //qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements_obvoznica_last_month.txt"));
    qm.load.jsonFile(base.store('trafficLoadStore'), path.join(__dirname, "/sandbox/measurements_big.txt"));
    
    //base.close();
    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly', 
    })
    return base;
}

//Just a wrapper around above function
var createBase = {
    cleanCreateMode: cleanCreateMode,
    //openMode: openMode,
    readOnlyMode: readOnlyMode
}


// Only one of bellow can be selected
var base = createBase.cleanCreateMode();
//var base = createBase.openMode();
//var base = createBase.readOnlyMode();

// Start importing records
var url = config.trafficPredictionService.server.root + "/traffic-predictions/add";
Utils.importData(url, [base.store('trafficLoadStore')], [base.store('trafficStore')])

