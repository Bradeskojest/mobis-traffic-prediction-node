var qm = require('qminer');
var path = require('path');

createErrorModels = function (fields, horizons, errMetrics) {
    var errorModels = [];
    for (var field in fields) {
        errorModels[field] = [];
        errorModels[field]["Model"] = { "field": fields[field].field.name };
        for (var horizon in horizons) {
            errorModels[field][horizon] = [];
            errorModels[field][horizon]["Model"] = { "horizon": horizons[horizon] };
            for (var errMetric in errMetrics) {
                errorModels[field][horizon][errMetric] = errMetrics[errMetric].constructor();
                errorModels[field][horizon][errMetric]["MetricName"] = errMetrics[errMetric].name;
                errorModels[field][horizon][errMetric]["PredictionField"] = fields[field].field.name;
            };
        };
    };
    return errorModels;
};


// save buffer state
saveState = function (errorModels, fields, horizons, errMetrics, dirName) {
    dirName = typeof dirName !== 'undefined' ? dirName : __dirname;

    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);
    
    // write all states to fout
    for (var fieldIdx in fields) { 
        for (var horizonIdx in horizons) {
            for (var errorMetricIdx in errMetrics) {
                var errorModel = errorModels[fieldIdx][horizonIdx][errorMetricIdx];
                var name = fields[fieldIdx].field.name + "_" + horizons[horizonIdx] + "_" + errMetrics[errorMetricIdx].name
                var filePath = path.join(dirName, name);
                var fout = new qm.fs.FOut(filePath);
                errorModel.save(fout);
                fout.close();
            }
        }
    }

};

// load buffer state
loadState = function (errorModels, fields, horizons, errMetrics, dirName) {
    dirName = typeof dirName !== 'undefined' ? dirName : __dirname;

    // write all states to fout
    for (var fieldIdx in fields) {
        for (var horizonIdx in horizons) {
            for (var errorMetricIdx in errMetrics) {
                var errorModel = errorModels[fieldIdx][horizonIdx][errorMetricIdx];
                var name = fields[fieldIdx].field.name + "_" + horizons[horizonIdx] + "_" + errMetrics[errorMetricIdx].name
                var filePath = path.join(dirName, name);
                var fin = new qm.fs.FIn(filePath);
                errorModel.load(fin);
                fin.close();
            }
        }
    }
};

exports.create = createErrorModels;
exports.save = saveState;
exports.load = loadState;