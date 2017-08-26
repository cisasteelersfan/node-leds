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
    console.log(JSON.parse(event.data));
}
