// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js');
var path = require('path');

// create a base with a simple store
var base = new qm.Base({
    mode: "createClean",
    dbPath: path.join(__dirname, './dbBuff'),
    schema: [
        {
            name: "Heat",
            fields: [
                { name: "Celcius", type: "float" },
                { name: "Time", type: "datetime" }
            ]
        }]
});
var store = base.store('Heat');

// Initialize RecordBuffers definiton for all horizons 
createBuffers = function (horizons, store) {
    // Initialize RecordBuffers definiton for all horizons 
    RecordBuffers = [];
    for (var horizon in horizons) {
        var buffer = store.addStreamAggr({
            name: "delay_" + horizons[horizon] + "h",
            type: "recordBuffer",
            size: horizons[horizon] + 1
        });
        buffer.horizon = horizons[horizon];
        RecordBuffers.push(buffer);
    };
    return RecordBuffers;
};

// save buffer state
saveState = function (buffers) {
    // save each buffer aggregate   
    var fout = "";
    buffers.forEach(function (buffer) {
        fout = qm.fs.openWrite(buffer.name);
        buffer.save(fout);
        fout.close();
    });
    
};

// load buffer state
loadState = function (buffers) {
    // load each buffer aggregate
    buffers.forEach(function (buffer) {
        var fin = qm.fs.openRead(buffer.name);
        buffer.load(fin);
    });
};


/////////////////////////////////////////////////////////////////////////
// Testing Saving
/////////////////////////////////////////////////////////////////////////


// Create buffer aggregates
var recordBuffers = createBuffers([1, 3, 6], store);

// Send some dummy data to the store
for (i = 0; i < 20; i++) {
    base.store("Heat").push({ 'Celcius': i, 'Time': new Date().toISOString() })
};

// debugging
console.log(JSON.stringify(recordBuffers, null, 2))

// Saving all buffer aggregates state
saveState(recordBuffers);


/////////////////////////////////////////////////////////////////////////
// Testing Loading
/////////////////////////////////////////////////////////////////////////


// Creating new buffer aggregates in order to test loading method
var testBuffers = createBuffers([1, 3, 6], store);

// debugging - should be empty
console.log(JSON.stringify(testBuffers, null, 2)); 

// Testing loading buffer state to new buffers
loadState(testBuffers);

//debugging
console.log(JSON.stringify(testBuffers, null, 2));