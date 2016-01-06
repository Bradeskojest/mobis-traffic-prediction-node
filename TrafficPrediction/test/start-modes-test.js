var qm = require('qminer');
var assert = require('assert');
var TrafficPrediction = require('../TrafficPrediction.js');
//var predictionService = require('../predictionService.js');
var server = require('../server/server.js');
var path = require('path');
var fs = require('fs');
var request = require('supertest');
var env = process.env.NODE_ENV || 'test';
var config = require('../config.json')[env];

describe('Testing start modes:', function () {
    
    var url = config.trafficPredictionService.server.root;
    var base = undefined;
    var trafficPrediction = undefined;
    
    // test cleanCreate mode
    describe('cleanCreate', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'createClean' })
            // Initialize trafficPrediction service
            trafficPrediction = new TrafficPrediction();
            trafficPrediction.init(base);
            // Initialize and start serverserver
            server.init(trafficPrediction);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .end(done)
        });
        
        it('should have empty store', function () {
            assert.equal(base.store("trafficStore_0011_11").length, 0);
        });

    });
    
    // test cleanCreateLoad mode
    describe('cleanCreateLoad', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'createClean' })
            // Initialize trafficPrediction service
            var trafficPrediction = new TrafficPrediction();
            trafficPrediction.init(base);
            // Import initial data
            qm.load.jsonFile(base.store("trafficStore_0011_11"), path.join(__dirname, "../sandbox", config.data.measurements));
            // Initialize and start serverserver
            server.init(trafficPrediction);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficPrediction.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .end(done)
        });
        
        it('should not have empty store', function () {
            assert.notEqual(base.store("trafficStore_0011_11").length, 0);
        });
        
        it('should be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                    "DateTime": "2014-02-01T00:00:00", "NumOfCars": 228.0, "Gap": 15.8, 
                    "Occupancy": 18.0, "Speed": 94.0, "TrafficStatus": 1, 
                    "measuredBy": { "Name": "0011-11" }
                })
              .expect(200, done)
        });

    });
    
    
    // test open mode
    describe('open', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'open' })
            // Initialize trafficPrediction service
            var trafficPrediction = new TrafficPrediction();
            trafficPrediction.init(base);
            // Initialize and start serverserver
            server.init(trafficPrediction);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficPrediction.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .end(done)
        });
        
        it('should not have empty store', function () {
            assert.notEqual(base.store("trafficStore_0011_11").length, 0);
        });
        
        it('should be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                "DateTime": "2014-02-01T00:00:00", "NumOfCars": 228.0, "Gap": 15.8, 
                "Occupancy": 18.0, "Speed": 94.0, "TrafficStatus": 1, 
                "measuredBy": { "Name": "0011-11" }
              })
              .expect(200, done)
        });
        
        it('should have mobisModels loaded', function () {
            assert.notEqual(Object.keys(trafficPrediction.mobisModels).length, 0);
        });

    });
    
    // test openReadOnly mode
    describe('openReadOnly', function () {
        
        // create base and start server on localhost before each test
        beforeEach(function () {
            this.timeout(30000);
            // Initialise base in clean create mode   
            base = new qm.Base({ mode: 'openReadOnly' })
            // Initialize trafficPrediction service
            var trafficPrediction = new TrafficPrediction();
            trafficPrediction.init(base);
            // Initialize and start serverserver
            server.init(trafficPrediction);
            server.start(config.trafficPredictionService.server.port);
        });
        
        // after each test close base and server
        afterEach(function (done) {
            this.timeout(10000);
            trafficPrediction.shutdown();
            base.close();
            server.close(done);
        });
        
        it('should sucessfully start server', function (done) {
            request(url)
            .get("/")
            .set('Accept', 'application/json')
            .end(done)
        });
        
        it('should not have empty store', function () {
            assert.notEqual(base.store("trafficStore_0011_11").length, 0);
        });
        
        it('should not be able to add new record', function (done) {
            request(url)
              .post('/traffic-predictions/add')
              .send({
                "DateTime": "2014-02-01T00:00:00", "NumOfCars": 228.0, "Gap": 15.8, 
                "Occupancy": 18.0, "Speed": 94.0, "TrafficStatus": 1, 
                "measuredBy": { "Name": "0011-11" }
              })
              .expect(500, done)
        });
        
        it('should have mobisModels loaded', function () {
            assert.notEqual(Object.keys(trafficPrediction.mobisModels).length, 0);
        });

    });
    
    // test restoreFromBackup mode
    describe('restoreFromBackup', function () { 
        //TODO
    });

});