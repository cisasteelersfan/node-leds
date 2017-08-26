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
                db.push("/state/"+topic+"/"+data['slider']+"/value", value);
                adjustBrightness(slider, value);
                break;
            case 'modeSelect':
                console.log(data);
                db.push("/state/"+topic+"/", data);
                break;
        }
    });
});

var intensity = new Array(101);
for(i = 0; i< intensity.length; i++){
    intensity[i] = scale(i).toFixed(3);
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

function adjustBrightness(slider){
    var brightnessData = db.getData("/state/changeBrightness/"+slider+"/value");
    console.log(pins[slider]+" "+intensity[brightnessData]);
    piblaster.setPwm(pins[slider], intensity[brightnessData]);
}

server.listen(8080, function listening(){
    console.log('Listening on %d', server.address().port);
});

setInterval(function(){
    try{
        db.save();
    } catch(error){
        console.log("Couldn't save db yet");
    }
}, 30*60*1000); // write the database every 30 minutes
