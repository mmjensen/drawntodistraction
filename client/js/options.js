var extension = chrome.extension.getBackgroundPage();
var user = extension.getUser();
var registration = document.querySelector("#registration")
var about = document.querySelector("#about")

//we need to do the double check
if(!user){
    install()
}

function install(){
    about.classList.remove("show")
    registration.classList.add("show")
    document.querySelector('#registration input[type="submit"]').onclick = function(){
        var date = document.querySelector('#registration input[type="date"]');
        var name = document.querySelector('#registration input[type="text"]');
        var validate = document.querySelector('#registration #validation');
        name.classList.remove("error")
        date.classList.remove("error")
        if(name.value.trim() === ""){
            validate.innerHTML = "Invalid input -- please correct"
            name.classList.add("error")
        }

        if (date.value.trim() === ""){
            validate.innerHTML = "Invalid input -- please correct"
            date.classList.add("error")
            return //return or below will fail
        }

        var birtdate = new Date(date.value)
        //WE DO THIS BECAUSE THE DATE FORMAT MIGHT BE DIFFERENT ACCROSS BROWSERS
        //WE DONT KNOW YET AND NEED TO BE SURE.
        var isoDate = birtdate.toISOString().split("T")[0]
        extension.registerUser(name.value, isoDate, function(err){
            if(!err){
                about.classList.add("show")
                registration.classList.remove("show")
            } else {
                validate.innerHTML = "Something went wrong -- please try again."
            }
        });
    }

}
