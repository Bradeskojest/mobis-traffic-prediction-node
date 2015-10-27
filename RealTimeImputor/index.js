var TrafficRetriever = require('./my_modules/retrievers/TrafficRetriever.js');
var request = require('request');
var logger = require('./my_modules/logger/logger.js');
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

var interval = 60 * 1000; // 1 minute
var trafficRetriever = new TrafficRetriever("http://opendata.si/promet/counters/");

var importUrl = config.trafficPredictionService.server.root + "/traffic-predictions/add";

// Main process
(function startFetching() {
    trafficRetriever.start(function (err, rec, callback) {
        if (err) throw err;
        logger.debug("Sending record:\n" + JSON.stringify(rec, null, 2));
    
        var headers = {
            'Content-Type': 'application/json',
        }

        // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json and then Data: {"test": "test"}
        request.post({ url: importUrl, headers: headers, body: JSON.stringify(rec) }, function (err, res, body) {
            if (err) logger.error(err.stack);
            
            logger.debug("Response: " + body);
            if (res.statusCode == 200) logger.info("Sent record:\n" + JSON.stringify(rec, null, 2))

            callback(); // wait for the response from the server before moving on
        });
        //callback();

    });
    setTimeout(startFetching, interval)

})();