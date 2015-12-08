var logger = require("./logger/logger.js");
var qm = require("qminer");
var path = require('path');

// Dummy model, used for feature extractor
// .setVal() -- sets internal value
// .getVal() -- returns internal value
exports.newDummyModel = function () {
    var dummyModel = function () {
        var val = null;

        // Aditional function -- used for feature extractor --
        // Sets value, that can be called with .getVal() method
        this.setVal = function (val_in) {
            val = val_in;
        };

        // Aditional function -- used for feature extractor --
        // Returns values that was set with .setVal() method. 
        // .setVal() should always be called befor .getVal()
        this.getVal = function () {
            if (val == null) throw "You must first .setVal(val_in), before using .getVal()"
            var val_out = val;
            val = null

            return val_out;
        }
    }
    return new dummyModel();
}

exports.copyFolder = function (inFolder, outFolder) {
    logger.debug("Copying ." + path.basename(inFolder) + " to ." + path.basename(outFolder) + " folder...");
    
    // read all files in inFolder
    var files = qm.fs.listFile(inFolder, null, true);
    
    // create outFolder if it doesnet exist
    if (!qm.fs.exists(outFolder)) qm.fs.mkdir(outFolder);
    
    // copy files from inFloder to outFolder
    files.forEach(function (file) {
        var source = path.normalize(file);
        var dest = source.replace(inFolder, outFolder);
        
        // copy file one by one
        if (qm.fs.exists(file)) {
            if (!qm.fs.exists(path.dirname(dest))) qm.fs.mkdir(path.dirname(dest));
            qm.fs.copy(source, dest);
        }
    });
    logger.debug(files.length + " files copied.");
}

exports.newInterval = function () {
    var Interval = function () {
        this.lastTime = undefined;
        
        this.setInterval = function (rec, interval, callback) {
            if (!this.lastTime) this.lastTime = rec.DateTime
            
            if (rec.DateTime.getTime() - this.lastTime.getTime() >= interval) {
                this.lastTime = rec.DateTime;
                console.log("Rec: " + rec.DateTime.toString())
                callback();
            }
        }
    }
    return new Interval();
};

exports.discretizeTrafficStatus = function (val) {
    if (val < 1.5) { return 1 }
    else if (val < 2.5) { return 2 }
    else if (val < 3.5) { return 3 }
    else if (val < 4.5) { return 4 }
    else { return 5 }
}