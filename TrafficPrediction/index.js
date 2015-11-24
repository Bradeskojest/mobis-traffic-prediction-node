var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];
var qm = require(config.qmPath);
//var qm = require('qminer');
//var qm = require('../../../../cpp/QMiner/index.js');
var server = require('./server/server.js');
var predictionService = require('./predictionService.js');

// read input script argument for mode type. Default is "cleanCreate"
var mode = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
var base = predictionService.start(mode);

// START SERVER
server.init(base);
server.start(config.trafficPredictionService.server.port);

