# TrafficPrediction

### Installation

```
npm install TrafficPrediction
```

### Starting the service

Starting the service (by default the service is run in `cleanCreate` mode).
```
npm start
```

---

##### Running the service in different modes

There are different modes in which we can run the service:

  1. **cleanCreate:** `npm start cleanCreate` - Service will create a new database. Warning: all previous data in store will be deleted. This the default mode.
  2. **cleanCreateLoadMode:** `npm start cleanCreateLoadMode` -  Service will create a new database and load the data defined in createBase.js file. Warning: all previous data in store will be deleted.
  3. **openMode:** `npm start openMode` - Service will open old database. If the base was not closed properly, this the service will not be able to start. In this case, `cleanCreate` mode has to be used.
  4. **readOnlyMode:** `npm start readOnlyMode` - Service will open database in READ ONLY mode. Meaning that it will not be possible to write new instances into the store. 
  5. **openFromBackup:** `npm start openFromBackup` - Service will load database from backup.

---

##### Running the service in production mode

By default, service is started in `development` mode. If we want to run the service in `production` or `test` mode, we have to define variable NODE_ENV=production.  

Example:
```
NODE_ENV=production&& npm start
```
  
