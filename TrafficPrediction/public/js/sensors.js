var map;
var horizons = [0, 1, 3, 6, 9, 12, 15, 18];
var horizon = 0;
var green;
var yellow;
var orange;
var sensorMarkers = [];

/**
 * Initialization
 */
$(document).ready(function () {
    var mapProp = {
        center: new google.maps.LatLng(46, 14.6),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    
    $(".right-content").toggle(false);
    
    $(function () {
        $("#slider-range-min").slider({
            range: "min",
            value: 0,
            min: 0,
            max: horizons.length - 1,
            step: 1,
            slide: function (event, ui) {
                horizon = horizons[ui.value];
                $("#amount").val(horizons[ui.value]);
                removeMarkers();
                getSensors(horizons[ui.value]);
            }
        });
        $("#amount").val($("#slider-range-min").slider("value"));
		
    });
    
    $("#treshold-options-button").click(function () {
        $(".right-content").toggle("fast");
    });
    
    $(function () {
        $("#slider-range-green").slider({
            range: "min",
            value: 2.5,
            min: 0,
            max: 50,
            step: 0.1,
            slide: function (event, ui) {
                green = ui.value / 100;
                $("#green").val(ui.value);
                getSensors(horizon);
            }
        });
        $("#green").val($("#slider-range-green").slider("value"));
        $("#slider-range-green").slider().slider("pips", {
            rest: "label",
            step: 50
        });
		
    });
    
    $(function () {
        $("#slider-range-yellow").slider({
            range: "min",
            value: 5,
            min: 0,
            max: 50,
            step: 0.1,
            slide: function (event, ui) {
                yellow = ui.value / 100;
                $("#yellow").val(ui.value);
                getSensors(horizon);
            }
        });
        $("#yellow").val($("#slider-range-yellow").slider("value"));
        $("#slider-range-yellow").slider().slider("pips", {
            rest: "label",
            step: 50
        });
		
    });
    
    $(function () {
        $("#slider-range-orange").slider({
            range: "min",
            value: 10,
            min: 0,
            max: 50,
            step: 0.1,
            slide: function (event, ui) {
                orange = ui.value / 100;
                $("#orange").val(ui.value);
                getSensors(horizon);
            }
        });
        $("#orange").val($("#slider-range-orange").slider("value"));
        $("#slider-range-orange").slider().slider("pips", {
            rest: "label",
            step: 50
        });
		
    });
    
    // $("#alternating-slider")
    // .slider({
    // 	range: "min",
    // 	min: 0,
    // 	max: 50,
    // 	step: 1,
    // 	values: [2.5, 5, 10],
    //     orientation: "vertical",
    // 	slide: function( event, ui ) {
    // 		green = ui.values[0]/100;
    // 		yellow = ui.values[1]/100;
    // 		orange = ui.values[2]/100;
    // 		$( "#green" ).val(ui.values[0]);
    // 		$( "#yellow" ).val(ui.values[1]);
    // 		$( "#orange" ).val(ui.values[2]);
    // 		getSensors(horizon);
    // 	}
    // })
    // .slider("pips", {
    // 	step: 2,
    // 	rest: "label"
    // 	// labels: { first: "Min", last: "Max" }
    // })
    // .slider("float");
    
    green = 0.025;
    yellow = 0.05;
    orange = 0.1;
    getSensors(0);
});


function removeMarkers() {
    for (var i = 0; i < sensorMarkers.length; i++) {
        sensorMarkers[i].setMap(null);
    }
}

function getSensors(horizon) {
    $.ajax({
        type: 'GET',
        contentType: "application/json",
        dataType: 'json',
        url: '/traffic-predictions',    
        success: function (result) {
            removeMarkers();
            var strt = new Date().getTime();
            for (var row in result) {
                showSensor(result[row], horizon);
                console.log(result[row].$id);
            }
            var end = new Date().getTime();
            console.log("Drawing took: " + (end - strt));
        },
        error: function (error) {
            console.log("some error in fetching the sensors: " + JSON.stringify(error));
        }
    });
}

function showSensor(sensor, horizon) {
    var pin = "./images/pin_sensor_" + setMarkerColor(sensor, horizon) + ".gif";
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
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(addNoise() * sensor.measuredBy.Location[0], 
										addNoise() * sensor.measuredBy.Location[1]), 
        map: map,
        icon: pin,
        title: sensor.measuredBy.Description
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });
    sensorMarkers.push(marker);
}

function selectContent(sensor, horizon) {
    var content;
    var ind;
    if (horizon == 0) {
        content = "<b>" + sensor.measuredBy.Title + "</b><br>" +
					"Status at " + sensor.DateTime.replace("T", " ") + ":<br>" +
					"Speed: " + sensor.Speed + "<br>" +
					"Number of cars: " + sensor.NumOfCars + "<br>" +
					"Gap: " + sensor.Gap + "<br>" +
					"Occupancy: " + sensor.Occupancy + "<br>";
        return content;
    }
    else if (horizon == 1) {
        ind = 0;
    }
    else {
        ind = horizon - 2 / 3 * horizon;
    }
    content = "<b>" + sensor.measuredBy.Title + "</b><br>" +
				"Prediction time " + sensor.Predictions[ind].PredictionTime.replace("T", " ") + ":<br>" + 
				"Speed: " + Math.round(sensor.Predictions[ind].Speed * 10) / 10 + "<br>" +
				"Number of cars: " + Math.round(sensor.Predictions[ind].NumOfCars * 10) / 10 + "<br>" +
				"Occupancy: " + Math.round(sensor.Predictions[ind].Occupancy * 10) / 10 + "<br>" +
				"Update count: " + sensor.Predictions[ind].UpdateCount + "<br>";
    return content;
				
}

function setMarkerColor(sensor, horizon) {
    var max = sensor.measuredBy.MaxSpeed;
    var speed;
    if (horizon == 0) {
        speed = sensor.Speed;
    }
    else if (horizon == 1) {
        speed = sensor.Predictions[0].Speed;
    }
    else {
        speed = sensor.Predictions[horizon - 2 / 3 * horizon].Speed;
    }
    if (speed == 0) {
        return "error";
    }
    var deviance = 1 - speed / max;
    if (deviance <= green) {
        return "green";
    }
    else if (green < deviance && deviance <= yellow) {
        return "yellow";
    }
    else if (yellow < deviance && deviance <= orange) {
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
