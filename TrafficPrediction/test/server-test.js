﻿var qm = require('qminer');
var assert = require('assert');
var trafficPrediction = require('../TrafficPrediction.js');
var server = require('../server/server.js');
var path = require('path');
var request = require('supertest');
var env = process.env.NODE_ENV || 'test';
var config = require('../config.json')[env];

// Set verbosity of QMiner internals
qm.verbosity(0);

// test if NODE_ENV is set to "test"
describe('Testing NODE_ENV', function () {
    it('should be set to "test"', function () {
        assert.equal(process.env.NODE_ENV, "test")
    });
})

// test services
describe('Server test', function () {
    var url = config.trafficPredictionService.server.root;
    var base = undefined;
    // get (first) admin name and password from config
    var admin = Object.keys(config.admins)[0];
    var password = config.admins[admin].password
    
    // create base and start server on localhost before each test
    beforeEach(function (done) { // this returns same error as *.js
        this.timeout(30000);
        // Initialise base in clean create mode   
        base = new qm.Base({
            mode: 'createClean', 
            //schemaPath: path.join(__dirname, '../sensors.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
            dbPath: path.join(__dirname, './db3'),
        })
        
        // Initialize trafficExpert service
        trafficPrediction.init(base);
        
        // Import initial data
        qm.load.jsonFile(base.store("trafficStore_0011_11"), path.join(__dirname, "../sandbox/data-small.json"));

        // Initialize and start serverserver
        server.init(base);
        server.start(config.trafficPredictionService.server.port);

        done();
    });
    
    // after each test close base and server
    afterEach(function (done) {
        this.timeout(10000);
        base.close();
        server.close(done);
    })
    
    // localhost:3333/
    it('#GET ' + url + "/", function (done) {
        request(url)
            .get("/")
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/close-base
    it('#GET ' + url + "/close-base", function (done) {
        request(url)
            .get("/get-store-list")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-list
    it('#GET ' + url + "/get-store-list", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-list")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/CounterNode
    it('#GET ' + url + "/get-store-recs/CounterNode", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/CounterNode")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/CounterNode?limit=5
    it('#GET ' + url + "/get-store-recs/CounterNode?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/CounterNode?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/resampledStore_0011_11?limit=5
    it('#GET ' + url + "/get-store-recs/resampledStore_0011_11?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/resampledStore_0011_11?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/Predictions_0011_11?limit=5
    it('#GET ' + url + "/get-store-recs/Predictions_0011_11?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/Predictions_0011_11?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/get-store-recs/Evaluation_0011_11?limit=5
    it('#GET ' + url + "/get-store-recs/Evaluation_0011_11?limit=5", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/get-store-recs/Evaluation_0011_11?limit=5")
            .auth(admin, password)
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    // localhost:3333/traffic-predictions/get-sensors
    it('#GET ' + url + "/traffic-predictions/get-sensors", function (done) {
        // get (first) admin name from config
        var adminName = Object.keys(config.admins)[0];
        request(url)
            .get("/traffic-predictions/get-sensors")
            .set('Accept', 'application/json')
            .expect(200, done)
    });

    // localhost:3333/traffic-predictions
    it('#GET ' + url + "/traffic-predictions", function (done) {
        request(url)
            .get("/traffic-predictions")
            .set('Accept', 'application/json')
            .expect(200, done)
    });
    
    //// localhost:3333/traffic-predictions/add
    it('#POST ' + url + "/traffic-predictions/add", function (done) {
        request(url)
          .post('/traffic-predictions/add')
          .send({
            "DateTime":"2014-02-01T00:00:00", "NumOfCars": 228.0, "Gap": 15.8, 
            "Occupancy": 18.0, "Speed": 94.0, "TrafficStatus": 1, 
            "measuredBy": { "Name": "0011-11" }
          })
          .expect(200, done)
    });
    
});

// references how to build rest api unit tests
// [1] https://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/
// [2] https://github.com/visionmedia/supertest
// [3] http://51elliot.blogspot.si/2013/08/testing-expressjs-rest-api-with-mocha.html
// [4] http://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/