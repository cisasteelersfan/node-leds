// Colby Rome 8-26-17

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const piblaster = require("pi-blaster.js");
const child_process = require('child_process');

const app = express();
app.use(express.static('public_next'));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const pins = {inputSliderR: 18, inputSliderG:17, inputSliderB:22};

var JsonDB = require('node-json-db');
// saveafterpush?, saveHumanReadable?
var db = new JsonDB("LEDDatabase", false, false);

function sendExistingData(ws){
    try {
        var outletData = db.getData("/state/outletToggle");
        var brightnessData = db.getData("/state/changeBrightness");
        var modeData = db.getData("/state/modeSelect");
    } catch(error){
        console.log("Creating initial database");
        db.push("/state/outletToggle/outlet1/checked", false);
        db.push("/state/outletToggle/outlet2/checked", false);
        db.push("/state/outletToggle/outlet3/checked", false);
        db.push("/state/changeBrightness/inputSliderR/value", 0);
        db.push("/state/changeBrightness/inputSliderG/value", 0);
        db.push("/state/changeBrightness/inputSliderB/value", 0);
        db.push("/state/modeSelect/", 'manual');
        var outletData = db.getData("/state/outletToggle");
        var brightnessData = db.getData("/state/changeBrightness");
        var modeData = db.getData("/state/modeSelect");
    }
    // console.log(data);
    for(var outlet in outletData){
        // console.log(outlet+": "+outletData[outlet]);
        // console.log(outletData[outlet]);
        // console.log(outletData[outlet]['checked']);

        var checked = outletData[outlet]['checked'];

        var message = JSON.stringify({topic:'outletToggle',data:{'outlet':outlet, 'checked': checked }});
        console.log(message);
        ws.send(message);
    }
    for(var slider in brightnessData){
        var value = brightnessData[slider]['value'];

        var message = JSON.stringify({topic:'changeBrightness', data:{'slider':slider, 'value':value}});
        console.log(message);
        ws.send(message);
    }
    var message = JSON.stringify({topic:'modeSelect',data:modeData});
    console.log(message);
    ws.send(message);
}


wss.on('connection', function connection(ws, req){
    console.log('client connected');

    // send initial values of sliders, buttons, and outlets:
    sendExistingData(ws);


    ws.on('message', function incoming(message){
        var parsedMessage = JSON.parse(message);
        // console.log('received: %s', message);
        var topic = parsedMessage['topic'];
        // console.log(topic);
        var data = parsedMessage['data'];
        // console.log(data);

        // update each of the other clients with the same message
        wss.clients.forEach(function each(client){
            if(client !== ws && client.readyState === WebSocket.OPEN){
                client.send(message);
            }
        });

        switch(topic){
            case 'outletToggle':
                var outlet = data['outlet'];
                var checked = data['checked'];
                console.log(outlet + ": " + checked);
                db.push("/state/"+topic+"/"+data['outlet']+'/checked', checked);
                toggleOutlet(outlet);
                break;
            case 'changeBrightness':
                var slider = data['slider'];
                var value = data['value'];
                console.log(slider+": "+value);
                adjustBrightness(slider, value);
                break;
            case 'modeSelect':
                console.log(data);
                setMode(data);
                break;
        }
    });
    ws.on('close', function(){
        console.log("closing connection and saving database");
        db.save();
    })
});

var intensity = new Array(101);
for(i = 0; i< intensity.length; i++){
    intensity[i] = scale(i).toFixed(3);
}
var intervalID = null;
function intervalManager(flag, callback, time){
    if(flag){
        clearInterval(intervalID);
        intervalID = setInterval(callback, time);
    } else clearInterval(intervalID);
}

for(var val in fadeInfo){
    var sliderVal = db.getData("/state/changeBrightness/"+fadeInfo[val]+"/value");
    piblaster.setPwm(pins[fadeInfo[val]], intensity[sliderVal]);
}

var fadeInfo = {upSlider: 'inputSliderR', downSlider: 'inputSliderG', notUsed: 'inputSliderB'};
var fade = function(){
    var upSliderValue = db.getData("/state/changeBrightness/"+fadeInfo['upSlider']+"/value");
    if(upSliderValue == 100){
        console.log("switching colors");
        var tmp = fadeInfo['upSlider'];
        fadeInfo['upSlider'] = fadeInfo['notUsed'];
        fadeInfo['notUsed'] = fadeInfo['downSlider'];
        fadeInfo['downSlider'] = tmp;
    }
    upSliderValue = db.getData("/state/changeBrightness/"+fadeInfo['upSlider']+"/value");
    var downSliderValue = db.getData("/state/changeBrightness/"+fadeInfo['downSlider']+"/value");

    var newUpVal = Math.min(upSliderValue+1, 100);
    var newDownVal = Math.max(downSliderValue-1, 0);
    db.push("/state/changeBrightness/"+fadeInfo['downSlider']+"/value", newDownVal);
    db.push("/state/changeBrightness/"+fadeInfo['upSlider']+"/value", newUpVal);

    piblaster.setPwm(pins[fadeInfo['upSlider']], intensity[newUpVal]);
    piblaster.setPwm(pins[fadeInfo['downSlider']], intensity[newDownVal]);
    wss.clients.forEach(function each(client){
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({'topic':'changeBrightness','data':{'slider':fadeInfo['upSlider'],'value':newUpVal}}));
            client.send(JSON.stringify({'topic':'changeBrightness','data':{'slider':fadeInfo['downSlider'],'value':newDownVal}}));
        }
    });
}

var candle = function(){
    for(var val in fadeInfo){
        var sliderVal = db.getData("/state/changeBrightness/"+fadeInfo[val]+"/value");
        if(sliderVal === 0) continue;
        var newSliderVal = +Math.ceil((Math.random()-0.5)*5) + +sliderVal;
        console.log(newSliderVal);
        if(newSliderVal < 0 || newSliderVal > 100) continue;

        piblaster.setPwm(pins[fadeInfo[val]], intensity[newSliderVal]);
    }
}

function setMode(data){
    db.push("/state/modeSelect/", data);
    switch(data){
        case 'fade':
            intervalManager(true, fade, 100);
            break;
        case 'candle':
            intervalManager(true, candle, 200);
            break;
        default:
            intervalManager(false);
            break; // manual: do nothing
    }
}

function scale(input){
    /* approximates linear perceived brightness from 0-100
     */
//    return input/100;
    if(input == 100) return 0;
    if(input == 0) return 1;
    return 1 - ((1/0.5267)/(Math.exp(((input/21)-10)*-1))*100-0.008);
}

function toggleOutlet(outlet){
    var outletData = db.getData("/state/outletToggle/"+outlet+"/checked");
    console.log(outlet+": "+outletData);
    var sw = {outlet1: 'sw1', outlet2: 'sw2', outlet3: 'sw3'};
    child_process.execFile('switchfast', [sw[outlet], (outletData === true? 'on' : 'off')], function(error, stdout, stderr){
        console.log("turned "+ (outletData === true? 'on' : 'off')+" switch " +sw[outlet]);
    }
    );
}

function adjustBrightness(slider, value){
    db.push("/state/changeBrightness/"+slider+"/value", value);
    console.log(pins[slider]+" "+intensity[value]);
    piblaster.setPwm(pins[slider], intensity[value]);
}

server.listen(8080, function listening(){
    console.log('Listening on %d', server.address().port);
});

var saveDatabase = setInterval(function(){
    try{
        db.save();
    } catch(error){
        console.log("Couldn't save db yet");
    }
}, 30*60*1000); // write the database every 30 minutes
