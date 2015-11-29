﻿var qm = require('qminer');
var path = require('path');

createLoadStore = function (base) {
    var storeDef = {
        "name": "LoadStore",
        "fields": [
            { "name": "DateTime", "type": "datetime" },
            { "name": "NumOfCars", "type": "float", "null": true },
            { "name": "Gap", "type": "float", "null": true },
            { "name": "Occupancy", "type": "float", "null": true },
            { "name": "Speed", "type": "float", "null": true },
            { "name": "TrafficStatus", "type": "float", "null": true }
        ],
        "joins": [
            { "name": "measuredBy", "type": "field", "store": "CounterNode" },
        ]
    }
    
    // create stores if base is opened in faCreate (1) mode
    if (base.getStats().access == 1) {
        base.createStore(storeDef);
    }

    return base.store("LoadStore")
}

createNodeStore = function (base) {
    //TODO
    var storeDef = {
        "name" : "CounterNode",
        "fields" : [
            { "name" : "Name", "type" : "string", "primary" : true },
            { "name" : "Status", "type" : "string" , "null" : true },
            { "name" : "Title", "type" : "string" , "null" : true },
            { "name" : "Location", "type" : "float_pair", "null" : true  },
            { "name" : "GeoRssPoint", "type" : "string", "null" : true },
            { "name" : "GeoX", "type" : "float", "null" : true },
            { "name" : "GeoY", "type" : "float", "null" : true },
            { "name" : "Cluster", "type" : "string", "null" : true },
            { "name" : "MaxSpeed", "type" : "float", "null" : true },
            { "name" : "RoadDescription", "type" : "string", "null" : true },
            { "name" : "DirectionDescription", "type" : "string", "null" : true },
            { "name" : "RoadLocation", "type" : "float", "null" : true },
            { "name" : "DirectionLocation", "type" : "string", "null" : true },
            { "name" : "RoadSection", "type" : "float", "null" : true },
            { "name" : "Stationing", "type" : "float", "null" : true },
            { "name" : "Scope", "type" : "string", "null" : true },
            { "name" : "Source", "type" : "string", "null" : true },
            { "name" : "Description", "type" : "string", "null" : true },
            { "name" : "OsmWayId", "type" : "float", "null" : true },
            { "name" : "OsmNodeSourceId", "type" : "float", "null" : true },
            { "name" : "OsmNodeTargetId", "type" : "float", "null" : true }
        ],
        "keys" : [
            { "field" : "Name", "type" : "value" },
            { "field" : "Status", "type" : "value" },
            { "field" : "Cluster", "type" : "value" },
            { "field" : "Scope", "type" : "value" },
            { "field" : "Source", "type" : "value" }
        ]
    }
    
    // create stores if base is opened in faCreate (1) mode
    if (base.getStats().access == 1) {
        base.createStore(storeDef);     
    }
    
    // load records
    //qm.load.jsonFile(base.store('CounterNode'), path.join(__dirname , '../../../sandbox/countersNodes.txt'));
    qm.load.jsonFile(base.store('CounterNode'), path.join(__dirname , '../../../sandbox/countersNodes_big.txt'));

    // Load short version (only 5 nodes)
    //qm.load.jsonFile(base.store('CounterNode'), path.join(__dirname , './countersNodes.txt'));

    return base.store("CounterNode")
}

createMeasurementStores = function (base) {
    
    var result = {
        trafficStores: [],
        resampledStores: [],
        evaluationStores: [],
        predictionStores: []
    }
    
    var createStores = function (name) {
            
        name = name.replace("-", "_");
            
        var trafficStoreNm = "trafficStore_" + name;
        var resampledStoreNm = "resampledStore_" + name;
        var evaluationStoreNm = "Evaluation_" + name;
        var predictionStoreNm = "Predictions_" + name;
        
        var storeDef = [
            {
                "name": trafficStoreNm,
                "fields": [
                    { "name": "DateTime", "type": "datetime", "primary": true },
                    { "name": "NumOfCars", "type": "float", "null": true },
                    { "name": "Gap", "type": "float", "null": true },
                    { "name": "Occupancy", "type": "float", "null": true },
                    { "name": "Speed", "type": "float", "null": true },
                    { "name": "TrafficStatus", "type": "float", "null": true },
                    { "name": "Replaced", "type": "bool", "null": true, "default": false }
                ],
                "joins": [
                    { "name": "measuredBy", "type": "field", "store": "CounterNode" },
                    { "name": "Predictions", "type": "index", "store": predictionStoreNm }
                ]
            },
            {
                "name": resampledStoreNm,
                "fields": [
                    { "name": "DateTime", "type": "datetime", "primary": true },
                    { "name": "NumOfCars", "type": "float", "null": true },
                    { "name": "Gap", "type": "float", "null": true },
                    { "name": "Occupancy", "type": "float", "null": true },
                    { "name": "Speed", "type": "float", "null": true },
                    { "name": "TrafficStatus", "type": "float", "null": true }
                ],
                "joins": [
                    { "name": "measuredBy", "type": "field", "store": "CounterNode" },
                    { "name": "Predictions", "type": "index", "store": predictionStoreNm }
                ]
            },
            {
                "name": evaluationStoreNm,
                "fields": [
                    { "name": "Name", "type": "string", "null": true },

                    { "name": "NumOfCars", "type": "float", "null": true },
                    { "name": "Gap", "type": "float", "null": true },
                    { "name": "Occupancy", "type": "float", "null": true },
                    { "name": "Speed", "type": "float", "null": true },
                    { "name": "TrafficStatus", "type": "float", "null": true }
                ]
            },
            {
                "name": predictionStoreNm,
                "fields": [
                    { "name": "Name", "type": "string", "null": true },
                    { "name": "OriginalTime", "type": "datetime", "null": true },
                    { "name": "PredictionTime", "type": "datetime", "null": true },
                    { "name": "PredictionHorizon", "type": "float", "null": true },
                    { "name": "UpdateCount", "type": "float", "null": true },

                    { "name": "NumOfCars", "type": "float", "null": true },
                    { "name": "Gap", "type": "float", "null": true },
                    { "name": "Occupancy", "type": "float", "null": true },
                    { "name": "Speed", "type": "float", "null": true },
                    { "name": "TrafficStatus", "type": "float", "null": true }
                ],
                "joins": [
                    { "name": "Evaluation", "type": "index", "store": evaluationStoreNm },
                    { "name": "Target", "type": "field", "store": resampledStoreNm }
                ]
            }
        ];
        
        // create stores if base is opened in faCreate (1) mode
        if (base.getStats().access == 1) {
            base.createStore(storeDef);
        }

        result.trafficStores[name] = base.store(trafficStoreNm);
        result.resampledStores[name] = base.store(resampledStoreNm);
        result.evaluationStores[name] = base.store(evaluationStoreNm);
        result.predictionStores[name] = base.store(predictionStoreNm);
    }
    
    if (base.store('CounterNode') == null) { throw new Error("Store \'CounterNode\' doesn't exist.") };
    
    base.store('CounterNode').each(function (sensor) { createStores(sensor.Name) })
    return result;
}

exports.createLoadStore = createLoadStore;
exports.createNodeStore = createNodeStore;
exports.createMeasurementStores = createMeasurementStores;

