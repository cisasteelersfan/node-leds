function foo(){
    alert("IT WORKS");
}

function modeSelect(inputelement){
    //alert("Button pressed: "+inputelement.id);
    // document.getElementById("manual").classList.toggle("active");
    // alert("checked");
    console.log(inputelement);
    var allButtons = document.getElementsByClassName("btn");
    for(let i of allButtons){
        i.classList.remove("active");
    }
    document.getElementById(inputelement.value).classList.add("active");
    console.log(inputelement.checked);

    ws.send(JSON.stringify({'topic':'modeSelect', 'data':inputelement.value}));

    // client will be something like console.log(JSON.parse(e.data));
}

function outletToggle(ele){
    console.log("Element.checked: "+ ele.checked);

    ws.send(JSON.stringify({'topic':'outletToggle','data':{'outlet':ele.id,'checked':ele.checked}}));
    //document.getElementById("outlet3").checked = false;
}

function changeBrightness(ele){
    console.log(ele.id+" :"+ele.value);

    ws.send(JSON.stringify({'topic':'changeBrightness','data':{'slider':ele.id,'value':ele.value}}));
}

var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':8080');

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
            break;
        case 'modeSelect':
            console.log(data);
            var allButtons = document.getElementsByClassName("btn");
            for(let i of allButtons){
                i.classList.remove("active");
            }
            document.getElementById(data).classList.add("active");
            break;
        }
}
