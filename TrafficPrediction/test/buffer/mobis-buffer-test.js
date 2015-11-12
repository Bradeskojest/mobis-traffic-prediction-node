// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js');
var modelBuffer = require('../../my_modules/utils/mobis-model/submodels/model-buffers.js');
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

    // Create buffer aggregates
    var recordBuffers = modelBuffer.create([1, 3, 6], store);
    
    // Send some dummy data to the store
    for (i = 0; i < 20; i++) {
        base.store("Heat").push({ 'Celcius': i, 'Time': new Date().toISOString() })
    };
    
    // Saving state before saving and loading again
    var firstState = JSON.stringify(recordBuffers);
    
    // Saving all buffer aggregates state
    modelBuffer.save(recordBuffers, path.join(__dirname, './dbBuff'));
    
    // close base
    base.close();

    // reopen base
    var base = new qm.Base({
        mode: 'open', 
        dbPath: path.join(__dirname, './dbBuff'),
    })
    var store = base.store('Heat');

    // Creating new buffer aggregates in order to test loading method
    var testBuffers = modelBuffer.create([1, 3, 6], store);

    // Testing loading buffer state to new buffers
    modelBuffer.load(testBuffers, path.join(__dirname, './dbBuff'));

    // Saving state before saving and loading again
    var loadedState = JSON.stringify(testBuffers);

    // check if loaded state is equal to first state
    it('should load identical aggregate state as it was saved', function () {
        assert.equal(loadedState, firstState);
    });

});