function foo()
{
    alert("IT WORKS");
}

var socket = io.connect();

var rgb = {red: 0, green: 0, blue: 0};
socket.on('led', function(data) {
    document.getElementById("inputSlider_r").value = data.red;
//    document.getElementById("outputText_r").innerHTML = data.red;
    document.getElementById("inputSlider_g").value = data.green;
//    document.getElementById("outputText_g").innerHTML = data.green;
    document.getElementById("inputSlider_b").value = data.blue;
//    document.getElementById("outputText_b").innerHTML = data.blue;
    rgb.red = data.red;
    rgb.green = data.green;
    rgb.blue = data.blue;
    document.body.style.background =
      "rgb("+Math.floor((rgb.red)*2.55)+","+Math.floor((rgb.green)*2.55)+","+Math.floor((rgb.blue)*2.55)+")";
      

    console.log('hey');

});

function showValue(inputelement)
{
    if(inputelement.id == "inputSlider_r"){
        rgb.red = inputelement.value;
    }
    else if(inputelement.id == "inputSlider_g"){
        rgb.green = inputelement.value;
    }
    else{ rgb.blue = inputelement.value;
    }
    socket.emit('led', rgb);
}

function button(elem){
    console.log("Clicked button");
    socket.emit('button', elem.id);
}

