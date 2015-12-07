var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var qm = require(config.qmPath);
var TrafficPrediction = require('./TrafficPrediction.js');
var predictionService = require('./predictionService.js');
var server = require('./server/server.js');


// create traffic prediction model instance
var trafficPrediction = new TrafficPrediction();

// read input script argument for mode type. Default is "cleanCreate"
var mode = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
predictionService.start(trafficPrediction, mode);


// schedule partialFlush-ing (if defined)
if (config.partialFlushInterval) {
    var interval = config.partialFlushInterval;
    setInterval(function () { trafficPrediction.base.partialFlush() }, interval);
}
// schedule backup-ing (if defined)
if (config.backupInterval) {
    var interval = config.backupInterval;
    setInterval(function () { trafficPrediction.backup(true) }, interval);
} 


// create backup before running server
trafficPrediction.backup(true);

// START SERVER
server.init(trafficPrediction);
server.start(config.trafficPredictionService.server.port);

