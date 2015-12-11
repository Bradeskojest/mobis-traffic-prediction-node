// I had to use bind in the bellow functions.
// Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind

var auth = require('./auth.js');

function setup(app, handlers) {

    // http://traffic.ijs.si/counters/routes
    app.get('/routes', handlers.service.handleGetRouterPaths.bind(handlers.service));
    // http://traffic.ijs.si/counters/close-base
    //app.get('/close-base', auth, handlers.service.handleCloseBase.bind(handlers.service));
    // http://traffic.ijs.si/counters/backup
    app.get('/backup', auth, handlers.service.handleBackup.bind(handlers.service));
    
    // http://traffic.ijs.si/counters/traffic-predictions/get-store-list
    app.get('/get-store-list', handlers.service.handleGetStoreList.bind(handlers.trafficPrediction));
    // http://traffic.ijs.si/counters/get-store-recs/predictionStores?limit=20 // limit is optional param to limit the size of output
    app.get('/get-store-recs/:store', handlers.service.handleGetStoreRecs.bind(handlers.service));
    
    // http://traffic.ijs.si/counters/traffic-predictions/get-sensors
    app.get('/traffic-predictions/get-sensors', handlers.trafficPrediction.handleGetSensors.bind(handlers.trafficPrediction));
    
    // http://traffic.ijs.si/counters/traffic-predictions
    app.get('/traffic-predictions', handlers.trafficPrediction.handleGetTrafficPredictions.bind(handlers.trafficPrediction));
    // http://traffic.ijs.si/counters/traffic-predictions/0855-11
    app.get('/traffic-predictions/:id', handlers.trafficPrediction.handleGetTrafficPredictionsById.bind(handlers.trafficPrediction));
    
    // http://traffic.ijs.si/counters/evaluations
    app.get('/evaluations', handlers.trafficPrediction.handleGetEvaluations.bind(handlers.trafficPrediction));
    // http://traffic.ijs.si/counters/evaluations/0855-11
    app.get('/evaluations/:id', handlers.trafficPrediction.handleGetEvaluationsById.bind(handlers.trafficPrediction));

    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json
    app.post('/traffic-predictions/add', handlers.trafficPrediction.handleAddMeasurement.bind(handlers.trafficPrediction));
    
    // http://traffic.ijs.si/counters/index.html
    //app.get('/')

}

exports.setup = setup;