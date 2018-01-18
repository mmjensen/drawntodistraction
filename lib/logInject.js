var interval, moving = false;

document.addEventListener('click', function(){
    chrome.extension.sendMessage({action:"click"},null);
}, false);

document.addEventListener('keydown', function(e){
    chrome.extension.sendMessage({action:"key"},null);
}, false);

document.addEventListener('scroll', function(e){
    chrome.extension.sendMessage({action:"scroll"},null);
}, false);

document.addEventListener('mousemove', function(e){
    if(!moving){
        chrome.extension.sendMessage({action:"mousestart"},null);
    }
    moving = true;
    clearTimeout(interval)
    interval = setTimeout(function(){
        chrome.extension.sendMessage({action:"mousestop"},null);
        moving = false;
    }, 1000);
});
