var qm = require('qminer');
var assert = require('assert');
var onlineAvr = require('../../my_modules/utils/baseline-models/online-average.js')

describe('Loading/Saving online average module', function () {
    
    var average = new onlineAvr();
    var average2 = new onlineAvr();
    
    console.log("average.update(5):", average.update(5))
    console.log("average.update(3):", average.update(3))
    
    // testing saving model
    var fout = new qm.fs.FOut('avr_test');
    average.save(fout);
    
    // testing loading function
    var average2 = new onlineAvr();
    var fin = new qm.fs.FIn('avr_test');
    average2.load(fin);
    
    // testing loading via constructor
    var fin = new qm.fs.FIn('avr_test');
    var average3 = new onlineAvr(fin);
    
    // check if equal
    it('should load identical aggregate state as it was saved', function () {
        assert.equal(JSON.stringify(average2), JSON.stringify(average));
    });
    
    it('should load identical aggregate via constructor', function () {
        assert.equal(JSON.stringify(average3), JSON.stringify(average));
    });

});
