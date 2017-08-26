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
        console.log('received: %s', message);
    });

    ws.send(JSON.stringify('something'));
});

server.listen(8080, function listening(){
    console.log('Listening on %d', server.address().port);
});
