// import the qm module
//var qm = require('qminer');
var qm = require('../../../../../../cpp/QMiner/index.js');
//var evaluation = require('../../my_modules/utils/online-evaluation/evaluation.js');
var evaluation = qm.analytics.metrics

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

console.log(error.getError());
debugger

// create new mean error instance
var error2 = new evaluation.MeanError();

// load option number 1 - via load method
var fin = new qm.fs.FIn(error2.metric.shortName.toLowerCase());
error2.load(fin);

console.log(error2.getError());
debugger

// new fin instance
var fin = new qm.fs.FIn('me');

// load option number 2 - via constructor
var error3 = new evaluation.MeanError(fin);

console.log(error3.getError());
debugger
