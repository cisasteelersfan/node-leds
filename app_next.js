// Colby rome 8-26-17

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();
app.use(express.static('public_next'));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var JsonDB = require('node-json-db');
var db = new JsonDB("testDB", true, true);

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
                break;
            case 'changeBrightness':
                var slider = data['slider'];
                var value = data['value'];
                console.log(slider+": "+value);
                db.push("/state/"+topic+"/"+data['slider']+"/value", value);
                break;
            case 'modeSelect':
                console.log(data);
                db.push("/state/"+topic+"/", data);
                break;
        }
    });

    ws.send(JSON.stringify('something'));
});

server.listen(8080, function listening(){
    console.log('Listening on %d', server.address().port);
});
