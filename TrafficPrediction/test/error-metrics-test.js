// import the qm module
var qm = require('qminer');
var assert = require('assert');
var evaluation = qm.analytics.metrics

describe('Loading/Saving error metrics', function () {
    
    // dummy data
    var true_vals = [2, 3, 4, 5, 6];
    var pred_vals = [1, 2, 3, 4, 5];
    
    var true_vals2 = [1, 2, 3, 4, 5];
    var pred_vals2 = [3, 4, 5, 6, 7];
    
    // create mean error instance
    var error = new evaluation.MeanError();
    
    // simulate data flow
    for (var i in true_vals) {
        error.push(true_vals[i], pred_vals[i]);
    }
    
    // save state
    var fout = new qm.fs.FOut(error.metric.shortName.toLowerCase())
    error.save(fout);
    fout.flush();
    fout.close();
    
    // create new mean error instance
    var error2 = new evaluation.MeanError();
    
    // load option number 1 - via load method
    var fin = new qm.fs.FIn(error2.metric.shortName.toLowerCase());
    error2.load(fin);
    
    // new fin instance
    var fin = new qm.fs.FIn('me');
    
    // load option number 2 - via constructor
    var error3 = new evaluation.MeanError(fin);
    fin.close()
    
    // check if equal
    it('should load identical aggregate state as it was saved', function () {
        assert.equal(JSON.stringify(error2), JSON.stringify(error));
    });
    
    it('should load identical aggregate via constructor', function () {
        assert.equal(JSON.stringify(error3), JSON.stringify(error));
    });

});