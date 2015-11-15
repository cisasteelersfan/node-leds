//Colby Rome

//Setup
express = require('express'); //web server
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server); //web socket server
piblaster = require("pi-blaster.js");

server.listen(8080); //start the webserver on port 8080
//tell server that ./public/ contains the static webpages
app.use(express.static('/home/pi/node-leds/public'));

//Constants:
const manual = 0;
const fade3 = 1;
const flash = 2;

//Global variables
var redpin = 18;
var greenpin = 17;
var bluepin = 22;

var brightness_r = 0;
var brightness_g = 0;
var brightness_b = 0;
var mode = manual; // manual mode

function scale(input){
    if(input == 0) return 0;
    return ((1/0.5267)/(Math.exp(((input/21)-10)*-1))*100-0.008)
}

var intensity = new Array(101);
for(i = 0; i< intensity.length; i++){
    intensity[i] = scale(i).toFixed(3);
}

function scheduler(){
    eventType = mode; // update to global variable mode
//    console.log(eventType);
    switch(eventType){
        case fade3:
            fade3();
            break;
        case flash:
            flashFunc();
            break;
        default:
            break; // do nothing (manual mode)
    }
}

function flashFunc(){
    piblaster.setPwm(redpin, intensity[brightness_r]);
    piblaster.setPwm(greenpin, intensity[brightness_g]);
    piblaster.setPwm(bluepin, intensity[brightness_b]);
    brightness_r = 100-brightness_r;
    brightness_g = 100-brightness_g;
    brightness_b = 100-brightness_b;
}

//setInterval(function() {mode = 2-mode;}, 1000);
setInterval(scheduler, 60);

console.log(intensity);

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
    piblaster.setPwm(redpin, intensity[brightness_r]);
    piblaster.setPwm(greenpin, intensity[brightness_g]);
    piblaster.setPwm(bluepin, intensity[brightness_b]);
  });
  socket.on('button', function(data) {
          console.log("button pressed - server side");
          brightness_r = 100;
          brightness_g = 0;
          brightness_b = 0;
        io.sockets.emit('led', {red: brightness_r,
                      green: brightness_g,
                      blue: brightness_b});
        piblaster.setPwm(redpin, intensity[brightness_r]);
        piblaster.setPwm(greenpin, intensity[brightness_g]);
        piblaster.setPwm(bluepin, intensity[brightness_b]);
  });
});
