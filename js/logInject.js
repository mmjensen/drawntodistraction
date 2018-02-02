var interval, moving = false;

document.addEventListener('click', function(){
    send({action:"click"});
}, false);

document.addEventListener('keydown', function(e){
    send({action:"key"});
}, false);

document.addEventListener('scroll', function(e){
    send({action:"scroll"});
}, false);

document.addEventListener('mousemove', function(e){
    if(!moving){
        send({action:"mousestart"});
    }
    moving = true;
    clearTimeout(interval)
    interval = setTimeout(function(){
        send({action:"mousestop"})
        
        moving = false;
    }, 1000);
});


function send(msg){
    try {
        chrome.extension.sendMessage(msg,null);    
    } catch(e) {
        //fix for update extension script bug: https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/QLC4gNlYjbA/URnEOjAsCQAJ
        if ( e.message.match(/Invocation of form runtime\.connect/) && e.message.match(/doesn't match definition runtime\.connect/) ) {
            //Force reload of page. This is a rare bug in the wild (frequent in dev), so it makes sense to do something like this
            window.location.reload(true);

        }
    }
    
}