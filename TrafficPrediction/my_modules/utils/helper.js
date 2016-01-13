var logger = require("./logger/logger.js");
var qm = require("qminer");
var path = require('path');
var fs = require('fs');

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
    logger.debug("Copying ./" + path.basename(inFolder) + " to ./" + path.basename(outFolder) + " folder...");
    
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
    logger.debug(files.length + " files copied.\n");
}

var deleteFolderRecursive = function (path) {
    logger.debug("Removing folder ./" + path.basename(path) + "...");

    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
    logger.debug("Folder ./" + path.basename(path) + "removed.\n");
};
exports.deleteFolderRecursive = deleteFolderRecursive;

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

exports.findRecByTime = function (arr, time) {
    time = time.replace("h", ":"); //Example: 16h00
    
    // convert minutes to full hours. Example 16:43 --> 17:00	
    var tm = time.split(":");
    tm = tm.map(function (str) { return Number(str) });
    var hour = (tm[1] > 30) ? (tm[0] + 1) % 24 : tm[0];
    
    var result = [];
    var i = 0;
    var j = 1;
    
    // loop until it find horizon with prediction
    while (result.length == 0) {
        time = ("0" + (hour + i * j)).slice(-2) + ":00";
        
        // check for predictions 
        var result = arr.filter(function (predictionRec) {
            var predTmStr = predictionRec.PredictionTime;
            var tIdx = predTmStr.indexOf("T");
            var predTm = predTmStr.slice(tIdx + 1, tIdx + 6);
            
            return (predTm == time);
        })
        
        if (j == 1) i++;
        j *= -1;
    }
    
    return result;
}

function toJSON (obj, depth) {
    // if input obj is record 
    if (typeof obj.map === "undefined") {
        var rec = obj;
        // main function that parses rec to JSON
        depth = (depth == null) ? 0 : depth;
        if (depth === 0) {
            return rec.toJSON();
        } else {
            var newRec = rec.toJSON();
            // find all store joins from this rec
            rec.$store.joins.forEach(function (join) {
                if (rec[join.name] != null) {
                    newRec[join.name] = [];
                    if (rec[join.name].hasOwnProperty("length")) {
                        rec[join.name].each(function (inner, i) {
                            // find and append joined records in their original store
                            newRec[join.name][i] = toJSON(inner, depth - 1);
                        });
                    } else {
                        newRec[join.name] = toJSON(rec[join.name], depth - 1);
                    }
                }
            });
            return newRec;
        }
    }
    // if input obj is record set
    else {
        var newRs = obj.toJSON();
        newRs.records = obj.map(function (rec) {
            return toJSON(rec, depth);
        });
        return newRs;
    }
};
exports.toJSON = toJSON;