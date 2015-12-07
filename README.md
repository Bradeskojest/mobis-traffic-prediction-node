# [MobiS] Traffic Prediction Service 

[![Build Status](https://travis-ci.org/bkazic/mobis-traffic-prediction-node.svg?branch=master)](https://travis-ci.org/bkazic/mobis-traffic-prediction-node)
[![Build status](https://ci.appveyor.com/api/projects/status/ikm5l9w9820ddr3g/branch/master?svg=true)](https://ci.appveyor.com/project/bkazic/mobis-traffic-prediction-node/branch/master)

MobiS traffic prediction service is open-source data analytics application for processing real-time traffic streams providing online short-term traffic forecasts. Services provides forecasts for different traffic parameters (*speed, flow, occupancy, traffic-status*), for various forecasting horizons (from *1h*, to *24h*) into the future.

Service provides:
- [REST APIs](http://mustang.ijs.si:9567/routes) - used for pusing raw data (loop counters or bluetooth sensors) and retrieving processed data 
- [Visualisation](http://mustang.ijs.si:9567/) - used for visual investigation of current traffic and predicted traffic
- [Traffic Expert](http://green.infotrip.gr/mobis/) - is aplication build on top of this services, used by traffic experts in Thessaloniki, Greece

**Keywords:** *short term traffic prediction, traffic analysis, data analytics, machine learning*


## Install 
This repository contains 3 different services with instructions:
- [TrafficPrediction](https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/TrafficPrediction) - 
    main module that accepts measurement records nad performs advanced analytics.
- [RealTimeImputor](https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/RealTimeImputor) - 
    fetches real time data from [opendata.si](http://opendata.si/promet/counters/) and pushes it to TrafficPrediction module.
- [Imputor](https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/Imputor) - 
    pushes saved batch data to TrafficPrediction module.
    

### Prerequisites
Service is designed on top of [QMiner](https://github.com/qminer/qminer) - analytical platform for 
large-scale real-time streams, containing structured and unstructured data. Development of 
[MobisTrafficPrediction](https://github.com/bkazic/mobis-traffic-prediction-node) service 
also contributed to development of [QMiner](https://github.com/qminer/qminer) platform.

Service is designed as [Node.js](https://nodejs.org/en/) web application, and therfore requires: 
- node.js **v0.12** [x64](https://nodejs.org/download/release/v0.12.7/x64/node-v0.12.7-x64.msi) or 
[x86](https://nodejs.org/download/release/v0.12.7/node-v0.12.7-x86.msi), 
- npm **v2.11** or higher.


## Acknowledgments

Service is developed by [AILab](http://ailab.ijs.si/) at 
[Jozef Stefan Institute](http://www.ijs.si/) for the purpose of European FP7 project [MobiS](https://sites.google.com/site/mobiseuprojecteu/).

The authors would like to acknowledge funding from the European Union Seventh Framework Programme, 
under Grant Agreements 318452 ([MobiS](https://sites.google.com/site/mobiseuprojecteu/)), and
European Union's Horizon 2020 research and innovation programme under grant agreement 
No 636160-2 ([Optimum](http://www.optimumproject.eu/)).

![](http://ailab.ijs.si/~blazf/eu.png)
