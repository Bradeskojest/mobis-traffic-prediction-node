// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js');
var assert = require('assert');
var path = require('path');

describe('Loading/Saving mobisModel buffer aggregates', function () {
    
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
        }        ;
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

    // Create buffer aggregates
    var recordBuffers = createBuffers([1, 3, 6], store);
    
    // Send some dummy data to the store
    for (i = 0; i < 20; i++) {
        base.store("Heat").push({ 'Celcius': i, 'Time': new Date().toISOString() })
    };
    
    // Saving state before saving and loading again
    var firstState = JSON.stringify(recordBuffers);

    // Creating new buffer aggregates in order to test loading method
    var testBuffers = createBuffers([1, 3, 6], store);

    // Testing loading buffer state to new buffers
    loadState(testBuffers);

    // Saving state before saving and loading again
    var loadedState = JSON.stringify(testBuffers);

    // check if loaded state is equal to first state
    it('should load identical aggregate state as it was saved', function () {
        assert.equal(loadedState, firstState);
    });

});