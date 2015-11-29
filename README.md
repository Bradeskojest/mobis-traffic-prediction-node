# [MobiS] Traffic Prediction Service 
**TODO:** Description 

- **TODO:** Povej da je zadeva misljena kot REST service (mogoce bi mogu nardit tle eno dokumentacijo kot je blo prje na qm)
- **TODO:** Je pa narjen tud front end demo. Link to prototype!
- **TODO:** morda link na trafficExperta (v smislu da je narjen on top of te aplikacije)

### Prerequisites
Service is designed on top of [QMiner](https://github.com/qminer/qminer) - analytical platform for 
large-scale real-time streams containing structured and unstructured data. Development of 
[MobisTrafficPrediction](https://github.com/bkazic/mobis-traffic-prediction-node) service 
also contributed to [QMiner](https://github.com/qminer/qminer) platform.

Service is designed as [Node.js](https://nodejs.org/en/) web application, and therfore requires: 
- node.js **v0.12** [x64](https://nodejs.org/download/release/v0.12.7/x64/node-v0.12.7-x64.msi) or 
[x86](https://nodejs.org/download/release/v0.12.7/node-v0.12.7-x86.msi), 
- npm **v2.11** or higher.

### Install 
This repository contains 3 different services with instructions:
- [TrafficPrediction]
    (https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/TrafficPrediction) - 
    main module that accepts measurement records nad performs advanced analytics.
- [RealTimeImputor]
    (https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/RealTimeImputor) - 
    fetches real time data from [opendata.si] (http://opendata.si/promet/counters/) and pushes it to TrafficPrediction module.
- [Imputor]
    (https://github.com/bkazic/mobis-traffic-prediction-node/tree/master/Imputor) - 
    pushes saved batch data to TrafficPrediction module.


## Acknowledgments

Traffic prediction service is developed by  by [AILab](http://ailab.ijs.si/) at 
[Jozef Stefan Institute](http://www.ijs.si/).

The authors would like to acknowledge funding from the European Union Seventh Framework Programme, 
under Grant Agreements 318452 ([Mobis](https://sites.google.com/site/mobiseuprojecteu/)), and
European Union's Horizon 2020 research and innovation programme under grant agreement 
No 636160-2 ([Optimum](http://www.optimumproject.eu/)).

![](http://ailab.ijs.si/~blazf/eu.png)
