var OnlineAverage = require('./online-average.js')
var SpecialDates = require('../special-dates/special-dates.js');

var CalendarFtrs = SpecialDates.newCalendarFeatures();

//////// LOCALIZED AVERAGE  ////////
// Constructor
var LocalizedAverages = function (conf) {
    var field = conf.fields;
    this.fieldNm = field.name;
    this.avrgs = createLocalizedAvrgs();
}
    
LocalizedAverages.prototype.update = function (rec) {
    var avr = selectAvr(rec);
    return avr.update(rec[this.fieldNm])
}
    
LocalizedAverages.prototype.getVal = function (rec) {
    var avr = selectAvr(rec);
    return avr.getAvr()
}

// helper function
var createLocalizedAvrgs = function () {
    // create 2 * 24 avr models, for every hour, and for working/nonworking day
    avrgs = [];
    for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
        avrgs[workIdx] = [];
        avrgs[workIdx]["workingDay"] = workIdx;
        for (var hourIdx = 0; hourIdx < 24; hourIdx++) {
            avrgs[workIdx][hourIdx] = new OnlineAverage();
            avrgs[workIdx][hourIdx]["forHour"] = hourIdx; // asign new field "forHour" to model
        }
    }
    return avrgs;
};

var selectAvr = function (rec) {
    var hour = rec.DateTime.getUTCHours();
    var work = CalendarFtrs.isWorkingDay(rec);
    
    return this.avrgs[work][hour];
}

module.exports = LocalizedAverages;