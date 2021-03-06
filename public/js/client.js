var host = window.document.location.host.replace(/:.*/, '');
var ws;
var connect = function(){
    console.log('trying to connect');
    ws = new WebSocket('ws://' + host + ':8080');
    ws.onopen = function(){
        setLogosVisible(true);
    }
    ws.onerror = function(event){
        setLogosVisible(false);
        console.log("Couldn't connect.");
    }
    ws.onclose = function(){
        setLogosVisible(false);
        console.log('socket closed, reconnecting...');
        setTimeout(connect, 1000);
    }
    ws.onmessage = function(event){
        // console.log(JSON.parse(event.data));

        var parsedMessage = JSON.parse(event.data);
        console.log('received: %s', parsedMessage);
        var topic = parsedMessage['topic'];
        console.log(topic);
        var data = parsedMessage['data'];
        console.log(data);

        switch(topic){
            case 'outletToggle':
                var outlet = data['outlet'];
                var checked = data['checked'];
                console.log(outlet + ": " + checked);
                document.getElementById(outlet).checked = checked;
                break;
            case 'changeBrightness':
                var slider = data['slider'];
                var value = data['value'];
                console.log(slider+": "+value);
                document.getElementById(slider).value = value;
                changeBackgroundColor();
                break;
            case 'modeSelect':
                console.log(data);
                var allButtons = document.getElementsByClassName("btn");
                if(allButtons){
                    for(var i=0; i<allButtons.length; i++){
                        allButtons[i].classList.remove("active");
                    }
                }
                document.getElementById(data).classList.add("active");
                break;
        }
    }
}
connect();
function modeSelect(inputelement){
    // alert("Button pressed: "+inputelement.id);
    // document.getElementById("manual").classList.toggle("active");
    // alert("checked");
    console.log(inputelement);
    var allButtons = document.getElementsByClassName("btn");
    if(allButtons){
        for(var i=0; i<allButtons.length; i++){
            allButtons[i].classList.remove("active");
        }
    }
    inputelement.classList.add("active");

    ws.send(JSON.stringify({'topic':'modeSelect', 'data':inputelement.id}));

    // client will be something like console.log(JSON.parse(e.data));
}

function outletToggle(ele){
    console.log("Element.checked: "+ ele.checked);

    ws.send(JSON.stringify({'topic':'outletToggle','data':{'outlet':ele.id,'checked':ele.checked}}));
    //document.getElementById("outlet3").checked = false;
}

function changeBrightness(ele){
    console.log(ele.id+" :"+ele.value);
    changeBackgroundColor();
    ws.send(JSON.stringify({'topic':'changeBrightness','data':{'slider':ele.id,'value':ele.value}}));
}

function changeBackgroundColor(){
    var rgba = (100+Number(document.getElementById("inputSliderR").value)).toString() + "," + (100+Number(document.getElementById("inputSliderG").value)).toString() + "," + (100+Number(document.getElementById("inputSliderB").value)).toString();
    console.log(rgba);
    document.getElementById('rgb sliders').style.background = "radial-gradient(rgba(0,0,0,0.05), rgba(" + rgba + ",.5), rgba(0,0,0,0.05))";
}

function setLogosVisible(visibility){
    var logos = document.getElementsByClassName("logo");
    for(var i=0; i<logos.length; i++){
        logos[i].style.visibility = visibility? "visible" : "hidden";
    }
}


document.getElementById('outlet1').addEventListener('click', function(){
    outletToggle(this);
});
document.getElementById('outlet2').addEventListener('click', function(){
    outletToggle(this);
});
document.getElementById('outlet3').addEventListener('click', function(){
    outletToggle(this);
});
