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
        for (var i = 0; i < 2; i++) { // 2 models: working day or not
            for (var j = 0; j < 24; j++) {
                debugger;
                var avrgModel = avrgs[avrIdx].avrgs[i][j];
                var name = avrgs[avrIdx].predictionField + "_workingday" + i + "_hour" + j
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
        for (var i = 0; i < 2; i++) { // 2 models: working day or not
            for (var j = 0; j < 24; j++) {
                var avrgModel = avrgs[avrIdx].avrgs[i][j];
                var name = avrgs[avrIdx].predictionField + "_workingday" + i + "_hour" + j
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