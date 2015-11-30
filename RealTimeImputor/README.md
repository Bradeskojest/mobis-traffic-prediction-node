# RealTimeImputor
 
 Service retrieves real time loop counter data from opendata.si and pushes it to [TrafficPrediction module](https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/TrafficPrediction).

### Installation

```
npm install
```

### Starting the service

Starting the service (by default the service is run in `cleanCreate` mode).
```
node index.js
```
---

##### Running the service in production mode

By default, service is started in `development` mode on localhost. If we want to run the service in `production` or `test` mode, we have to define variable NODE_ENV=production.  

Example:
```
set NODE_ENV=production&& node index.js
```
Root, port and other configurations should be specified in [config.json](https://github.com/bkazic/mobis-traffic-prediction-node/blob/master/TrafficPrediction/config.json) file.
