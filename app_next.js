// Colby rome 8-26-17

const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();
app.use(express.static('public_next'));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req){
    console.log('client connected');

    ws.on('message', function incoming(message){
        var parsedMessage = JSON.parse(message);
        // console.log('received: %s', message);
        var topic = parsedMessage['topic'];
        // console.log(topic);
        var data = parsedMessage['data'];
        // console.log(data);

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
                break;
            case 'changeBrightness':
                var slider = data['slider'];
                var value = data['value'];
                console.log(slider+": "+value);
                break;
            case 'modeSelect':
                console.log(data);
                break;
        }
    });

    ws.send(JSON.stringify('something'));
});

server.listen(8080, function listening(){
    console.log('Listening on %d', server.address().port);
});
