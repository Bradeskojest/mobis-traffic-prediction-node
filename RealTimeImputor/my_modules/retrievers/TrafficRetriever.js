var request = require('request');
var logger = require('../logger/logger.js');
var async = require('async');

// Constructor
function TrafficRetriever(options) {
    this.url = options.url || "http://opendata.si/promet/counters/";
    this.lastUpdated = 0;
}

TrafficRetriever.prototype.fetchData = function (callback) {
    request(this.url, function (error, response, body) {
        if (error) {
            logger.error(err.stack);
            return callback(error);
        }
        if (response.statusCode !== 200) throw new Error("Request Failed")
        
        // Find field "updated", without parsing the whole body to JSON
        var indexOfUpdated = body.indexOf("updated");
        if (indexOfUpdated == -1) {
            var err = new Error("Did not find field \"updated\".")
            logger.error(err.stack);
            return callback(err);
        }
        
        // Extract field "updated"
        var updated = parseInt(body.substring(indexOfUpdated + 10, indexOfUpdated + 20));
        
        // Check if this record was allredy fetched
        if (updated != this.lastUpdated) {
            logger.info("Fetched new record with timestamp %s!", updated)
            this.lastUpdated = updated;
            var data = JSON.parse(body);
            return callback(null, data);
        } 
        else {
            logger.info("Record with timestamp %s was allready fetched.", updated)
        }
    }.bind(this));
}

// USING ASYNC MODULE
// Parse and send measurement one by one.
TrafficRetriever.prototype.start = function (callback) {
    this.fetchData(function (error, data) {
        if (error) return callback(error)
        
        var dateTimeString = data.Contents[0].ModifiedTime;
        var dateTime = generateDateTime(dateTimeString);
        var Items = data.Contents[0].Data.Items;

        var count = 0; // Just for debugging
        
        async.eachSeries(Items, function (item, next) {

            // parse all sensors from specific section
            async.eachSeries(item.Data, function (rec, _next) {
                var Id = rec.Id;              

                measurementRec = formatMeasurementRecord(rec.properties);
                measurementRec.DateTime = dateTime;
                measurementRec.measuredBy = { Name: Id };
                
                logger.debug("Count:", count++); // Just for debugging
                callback(null, measurementRec, _next);

            }, function (_err) {
                if (_err) {
                    return callback(_err);
                    logger.error(_err.stack);
                }
                logger.info("Next section.");
                next();
            });    

        }, function (err) {
            if (err) {
                return callback(err);
                logger.error(err.stack);
            }
            logger.info("My job here is done. Going to sleep.");
            // TODO Report status --> how many records was added, how many discarded.
        });

    });
}



TrafficRetriever.prototype.sendTo = function () {
    // TODO
}

TrafficRetriever.prototype.saveToFile = function () {
    // TODO
}

TrafficRetriever.prototype.saveToMongo = function () {
    // TODO
}

// Formating measure record to match QMiner format
function formatMeasurementRecord(data) {
    var rec = {
        NumOfCars: Number(checkField(data, "stevci_stev")),
        //Occupancy: checkField(data, "stevci_occ"),
        Occupancy: 0,
	    Speed: Number(checkField(data, "stevci_hit")),
        TrafficStatus: Number(checkField(data, "stevci_stat"))
    };
    
    return rec;
}

// generate DateTime object (ISO format)
function generateDateTime(dateTimeString) {
    try {
        var date = new Date(dateTimeString);
    } catch (e) {
        logger.error(e.stack)
    }

    // Ugly Hack: TrafficPrediction model expects datetime in ISOFormat but with local offset (+2H)
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; // Ugly Hack
    var date = new Date(date - tzoffset) // Ugly Hack
    
    try {
        return date.toISOString().slice(0, -5); // Slice removes ".000Z" which represents Zulu timezone
    } catch (e) { 
        logger.error(e.stack)
    }
}

// NOT USED ANY MORE
function parseDateTime(d, t) { 
    // 2 options of dateTime format:
    // 1.) is "6/29/2015" + "9:35:00 PM"
    // 2.) is "15/09/2015" + "02:30:00"
    var date;

    // check if we are dealing with format: "6/29/2015" + "9:35:00 PM"
    if (t.indexOf("PM" || "AM") > -1) { 
        date = new Date(d + " " + t)
    } else {
        var dateParts = d.split('/')
        date = new Date (dateParts[1] + "/" + dateParts[0] + "/" + dateParts[2] + " " + t)
    }
    
    // check if date was correctly parsed
    try {
        date = ifDateIsValid(date)
    } catch (e) {
        var message = "Timesatmp '" + d + " " + t + "' was not corectly parsed."
        logger.error(message);
        throw new Error(message);
    }

    return date;
}

// NOT USED ANY MORE
function ifDateIsValid(d) {
    // ref: http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
    if (Object.prototype.toString.call(d) === "[object Date]") {
        if (!isNaN(d.getTime())) {  // d.valueOf() could also work
            return d
        }
    }
    throw new Error();
}

// Check if this field exists. If not, throw error.
function checkField(input, fieldNm) {
    if (input.hasOwnProperty(fieldNm)) {
        return input[fieldNm]
    } else {
        throw new ParsingError(fieldNm)
    }
}

// Costum Parsing Error
function ParsingError(field) {
    this.name = "ParsingError";
    this.message = "field \"" + field + "\" does not exist in object";
    this.toString = function () { return this.name + ": " + this.message };
}
ParsingError.prototype = Object.create(Error.prototype);
ParsingError.prototype.constructor = ParsingError;

module.exports = TrafficRetriever;