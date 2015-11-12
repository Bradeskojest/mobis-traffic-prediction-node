/**
 * QMiner - Open Source Analytics Platform
 * 
 * Copyright (C) 2014 Jozef Stefan Institute
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 */

// object for online metrics model
function createOnlineMetric(callback) {
    var error = -1;
    this.metric = new callback(); // We can hide this later (just delete this)
    
    // check if input types are of correct type
    function checkPushParams() {
        for (var i = 0, j = arguments.length; i < j; i++) {
            var argumentType = arguments[i].constructor.name;
            if (argumentType !== "Number") {
                throw new TypeError('input param ' + i + ' must be of type "Number", but is ' + argumentType + ' instead');
            }
        }
    }
    
    /**
    * Updates metric with ground truth target value `yTrue` and estimated target value `yPred`.
    * @param {number} yTrue - Ground truth (correct) target value
    * @param {number} yPred - Estimated target value
    */
    this.push = function (yTrue, yPred, ref_num) {
        // set default values of optional input parameters
        var yPred = yPred == null ? 0 : yPred;
        var ref_num = ref_num == null ? 0 : ref_num;
        // check if input types are of correct type
        checkPushParams(yTrue, yPred, ref_num);
        // calculate the error with provided function from the callback function
        error = this.metric.update(yTrue, yPred);
    }
    
    /**
    * Returns error value.
    * @returns {number} Error value
    */
    this.getError = function () {
        return error;
    }
    
    /**
    * TODO
    * @returns TODO
    */
    this.save = function (fout) {
        fout.writeJson(this.metric.state);
        fout.flush();
        fout.close();
        return fout;
    }
    
    /**
    * TODO
    * @returns TODO
    */
    this.load = function (fin) {
        this.metric.state = fin.readJson();
        error = this.metric.state.error;
        fin.close();
        return fin;
    }

}

// MEAN ERROR (ME)
/**
* Create new (online) mean error instance.
* @class
* @classdesc Online Mean Error (ME) instance 
* @extends module:analytics~createOnlineMetric
*/
exports.MeanError = function (fin) {
    function metric() {
        this.name = "Mean Error"
        this.shortName = "ME"
        this.state = {
            sumErr: 0,
            count: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            var err = yTrue - yPred;
            this.state.sumErr += err;
            this.state.count++;
            this.state.error = this.state.sumErr / this.state.count;
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);

    return errorMetric;
};

// MEAN ABSOLUTE ERROR (MAE)
/**
* Create new (online) mean absolute error instance.
* @class
* @classdesc Online Mean Absolute Error (MAE) instance 
* @extends module:analytics~createOnlineMetric
*/
exports.MeanAbsoluteError = function (fin) {
    function metric() {
        this.name = "Mean Absolute Error"
        this.shortName = "MAE"
        this.state = {
            sumErr: 0,
            count: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            var err = yTrue - yPred;
            this.state.sumErr += Math.abs(err);
            this.state.count++;
            this.state.error = this.state.sumErr / this.state.count;
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);

    return errorMetric;
}

// MEAN SQUARE ERROR (MSE)
/**
* Create new (online) mean square error instance.
* @class
* @classdesc Online Mean Square Error (MSE) instance 
* @extends module:analytics~createOnlineMetric
*/
exports.MeanSquareError = function (fin) {
    function metric() {
        this.name = "Mean Square Error"
        this.shortName = "MSE"
        this.state = {
            sumErr: 0,
            count: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            var err = yTrue - yPred;
            this.state.sumErr += (err * err);
            this.state.count++;
            this.state.error = this.state.sumErr / this.state.count;
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);
    
    return errorMetric;
}

// ROOT MEAN SQUARE ERROR (RMSE)
/**
* Create new (online) root mean square error instance.
* @class
* @classdesc Online Root Mean Square Error (RMSE) instance 
* @extends module:analytics~createOnlineMetric
*/
exports.RootMeanSquareError = function (fin) {
    function metric() {
        this.name = "Root Mean Square Error"
        this.shortName = "RMSE"
        this.state = {
            sumErr: 0,
            count: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            var err = yTrue - yPred;
            this.state.sumErr += (err * err);
            this.state.count++;
            this.state.error = Math.sqrt(this.state.sumErr / this.state.count);
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);
    
    return errorMetric;
}

// MEAN ABSOLUTE PERCENTAGE ERROR (MAPE)
/**
* Create new (online) mean absolute percentage error instance.
* @class
* @classdesc Online Mean Absolute Percentage Error (MAPE) instance 
* @extends module:analytics~createOnlineMetric
*/
exports.MeanAbsolutePercentageError = function (fin) {
    function metric() {
        this.name = "Mean Absolute Percentage Error"
        this.shortName = "MAPE"
        this.state = {
            sumErr: 0,
            count: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            if (yTrue != 0) { // skip if yTrue is 0, otherwise we have devision by zero in the next step.
                var err = yTrue - yPred;
                this.state.sumErr += Math.abs(err / yTrue) * 100;
            }
            this.state.count++;
            this.state.error = this.state.sumErr / this.state.count;
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);
    
    return errorMetric;
}

// R SQUARED SCORE (R2)
/**
* Create new (online) R Square instance. This statistic measures how successful the fit is in explaining the variation of the data. Best possible score is 1.0, lower values are worse.
* @class
* @classdesc Online R Squared (R2) score instance 
* @extends module:analytics~createOnlineMetric
*/
exports.R2Score = function (fin) {
    function metric() {
        this.name = "R2 Score"
        this.shortName = "R2"
        this.state = {
            sst: 0,
            sse: 0,
            mean: 0,
            count: 0,
            sumTrue: 0,
            sumTrue2: 0,
            error: 0
        }
        // update function
        this.update = function (yTrue, yPred) {
            this.state.count++;
            this.state.sumTrue += yTrue;
            this.state.sumTrue2 += yTrue * yTrue;
            this.state.mean = this.state.sumTrue / this.state.count;
            //calculate R squared score 
            this.state.sse += (yTrue - yPred) * (yTrue - yPred);
            this.state.sst = this.state.sumTrue2 - this.state.count * this.state.mean * this.state.mean;
            if (this.state.sst == 0.0) {
                return (this.state.sse == 0.0) ? 1.0 : 0.0;
            }
            this.state.error = 1 - this.state.sse / this.state.sst;
            return this.state.error;
        }
    }
    // create new metric instance, and load state from fin in defined
    var errorMetric = new createOnlineMetric(metric);
    if (typeof fin !== 'undefined') errorMetric.load(fin);
    
    return errorMetric;
}

// About this module
exports.about = function () {
    var description = "Module with evalutaion metrics.";
    return description;
};