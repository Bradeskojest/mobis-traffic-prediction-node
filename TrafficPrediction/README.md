# TrafficPrediction

[![Build Status](https://travis-ci.org/bkazic/mobis-traffic-prediction-node.svg?branch=master)](https://travis-ci.org/bkazic/mobis-traffic-prediction-node)
[![Build status](https://ci.appveyor.com/api/projects/status/ikm5l9w9820ddr3g/branch/master?svg=true)](https://ci.appveyor.com/project/bkazic/mobis-traffic-prediction-node/branch/master)

Main module that accepts raw traffic measurement and performs advanced analytics.

### Installation

```
npm install TrafficPrediction
```
- download db.zip from the [latest release](https://github.com/bkazic/mobis-traffic-prediction-node/releases) 
- unzip it to [./TrafficPrediction](https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/TrafficPrediction) folder.
- edit [config.json](https://github.com/bkazic/mobis-traffic-prediction-node/blob/master/TrafficPrediction/config.json) if needed (to change root, port, admins, ...)

### Starting the service

Starting the service (by default the service is run in `cleanCreate` mode).
```
npm start
```

---

##### Running the service in different modes

There are different modes in which we can run the service:

  1. **cleanCreate:** `npm start cleanCreate` - Service will create a new database. Warning: all previous data in store will be deleted. This the default mode.
  2. **cleanCreateLoad:** `npm start cleanCreateLoad` -  Service will create a new database and load the data defined in createBase.js file. Warning: all previous data in store will be deleted.
  3. **openMode:** `npm start open` - Service will open old database. If the base was not closed properly, this the service will not be able to start. In this case, `cleanCreate` mode has to be used.
  4. **openReadOnly:** `npm start openReadOnly` - Service will open database in READ ONLY mode. Meaning that it will not be possible to write new instances into the store. 
  5. **restoreFromBackup:** `npm start restoreFromBackup` - Service will load database from backup and copy it to db.

---

##### Running the service in production mode

By default, service is started in `development` mode on localhost. If we want to run the service in `production` or `test` mode, we have to define variable NODE_ENV=production.  

Example:
```
set NODE_ENV=production&& npm start
```
Root, port and other configurations should be specified in [config.json](https://github.com/bkazic/mobis-traffic-prediction-node/blob/master/TrafficPrediction/config.json) file.
