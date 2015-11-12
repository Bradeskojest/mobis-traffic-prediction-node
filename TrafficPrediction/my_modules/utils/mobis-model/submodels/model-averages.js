var qm = require('qminer');
var logger = require("../../logger/logger.js");
var path = require('path');

createLocAvrModels = function (targetFields) {
    // create set of locAvr models, for every target field
    var avrgs = [];
    targetFields.forEach(function (target, targetIdx) {
        avrgs[targetIdx] = new LocalizedAverage({ fields: target.field });
        avrgs[targetIdx]["predictionField"] = target.field.name;
    })
    return avrgs;
};

// save buffer state
saveState = function (avrgs, fields, dirName) {
    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);
    
    // iterate over all localizev averages, and save them one by one
    for (var avrIdx in avrgs) {
        for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
            for (var hourIdx = 0; hourIdx < 24; hourIdx++) {
                debugger;
                var avrgModel = avrgs[avrIdx].avrgs[workIdx][hourIdx];
                var name = "averages_" + avrgs[avrIdx].predictionField + 
                    "_workingday" + workIdx + "_hour" + hourIdx
                var filePath = path.join(dirName, name);
                var fout = new qm.fs.FOut(filePath);
                avrgModel.save(fout);
                fout.close();
            }
        }
    }
    logger.info('Saved local average model states')
};

// load buffer state
loadState = function (avrgs, fields, dirName) {
    // write all states to fout
    for (var avrIdx in avrgs) {
        for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
            for (var hourIdx = 0; hourIdx < 24; hourIdx++) {
                var avrgModel = avrgs[avrIdx].avrgs[workIdx][hourIdx];
                var name = "averages_" + avrgs[avrIdx].predictionField + 
                    "_workingday" + workIdx + "_hour" + hourIdx
                var filePath = path.join(dirName, name);
                var fin = new qm.fs.FIn(filePath);
                avrgModel.load(fin);
                fin.close();
            }
        }
    }
    logger.info('Loaded local average model states')
};

exports.create = createLocAvrModels;
exports.save = saveState;
exports.load = loadState;