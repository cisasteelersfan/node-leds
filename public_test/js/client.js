function foo(){
    alert("IT WORKS");
}

function buttonPressed(inputelement){
    //alert("Button pressed: "+inputelement.id);
    // document.getElementById("manual").classList.toggle("active");
    if(inputelement.checked){
        // alert("checked");
        var allButtons = document.getElementsByClassName("btn");
        for(var i=0; i<allButtons.length; i++){
            allButtons[i].classList.remove("active");
        }
        document.getElementById(inputelement.value).classList.add("active");
    }
}
