var map;
var horizons = [0,1,3,6,9,12,15,18];
var horizon=0;
var green;
var yellow;
var orange;
var limit;
var sensorMarkers = [];
var sensorId;
var sensorTitle;
var shutDown = true;
var tresholds = "status";
var sensorsState;
var evaluations;
var evaluation = "R2";
var evalAttribute = "NumOfCars";
var currentInfoWindow;

/**
 * Initialization
 */
$(document).ready(function () {
	var mapProp = {
        center: new google.maps.LatLng(46, 15.6),
        zoom: 9,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
		
	$( "#tresholds" ).toggle(false);
	$( "#charts" ).toggle(true);
	
	$(function() {
		$( "#slider-range-min" ).slider({
			range: "min",
			value: 0,
			min: 0,
			max: horizons.length - 1,
			step: 1,
			slide: function( event, ui ) {
				horizon = horizons[ui.value];
				$( "#amount" ).val(horizons[ui.value]);
				removeMarkers();		
				if (tresholds=="evaluation") {
					drawOnMap(evaluations, horizons[ui.value]);
				}	
				else {
					drawOnMap(sensorsState, horizons[ui.value]);
				}
				// getSensors(horizons[ui.value]);
				getChartData(sensorId, sensorTitle);
			}
		});
		$( "#amount" ).val( $( "#slider-range-min" ).slider( "value" ) );
		
	});
	
	//------EVALUATION---------------------------------------------------------------------
	$( "#evaluation-button" ).click(function() {
		$( "#charts" ).toggle(false);
		$( "#tresholds" ).toggle(false);
		$( "#eval" ).toggle(true);
	});
	
	//------TRESHOLDS---------------------------------------------------------------------
	$( "#treshold-options-button" ).click(function() {
		$( "#charts" ).toggle(false);
		$( "#eval" ).toggle(false);
		$( "#tresholds" ).toggle(true);
	});
	
	$('#eval-attribute').change( function() {
		evalAttribute = $(this).val();
		drawOnMap(evaluations, horizon);
	});
	
	
	$("input[name='slider']").change(function() {
		if ($("input[name='slider']:checked").val() === 'speed') {
			uncoverSpeedSliders();
			tresholds = "speed";
			green = $('#slider-range-green').slider("option", "value")/100;
			yellow = $('#slider-range-yellow').slider("option", "value")/100;
			orange = $('#slider-range-orange').slider("option", "value")/100;
			drawOnMap(sensorsState, horizon);
		}
		else if ($("input[name='slider']:checked").val() === 'status') {
			uncoverStatusSliders();
			tresholds = "status";
			green = $('#slider-range-green-status').slider("option", "value");
			yellow = $('#slider-range-yellow-status').slider("option", "value");
			orange = $('#slider-range-orange-status').slider("option", "value");
			drawOnMap(sensorsState, horizon);
		}
		else if ($("input[name='slider']:checked").val() === 'evaluation') {			
			if($("input[name='eval-type']:checked").val() === 'MAPE') {
				evaluation = "MAPE";
			}
			else {
				evaluation = "R2";
			}
			uncoverEvaluationSliders();
			tresholds = "evaluation";
			green = $('#slider-range-green-eval').slider("option", "value")/100;
			yellow = $('#slider-range-yellow-eval').slider("option", "value")/100;
			orange = $('#slider-range-orange-eval').slider("option", "value")/100;
			drawOnMap(evaluations, horizon);			
		}
	});
	
	$("input[name='eval-type']").change(function() {
		if($("input[name='eval-type']:checked").val() === 'MAPE') {
			evaluation = "MAPE";
			$( "#slider-range-green-eval" ).slider({value:30});
			$("#green-eval").val(30);
			green = 30;
			$( "#slider-range-yellow-eval" ).slider({value:40});
			$("#yellow-eval").val(40);
			yellow = 40;
			$( "#slider-range-orange-eval" ).slider({value:60});
			$("#orange-eval").val(60);
			orange = 60;
		}
		else {
			evaluation = "R2";
			$( "#slider-range-green-eval" ).slider({value:80});
			$("#green-eval").val(80);
			green = 0.8;
			$( "#slider-range-yellow-eval" ).slider({value:60});
			$("#yellow-eval").val(60);
			yellow = 0.6;
			$( "#slider-range-orange-eval" ).slider({value:40});
			$("#orange-eval").val(40);
			orange = 0.4;
		}
		uncoverEvaluationSliders();
		tresholds = "evaluation";
		// green = $('#slider-range-green-eval').slider("option", "value");
		// yellow = $('#slider-range-yellow-eval').slider("option", "value");
		// orange = $('#slider-range-orange-eval').slider("option", "value");
		drawOnMap(evaluations, horizon);	
	});
	
	//-----speed-based------------
	$(function() {
		$( "#slider-range-green" ).slider({
			range: "min",
			value: 10,
			min: 0,
			max: 50,
			step: 0.1,
			slide: function( event, ui ) {
				green = ui.value/100;
				$( "#green" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#green").val($("#slider-range-green").slider("value"));
		$("#slider-range-green").slider().slider("pips", {
    	    rest: "label",
			step: 50
		});
		
	});
	
	$(function() {
		$( "#slider-range-yellow" ).slider({
			range: "min",
			value: 20,
			min: 0,
			max: 50,
			step: 0.1,
			slide: function( event, ui ) {
				yellow = ui.value/100;
				$( "#yellow" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#yellow").val($("#slider-range-yellow").slider("value"));
		$("#slider-range-yellow").slider().slider("pips", {
    	    rest: "label",
			step: 50
		});
		
	});
	
	$(function() {
		$( "#slider-range-orange" ).slider({
			range: "min",
			value: 30,
			min: 0,
			max: 50,
			step: 0.1,
			slide: function( event, ui ) {
				orange = ui.value/100;
				$( "#orange" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#orange").val($("#slider-range-orange").slider("value"));
		$("#slider-range-orange").slider().slider("pips", {
    	    rest: "label",
			step: 50
		});
		
	});
	
	//-----status-based------------
	$(function() {
		$( "#slider-range-green-status" ).slider({
			range: "min",
			value: 1,
			min: 0,
			max: 5,
			step: 1,
			slide: function( event, ui ) {
				green = ui.value;
				$( "#green-status" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#green-status").val($("#slider-range-green-status").slider("value"));
		$("#slider-range-green-status").slider().slider("pips", {
    	    rest: "label",
			step: 1
		});		
	});
	
	$(function() {
		$( "#slider-range-yellow-status" ).slider({
			range: "min",
			value: 2,
			min: 0,
			max: 5,
			step: 1,
			slide: function( event, ui ) {
				yellow = ui.value;
				$( "#yellow-status" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#yellow-status").val($("#slider-range-yellow-status").slider("value"));
		$("#slider-range-yellow-status").slider().slider("pips", {
    	    rest: "label",
			step: 1
		});		
	});
	
	$(function() {
		$( "#slider-range-orange-status" ).slider({
			range: "min",
			value: 4,
			min: 0,
			max: 5,
			step: 1,
			slide: function( event, ui ) {
				orange = ui.value;
				$( "#orange-status" ).val(ui.value);
				drawOnMap(sensorsState, horizon);
				// getSensors(horizon);
			}
		});
		$("#orange-status").val($("#slider-range-orange-status").slider("value"));
		$("#slider-range-orange-status").slider().slider("pips", {
    	    rest: "label",
			step: 1
		});		
	});
	
	//-----evaluation-based------------
	$(function() {
		$( "#slider-range-green-eval" ).slider({
			range: "min",
			value: 80,
			min: 0,
			max: 100,
			step: 1,
			slide: function( event, ui ) {
				if (evaluation==="R2") {
					green = ui.value/100;
				}
				else {
					green = ui.value;					
				} 				
				$( "#green-eval" ).val(ui.value);
				drawOnMap(evaluations, horizon);
			}
		});
		$("#green-eval").val($("#slider-range-green-eval").slider("value"));
		$("#slider-range-green-eval").slider().slider("pips", {
    	    rest: "label",
			step: 10
		});		
	});
	
	$(function() {
		$( "#slider-range-yellow-eval" ).slider({
			range: "min",
			value: 60,
			min: 0,
			max: 100,
			step: 1,
			slide: function( event, ui ) {
				if (evaluation==="R2") {
					yellow = ui.value/100;
				}
				else {
					yellow = ui.value;					
				} 	
				$( "#yellow-eval" ).val(ui.value);
				drawOnMap(evaluations, horizon);
			}
		});
		$("#yellow-eval").val($("#slider-range-yellow-eval").slider("value"));
		$("#slider-range-yellow-eval").slider().slider("pips", {
    	    rest: "label",
			step: 10
		});		
	});
	
	$(function() {
		$( "#slider-range-orange-eval" ).slider({
			range: "min",
			value: 40,
			min: 0,
			max: 100,
			step: 1,
			slide: function( event, ui ) {
				if (evaluation==="R2") {
					orange = ui.value/100;
				}
				else {
					orange = ui.value;					
				} 	
				$( "#orange-eval" ).val(ui.value);
				drawOnMap(evaluations, horizon);
			}
		});
		$("#orange-eval").val($("#slider-range-orange-eval").slider("value"));
		$("#slider-range-orange-eval").slider().slider("pips", {
    	    rest: "label",
			step: 10
		});		
	});
	
	//------GRAPHS---------------------------------------------------------------------
	$( "#graphs-button" ).click(function() {
		$( "#tresholds" ).toggle(false);
		$( "#eval" ).toggle(false);
		$( "#charts" ).toggle(true);
	});
	
	$(function() {
		$( "#slider-range-limit" ).slider({
			range: "min",
			value: 72,
			min: 0,
			max: 170,
			step: 1,
			slide: function( event, ui ) {
				limit = ui.value;
				$( "#limit" ).val(ui.value);
				getChartData(sensorId, sensorTitle)
			}
		});
		$("#limit").val($("#slider-range-limit").slider("value"));
	});
	
		
	
	green = 1;
	yellow = 2;
	orange = 4;
	limit = 72;
	getSensors(0); // ONLY THIS CALL STAYS! save result in global var
	getChartData();
	getEvaluations(); //save result in global var
	uncoverStatusSliders();
});


function removeMarkers(){
    for(var i=0; i<sensorMarkers.length; i++){
        sensorMarkers[i].setMap(null);
    }
}

function getEvaluations() {
	$.ajax({
        type: 'GET',     
        contentType: "application/json",
        dataType: 'json',
        url: './evaluations',                      
        success: function (result) {
			evaluations = result;
			if (result.Error) {
				alert("Traffic API is making a backup and is currently unavailable. "+ 
				"Refresh page in few minutes.");
			}
			getEvalForSensor();
        },
        error: function (error) {
            console.log("some error in fetching the sensors: " + JSON.stringify(error));
        }
    });  
}

function getSensors(horizon) {
	$.ajax({
        type: 'GET',
        // data: JSON.stringify({ fleet:"TT" }),        
        contentType: "application/json",
        dataType: 'json',
        url: './traffic-predictions',                      
        success: function (result) {
            sensorsState = result;
			if (result.Error) {
				alert("Traffic API is making a backup and is currently unavailable. "+ 
				"Refresh page in few minutes.");
			}	
			drawOnMap(result, horizon);
        },
        error: function (error) {
            console.log("some error in fetching the sensors: " + JSON.stringify(error));
        }
    });  
}

function drawOnMap(result, horizon){
	removeMarkers();
	var strt = new Date().getTime();
	for (var row in result) {
		showSensor(result[row], horizon);
		console.log(result[row].$id);
	}
	var end = new Date().getTime();
	//console.log("Drawing took: " + (end - strt));
}

function showSensor(sensor, horizon) {
    // var pin = "./images/pin_sensor_" + setMarkerColor(sensor, horizon) + ".png"; // for NextPin icons
	var pin = "./images/pin_sensor_" + setMarkerColor(sensor, horizon) + ".gif"; // for Dars icons
	// var image = new google.maps.MarkerImage(
    //         pin,
    //         null, /* size is determined at runtime */
    //         null, /* origin is 0,0 */
    //         null, /* anchor is bottom center of the scaled image */
    //         new google.maps.Size(40, 40)
	// );  
	var content = selectContent(sensor, horizon);
	var infowindow = new google.maps.InfoWindow({
        content: content
    });
	infowindow.addListener('closeclick', function(){
		shutDown = true;
	});
	var marker = new google.maps.Marker({ 
		position: new google.maps.LatLng(addNoise()*sensor.measuredBy.Location[0], 
										addNoise()*sensor.measuredBy.Location[1]), 
		map: map,
		icon: pin,
		title: sensor.measuredBy.Description
	});
	marker.id = sensor.measuredBy.Name.replace('-','_');
    marker.addListener('click', function() {
		if (currentInfoWindow){
			currentInfoWindow.close();
		}
		sensorId = this.id;
		sensorTitle = this.title;
		shutDown = false;
		currentInfoWindow = infowindow;
        infowindow.open(map, marker);
		if($( "#tresholds" ).is(":visible")){
			$( "#charts" ).toggle(true);			
		}
		
		getChartData(sensorId, sensorTitle);
		getEvalForSensor(sensorId, sensorTitle);
    });
	marker.addListener('mouseover', function() {
		if (shutDown){ 
			infowindow.open(map, marker);
		}
    });
	marker.addListener('mouseout', function() {
		if (shutDown) {
			infowindow.close();	
		}
    });
	sensorMarkers.push(marker);
}

function selectContent(sensor, horizon) {
	var content="";
	var ind;
	if(tresholds=="evaluation"){
		var h = horizon;
		if (horizon == 0) {
			h=1;
		}
		ind = 0; //if horizon = 1 or 0
		if (horizon > 1) {
			ind = horizon-2/3*horizon;
		}
		// var e =3; //evaluation = R2
		// if (evaluation=="MAPE") {
		// 	e = 2;
		// }
		if (sensor.Predictions[ind].Evaluation[2]) {
			var attribute = getAttributeString();
			content = 	"<b>" + sensor.measuredBy.Title +"</b><br>" +
						"Evaluated attribute: " + attribute + "<br>"+
						"Evaluation metrics: " + evaluation + "<br>" +
						"Horizon: " + h + "<br>" +
						"MAPE: " +Math.floor(sensor.Predictions[ind].Evaluation[2][evalAttribute]*100)/100 + "<br>" + 
						"R2: " +Math.floor(sensor.Predictions[ind].Evaluation[3][evalAttribute]*100)/100 + "<br>" +
						"MAE: " +Math.floor(sensor.Predictions[ind].Evaluation[0][evalAttribute]*100)/100 + "<br>" +
						"RMSE: " +Math.floor(sensor.Predictions[ind].Evaluation[1][evalAttribute]*100)/100;
		}
		else {
			console.log("Sensor without evaluation: " + sensor.measuredBy.Name);
		}
		return content;
	}
	else {
		if (horizon == 0) {
			content = 	"<b>" + sensor.measuredBy.Title +"</b><br>" +
						"Status at "+sensor.DateTime.replace("T"," ")+":<br>" +
						"Traffic status: " +sensor.TrafficStatus + "<br>" +
						"Speed: " +sensor.Speed + "<br>" +
						"Flow: " + sensor.NumOfCars + "<br>" +
						"Gap: " +sensor.Gap + "<br>" +
						"Occupancy: " +sensor.Occupancy + "<br>";
			document.getElementById("date").innerHTML = sensor.DateTime.replace("T"," ");
			return content;
		}
		else if (horizon == 1) {
			ind = 0;
		}
		else {
			ind = horizon-2/3*horizon;
		}
		content = 	"<b>" + sensor.measuredBy.Title +"</b><br>" +
					"Prediction time "+sensor.Predictions[ind].PredictionTime.replace("T"," ")+":<br>" + 
					"Traffic status: " +sensor.Predictions[ind].TrafficStatus + "<br>" +
					"Speed: " +Math.round(sensor.Predictions[ind].Speed*10)/10 + "<br>" +
					"Flow: " + Math.round(sensor.Predictions[ind].NumOfCars*10)/10 + "<br>" +
					"Occupancy: " +Math.round(sensor.Predictions[ind].Occupancy*10)/10 + "<br>" +
					"Update count: "+ sensor.Predictions[ind].UpdateCount + "<br>";
		
		document.getElementById("date").innerHTML = sensor.Predictions[ind].PredictionTime.replace("T"," ");  
		
		return content;
	}
				
}

function setMarkerColor(sensor, horizon) {
	var currentStatus;
	if (tresholds=="speed") { //speed-based tresholds
		var max = sensor.measuredBy.MaxSpeed;
		var speed;
		if (horizon == 0) {
			speed = sensor.Speed;
		}
		else if (horizon == 1) {
			speed = sensor.Predictions[0].Speed;
		}
		else {
			speed = sensor.Predictions[horizon-2/3*horizon].Speed;
		}
		if (speed == 0) {
			return "green";		
		}
		currentStatus = 1 - speed/max;
	} 
	else if (tresholds=="status"){		//status-based tresholds
		if (horizon == 0) {
			currentStatus = sensor.TrafficStatus;
		}
		else if (horizon == 1) {
			currentStatus = sensor.Predictions[0].TrafficStatus;
		}
		else {
			currentStatus = sensor.Predictions[horizon-2/3*horizon].TrafficStatus;
		}
	}
	else if (tresholds=="evaluation" && evaluation==="MAPE"){		//evaluation-based tresholds
		if ((horizon == 0 || horizon==1) && sensor.Predictions[0].Evaluation[2]) {
			// currentStatus = sensor.Predictions[0].Evaluation[2].NumOfCars;
			currentStatus = sensor.Predictions[0].Evaluation[2][evalAttribute];
		}
		else {
			if (sensor.Predictions[horizon-2/3*horizon].Evaluation[2]) {
				// currentStatus = sensor.Predictions[horizon-2/3*horizon].Evaluation[2].NumOfCars;
				currentStatus = sensor.Predictions[horizon-2/3*horizon].Evaluation[2][evalAttribute];
			}
			else {
				console.log("Sensor without MAPE evaluation: " + sensor.measuredBy.Name);
			}
		}
	}
	else if (tresholds=="evaluation" && evaluation==="R2"){		//evaluation-based tresholds
		if ((horizon == 0 || horizon==1) && sensor.Predictions[0] && sensor.Predictions[0].Evaluation[3]) {
			// currentStatus = sensor.Predictions[0].Evaluation[3].NumOfCars;
			currentStatus = sensor.Predictions[0].Evaluation[3][evalAttribute];
		}
		else {
			if (sensor.Predictions[horizon-2/3*horizon].Evaluation[3]) {
				// currentStatus = sensor.Predictions[horizon-2/3*horizon].Evaluation[3].NumOfCars;
				currentStatus = sensor.Predictions[horizon-2/3*horizon].Evaluation[3][evalAttribute];
			}
		}
		if (currentStatus >= green) {
			return "green";
		}
		else if (green > currentStatus && currentStatus >= yellow) {
			return "yellow";
		}
		else if (yellow > currentStatus && currentStatus >= orange) {
			return "orange";
		}
		else {
			return "red";
		}	
	}
	
	if (currentStatus <= green) {
		return "green";
	}
	else if (green < currentStatus && currentStatus <= yellow) {
		return "yellow";
	}
	else if (yellow < currentStatus && currentStatus <= orange) {
		return "orange";
	}
	// if (0.1 < deviance)
	else {
		return "red";
	}	
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function addNoise() {
    return Math.random() * (1.00001 - 0.99999) + 0.99999;
}

/**
 * charts
 */
// $(function () {
function getChartData(counterId, title) {
	if (!counterId) {
		counterId = "0180_11";
	}
	if (!title) {
		title = "AC-A1, LJ (vzh. obvoznica) : Litijska - Malence";
    }

	$.ajax({
        type: 'GET',     
        contentType: "application/json",
        dataType: 'json',
        url: './traffic-predictions/' + counterId + "?size=" + limit,                      
        success: function (result) {
			if (result.Error) {
				alert("Traffic API is making a backup and is currently unavailable. "+ 
				"Refresh page in few minutes.");
			}	
			document.getElementById("sensor-data").innerHTML = "<div class='sensor-data-title'>" + title + "</div>" 
					+ " (Sensor ID: " + counterId +")";
			var ind = 0;
			var h = horizon;
			if (horizon > 1) {
				ind = horizon-2/3*horizon;
			}
			else {
				h = 1;
			} 			
			var table = {};
			table.dates = [];
			table.dates.push("date");
			table.currentSpeed = [];
			table.currentSpeed.push("Real speed");
			table.currentSpeed.push.apply(table.currentSpeed, createArray(h, null));
			table.predictionsSpeed = [];
			table.predictionsSpeed.push("Predicted speed")
			table.currentNumOfCars = [];
			table.currentNumOfCars.push("Real traffic flow");
			table.currentNumOfCars.push.apply(table.currentNumOfCars, createArray(h, null));
			table.predictionsNumOfCars = [];
			table.predictionsNumOfCars.push("Predicted traffic flow");
			table.currentStatus = [];
			table.currentStatus.push("Real Traffic Status");
			table.currentStatus.push.apply(table.currentStatus, createArray(h, null));
			table.predictionsStatus = [];
			table.predictionsStatus.push("Predicted Traffic Status");
			for (var row in result) {
					table.dates.push(result[row].Predictions[ind].PredictionTime);
					
					//Speed
					table.currentSpeed.push(result[row].Speed);
					table.predictionsSpeed.push(result[row].Predictions[ind].Speed);
					
					//NumOfCars
					table.currentNumOfCars.push(result[row].NumOfCars);
					table.predictionsNumOfCars.push(result[row].Predictions[ind].NumOfCars);
					
					//Traffic status
					table.currentStatus.push(result[row].TrafficStatus);
					table.predictionsStatus.push(result[row].Predictions[ind].TrafficStatus);
			}	
			var unit = setUnit(limit);
			drawSpeedGraph(table.dates, table.currentSpeed, table.predictionsSpeed, '#chart1', "Speed", unit);
			table.dates.unshift("date"); //hack because highcharts remove the first element from date array
			drawGraph(table.dates, table.currentNumOfCars, table.predictionsNumOfCars, '#chart2', "Traffic flow", unit);
			table.dates.unshift("date");
			drawGraph(table.dates, table.currentStatus, table.predictionsStatus, '#chart3', "Traffic status", unit);
        },
        error: function (error) {
            console.log("some error in fetching the sensors: " + JSON.stringify(error));
        }
    });  
	

}

function drawGraph(dates, current, predictions, htmlId, title, intervalHours) {
	  $(htmlId).highcharts({

            data: {
                columns: [
					dates, predictions, current
				]
            },

            title: {
                text: title
            },

            // subtitle: {
            //     text: 'Real values vs. predictions'
            // },

            xAxis: {
                tickInterval: intervalHours * 3600 * 1000, // one week = 7 * 24 * 3600 * 1000
                tickWidth: 0,
                gridLineWidth: 1,
                labels: {
                    align: 'left',
                    x: 3,
                    y: -3
                }
            },

            yAxis: [{ // left y axis
                title: {
                    text: null
                },
                labels: {
                    align: 'left',
                    x: 3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }, { // right y axis
                linkedTo: 0,
                gridLineWidth: 0,
                opposite: true,
                title: {
                    text: null
                },
                labels: {
                    align: 'right',
                    x: -3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }],

            legend: {
                align: 'left',
                verticalAlign: 'top',
                y: 20,
                floating: true,
                borderWidth: 0
            },

            tooltip: {
                shared: true,
                crosshairs: true
            },

            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function (e) {
                                hs.htmlExpand(null, {
                                    pageOrigin: {
                                        x: e.pageX || e.clientX,
                                        y: e.pageY || e.clientY
                                    },
                                    headingText: this.series.name,
                                    maincontentText: Highcharts.dateFormat('%A, %b %e, %Y %H:%M', this.x) + '<br/> ' +
                                        Math.floor(this.y),
                                    width: 220
                                });
                            }
                        }
                    },
                    marker: {
                        lineWidth: 1
                    },
					tooltip: {
						dateTimeLabelFormats: {
							hour:"%A, %b %e, %H:%M",
							day:"%A, %b %e, %Y"
						},
						valueDecimals: 0,
						xDateFormat: '%A, %b %e, %Y %H:%M'
					}
                }
            },

            series: [{
                name: 'One',
                lineWidth: 2,
                marker: {
                    radius: 2
                }
            }, {
                name: 'Two',
                lineWidth: 2,
                marker: {
                    radius: 2
                }
            }]
        });
}

function drawSpeedGraph(dates, current, predictions, htmlId, title, intervalHours) {
	  $(htmlId).highcharts({

            data: {
                columns: [
					dates, predictions, current
				]
            },

            title: {
                text: title
            },

            xAxis: {
                tickInterval: intervalHours * 3600 * 1000, // one week = 7 * 24 * 3600 * 1000
                tickWidth: 0,
                gridLineWidth: 1,
                labels: {
                    align: 'left',
                    x: 3,
                    y: -3
                }
            },

            yAxis: [{ // left y axis
                title: {
                    text: null
                },
				min: 0,
				//max: 140,
				tickInterval: 10,
                labels: {
                    align: 'left',
                    x: 3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }, { // right y axis
                linkedTo: 0,
                gridLineWidth: 0,
                opposite: true,
                title: {
                    text: null
                },
                labels: {
                    align: 'right',
                    x: -3,
                    y: 16,
                    format: '{value:.,0f}'
                },
                showFirstLabel: false
            }],

            legend: {
                align: 'left',
                verticalAlign: 'top',
                y: 20,
                floating: true,
                borderWidth: 0
            },

            tooltip: {
                shared: true,
                crosshairs: true
            },

            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function (e) {
                                hs.htmlExpand(null, {
                                    pageOrigin: {
                                        x: e.pageX || e.clientX,
                                        y: e.pageY || e.clientY
                                    },
                                    headingText: this.series.name,
                                    maincontentText: Highcharts.dateFormat('%A, %b %e, %Y %H:%M', this.x) + '<br/> ' +
                                        Math.floor(this.y*100)/100,
                                    width: 220
                                });
                            }
                        }
                    },
                    marker: {
                        lineWidth: 1
                    },
					tooltip: {
						dateTimeLabelFormats: {
							hour:"%A, %b %e, %H:%M",
							day:"%A, %b %e, %Y"
						},
						valueDecimals: 2,
						xDateFormat: '%A, %b %e, %Y %H:%M'
					}
                }
            },

            series: [{
                name: 'One',
                lineWidth: 2,
                marker: {
                    radius: 2
                }
            }, {
                name: 'Two',
                lineWidth: 2,
                marker: {
                    radius: 2
                }
            }]
        });
}

function createArray(len, itm) {
    var arr1 = [itm],
        arr2 = [];
    while (len > 0) {
        if (len & 1) arr2 = arr2.concat(arr1);
        arr1 = arr1.concat(arr1);
        len >>>= 1;
    }
    return arr2;
}

function setUnit(limit){
	if (limit <=30) {
		return 3;
	} else {
		return Math.floor(limit/10);
	}	
}

function getEvalForSensor(sensorId, sensorTitle) {
	if (!sensorId) {
		sensorId = "0180_11";
	}
	if (!sensorTitle) {
		sensorTitle = "AC-A1, LJ (vzh. obvoznica) : Litijska - Malence";
	}
	
	document.getElementById("eval-data").innerHTML = "<div class='sensor-data-title'>" + sensorTitle + "</div>" 
			+ " (Sensor ID: " + sensorId +")<br>";
	var row = findInd(sensorId, evaluations);
	var metricsStrings = ["MAE", "MAPE", "R2"];
	var metrics = [0,2,3];
	var ymax = [150, 100, 1];
	for (var m in metrics) {
		var speed = [];
		var noc = [];
		var ts = [];
		var occ = [];
		for (var hor in horizons.slice(1, horizons.length)) {
			speed.push(evaluations[row].Predictions[hor].Evaluation[metrics[m]].Speed);
			noc.push(evaluations[row].Predictions[hor].Evaluation[metrics[m]].NumOfCars);
			ts.push(evaluations[row].Predictions[hor].Evaluation[metrics[m]].TrafficStatus);
			occ.push(evaluations[row].Predictions[hor].Evaluation[metrics[m]].Occupancy);
		}
		drawEvalGraphs(metricsStrings[m], speed, noc, ts, occ, ymax[m]);
	}
}

function drawEvalGraphs(id, speed, noc, ts, occ, max){
	$(function () {
		$("#"+id).highcharts({
			chart: {
				type: 'column'
			},
			title: {
				text: id
			},
			xAxis: {
                categories: [1,3,6,9,12,15,18],
                crosshair: true,
				title: {
					text: "prediction horizon [h]"
				}
            },
			yAxis: {
				min: 0,
				max: max,
				title: {
					text: id
				}
			},
			tooltip: {
				headerFormat: '<span style="font-size:10px">Prediction horizon: {point.key}</span><table>',
				pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
					'<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
				footerFormat: '</table>',
				shared: true,
				useHTML: true
			},
			plotOptions: {
				column: {
					pointPadding: 0.2,
					borderWidth: 0
				}
			},
			series: [{
				name: 'Speed',
				data: speed
			}, {
				name: 'Flow',
				data: noc
			}, {
				name: 'Traffic status',
				data: ts	
			}, {
				name: 'Occupancy',
				data: occ	
			}]
		});
	});
}

function findInd(sensorId, evaluations) {
	for (var row in evaluations) {
		if (evaluations[row].measuredBy.Name === sensorId.replace("_","-")) {
			return row;
		}
	}
}

function uncoverSpeedSliders(){
	$("#evaluation-sliders" ).toggle(false);	
	$("#status-sliders" ).toggle(false);	
	$("#speed-sliders" ).toggle(true);
}

function uncoverStatusSliders(){
	$("#evaluation-sliders" ).toggle(false);	
	$("#speed-sliders" ).toggle(false);
	$("#status-sliders" ).toggle(true);	
}

function uncoverEvaluationSliders(){	
	$("#speed-sliders" ).toggle(false);
	$("#status-sliders" ).toggle(false);	
	$("#evaluation-sliders" ).toggle(true);
}

function getAttributeString(){
	if (evalAttribute==="NumOfCars") {
		return "Flow";
	}
	else if (evalAttribute==="TrafficStatus"){
		return "Traffic status";
	}
	else {
		return evalAttribute;
	}
}