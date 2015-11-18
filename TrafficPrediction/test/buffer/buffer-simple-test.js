// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js')
var assert = require('assert');
var path = require('path');

describe('Loading/Saving buffer aggregate', function () {
    
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

    // testing recordBuffer aggregate
    var buffer = base.store("Heat").addStreamAggr({
        name: 'buffer',
        type: 'recordBuffer',
        size: 3
    });

    // send some dummy data to the store
    for (i = 0; i < 5; i++) {
        base.store("Heat").push({ 'Celcius': i, 'Time': new Date().toISOString() })
    };
    
    // saving buffer aggregate state
    var fout = qm.fs.openWrite(buffer.name);
    buffer.save(fout);
    fout.close();
    
    // create new buffer aggregate and load state from previous
    var bufferTest = base.store("Heat").addStreamAggr({
        name: 'bufferTest',
        type: 'recordBuffer',
        size: 3
    });
    
    // loading state to bufferTest
    var fin = qm.fs.openRead(buffer.name)
    bufferTest.load(fin);
    
    // check if equal
    it('should load identical aggregate state as it was saved', function () {
        assert.equal(JSON.stringify(buffer.val), JSON.stringify(bufferTest.val));
    });

});






