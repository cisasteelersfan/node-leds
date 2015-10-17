//Colby Rome

express = require('express'); //web server
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server); //web socket server
piblaster = require("pi-blaster.js");

server.listen(8080); //start the webserver on port 8080
app.use(express.static('/home/pi/node-leds/public')); //tell server that ./public/ contains
                                                  //the static webpages
var brightness_r = 0;
var brightness_g = 0;
var brightness_b = 0;
console.log('running');
io.sockets.on('connection', function(socket){ //gets called on connect
  socket.emit('led', {red: brightness_r,
                      green: brightness_g,
                      blue: brightness_b});

  socket.on('led', function(data) {
    brightness_r = data.red;
    brightness_g = data.green;
    brightness_b = data.blue;
    io.sockets.emit('led', {red: brightness_r,
                      green: brightness_g,
                      blue: brightness_b});
    piblaster.setPwm(18, scale(brightness_r));
    piblaster.setPwm(17, scale(brightness_g));
    piblaster.setPwm(22, scale(brightness_b));
  });
  function scale(input){
    if(input == 0){ return 0;}
    return (Math.exp(input/10)/Math.exp(10));
  }
});
