var qm = require('qminer');
var path = require('path');

createBuffers = function (horizons, store) {
    // Initialize RecordBuffers definiton for all horizons 
    RecordBuffers = {};
    for (var horizon in horizons) {
        var buffer = store.addStreamAggr({
            name: "delay_" + horizons[horizon] + "h",
            type: "recordBuffer",
            size: horizons[horizon] + 1
        });
        buffer.horizon = horizons[horizon];
        RecordBuffers[horizons[horizon]] = buffer;
    };
    return RecordBuffers;
};

// save buffer state
saveState = function (buffers, dirName) {
    dirName = typeof dirName !== 'undefined' ? dirName : __dirname;

    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);

    // save each buffer aggregate   
    for (var property in buffers) {
        if (buffers.hasOwnProperty(property)) {
            var buffer = buffers[property];
            var filePath = path.join(dirName, buffer.name);
            var fout = qm.fs.openWrite(filePath);
            buffer.save(fout);
            fout.close();
        }
    }
};

// load buffer state
loadState = function (buffers, dirName) {
    dirName = typeof dirName !== 'undefined' ? dirName : __dirname;

    // load each buffer aggregate
    for (var property in buffers) {
        if (buffers.hasOwnProperty(property)) {
            var buffer = buffers[property];
            var filePath = path.join(dirName, buffer.name);
            var fin = qm.fs.openRead(filePath);
            buffer.load(fin);
        }
    }
};

exports.create = createBuffers;
exports.save = saveState;
exports.load = loadState;