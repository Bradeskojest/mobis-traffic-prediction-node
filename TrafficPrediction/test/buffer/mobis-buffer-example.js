// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js');
var modelBuffer = require('../../my_modules/utils/mobis-model/model-buffers.js');
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

/////////////////////////////////////////////////////////////////////////
// Testing Saving
/////////////////////////////////////////////////////////////////////////


// Create buffer aggregates
var recordBuffers = modelBuffer.create([1, 3, 6], store);

// Send some dummy data to the store
for (i = 0; i < 20; i++) {
    base.store("Heat").push({ 'Celcius': i, 'Time': new Date().toISOString() })
};

// debugging
console.log(JSON.stringify(recordBuffers, null, 2))

// Saving all buffer aggregates state
modelBuffer.save(recordBuffers);


/////////////////////////////////////////////////////////////////////////
// Testing Loading
/////////////////////////////////////////////////////////////////////////


// Creating new buffer aggregates in order to test loading method
var testBuffers = modelBuffer.create([1, 3, 6], store);

// debugging - should be empty
console.log(JSON.stringify(testBuffers, null, 2)); 

// Testing loading buffer state to new buffers
modelBuffer.load(testBuffers);

//debugging
console.log(JSON.stringify(testBuffers, null, 2));