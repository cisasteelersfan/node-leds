/* Colby Rome */

//Setup
express = require('express'); //web server
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server); //web socket server
piblaster = require("pi-blaster.js");
child_process = require('child_process');

server.listen(8080);
app.use(express.static('public'));

//Constants:
const manual = 0;
const fade3 = 1;
const flash = 2;

const redpin = 18;
const greenpin = 17;
const bluepin = 22;

//Global variables
var brightness = {"r": 0, g: 0, b: 0};
var br = 0;
var bg = 0;
var bb = 0;
var mode = manual; // manual mode
var upcolor = 'r';
var downcolor = 'b';

function debuglog(text){
    if(app.get('env') == 'debug') console.log(text);
}

function sw1(onoff)
{
    if(onoff == "on")
        child_process.execFile('switchfast', ['sw1', 'on'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned on sw1');
        });
    else
        child_process.execFile('switchfast', ['sw1', 'off'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned off sw1');
        });
}

function sw2(onoff)
{
    if(onoff == "on")
        child_process.execFile('switchfast', ['sw2', 'on'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned on sw2');
        });
    else
        child_process.execFile('switchfast', ['sw2', 'off'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned off sw2');
        });
}

function sw3(onoff)
{
    if(onoff == "on")
        child_process.execFile('switchfast', ['sw3', 'on'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned on sw3');
        });
    else
        child_process.execFile('switchfast', ['sw3', 'off'], function(error, stdout, stderr){
            debuglog(error);
            debuglog(stdout);
            debuglog(stderr);
            debuglog('turned off sw3');
        });
}


function Brightness()
{
    this.r = 0;
    this.g = 0;
    this.b = 0;
    var values = {r: 0, g: 0, b: 0};
    this.up = function(color){
        this.values.color++;
    }

    this.rup = function() {
        return this.r++;
    }
    this.gup = function() {
        return this.g++;
    }
    this.bup = function() {
        return this.b++;
    }
}

var brite = new Brightness();
brite.rup();
debuglog(brite);

function up(color)
{
    /* Returns the current brightness and increments brightness by 1.
     */
    debuglog(brightness);
    if(brightness.color == 100)
        return 100;
    brightness.color++;
    return brightness.color++;
}

function scale(input){
    /* approximates linear perceived brightness from 0-100
     */
//    return input/100;
    if(input == 100) return 0;
    if(input == 0) return 1;
    return 1 - ((1/0.5267)/(Math.exp(((input/21)-10)*-1))*100-0.008);
}

var intensity = new Array(101);
for(i = 0; i< intensity.length; i++){
    intensity[i] = scale(i).toFixed(3);
    debuglog("intensity[i] = "+intensity[i]);
}

function scheduler(){
    eventType = mode; // update to global variable mode
//    debuglog(eventType);
    switch(eventType){
        case fade3:
            fade3Func();
            break;
        case flash:
            flashFunc();
            break;
        default:
            break; // do nothing (manual mode)
    }
}

function flashFunc(){
    piblaster.setPwm(redpin, intensity[br]);
    piblaster.setPwm(greenpin, intensity[bg]);
    piblaster.setPwm(bluepin, intensity[bb]);
    br = (100-br)%101;
    bg = (100-bg)%101;
    bb = (100-bb)%101;
}

function fade3Func(){
    /*
     * crossfades red->green->blue->...
     * this logic is really ugly. I think br, bg, bb should be
     * objects that have up() and down() methods.
     * Adjust the speed by adding more than 1 each time.
     */
    debuglog('r',br, 'g', bg, 'b', bb);
    switch(upcolor){
        case 'r':
            if(br == 100){
                upcolor = 'g';
                downcolor = 'r';
            }
            else{
                br++;
                switch(downcolor){
                    case 'g':
                        if(bg>0) bg--;
                        break;
                    case 'b':
                        if(bb>0) bb--;
                        break;
                }
            }
            break;
        case 'g':
            if(bg == 100){
                upcolor = 'b';
                downcolor = 'g';
            }
            else{
                bg++;
                switch(downcolor){
                    case 'r':
                        if(br>0) br--;
                        break;
                    case 'b':
                        if(bb>0) bb--;
                        break;
                }
            }
            break;
        case 'b':
            if(bb == 100){
                upcolor = 'r';
                downcolor = 'b';
            }
            else{
                bb++;
                switch(downcolor){
                    case 'r':
                        if(br>0) br--;
                        break;
                    case 'g':
                        if(bg>0) bg--;
                        break;
                }
            }
            break;
    }

    piblaster.setPwm(redpin, intensity[br]);
    piblaster.setPwm(greenpin, intensity[bg]);
    piblaster.setPwm(bluepin, intensity[bb]);
    io.sockets.emit('led', {red: br,
                            green: bg,
                            blue: bb});
}

//setInterval(function() {mode = 2-mode;}, 1000);
setInterval(scheduler, 100);

//debuglog(intensity);

debuglog('running');
io.sockets.on('connection', function(socket){ //gets called on connect
  socket.emit('led', {red: br,
                      green: bg,
                      blue: bb});

  socket.on('led', function(data) {
    br = data.red;
    bg = data.green;
    bb = data.blue;
    io.sockets.emit('led', {red: br,
                      green: bg,
                      blue: bb});
    piblaster.setPwm(redpin, intensity[br]);
    piblaster.setPwm(greenpin, intensity[bg]);
    piblaster.setPwm(bluepin, intensity[bb]);
  });
  socket.on('button', function(data) {
      debuglog("button pressed - server side");
      debuglog("data = ", data);
      if(data == "manual") mode = manual;
      if(data == "flash") mode = flash;
      if(data == "fade3") mode = fade3;
      if(data == "sw1on") sw1("on");
      if(data == "sw1off") sw1("off");
      if(data == "sw2on") sw2("on");
      if(data == "sw2off") sw2("off");
      if(data == "sw3on") sw3("on");
      if(data == "sw3off") sw3("off");

      debuglog("mode = ", mode);
  });
/*  socket.on('button', function(data) {
          debuglog("button pressed - server side");
          br = 100;
          bg = 0;
          bb = 0;
        io.sockets.emit('led', {red: br,
                      green: bg,
                      blue: bb});
        piblaster.setPwm(redpin, intensity[br]);
        piblaster.setPwm(greenpin, intensity[bg]);
        piblaster.setPwm(bluepin, intensity[bb]);
  }); */
});
