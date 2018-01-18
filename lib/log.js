
var current = {site:"", start:"", tabId:"", clicks:0, scrolls:0, mouse:0, keys:0}
var userID = sha1('Mads Møller Jensen'.toLowerCase()+"pepper")//Replace with a) check for user id in storage and if not b) a post to a CIO token generator service
var mousestart;
/*
    Implementation bias
    1.  We only capture one active tab at a time.
        Users might have several windows open across multiple displays. We only
        capture the session from the one that is active. Further, if the user
        has a window open on a secondary display, but is does not have focus, then
        it will not be seen as active.
        Response: This is not important when it comes to the intervention, as
        we assume the user *want* to change behaviour. But it is an issue related
        to the accuracy of the data collection and visualisation phase.
        To address this we can use https://developer.chrome.com/extensions/windows#type-WindowState
        to infer something about the presence of the window.
*/



chrome.storage.local.clear(function() {
    var error = chrome.runtime.lastError;
    if (error) {
        console.error(error);
    }
});


chrome.extension.onMessage.addListener(function(msg){
    console.log(msg)
    if(msg.action === "key"){
        current.keys++
    } else if(msg.action === "scroll"){
        current.scrolls++
    } else if(msg.action === "click"){
        current.clicks++
    } else if(msg.action === "mousestart"){
        mousestart = Date.now()
    } else if(msg.action === "mousestop" && mousestart != 0){
        current.mouse+= Date.now()-mousestart;
        mousestart = 0
    }

    return true;
 });

//Note, if adding "blocking" to the opt_extraInfoSpec, then the request is sync and will not complete until the callback funciton returns
//https://developer.chrome.com/extensions/webRequest
chrome.webRequest.onResponseStarted.addListener(function(e){
    if(e.ip){ //Simple check that this is not a "google newpage"
        newSiteVisit(getHostname(e.url), e.tabId)
    } else if (e.url.indexOf(chrome.runtime.id) != -1) {
        newSiteVisit("drawntodistraction", e.tabId)
    } else {
        newSiteVisit("newtab", -1) //we need to log this incase people return to a newtab
    }

}, {urls: [],types:["main_frame"]})

chrome.windows.onFocusChanged.addListener(function(e){
    if(e === -1 ){
        newSiteVisit("outside", -1)//this indicates that chrome lost focus completely
    } else {
        chrome.windows.getCurrent({populate:true}, function(ev){
            //We want to detect the active tab
            for(var i = 0; i<ev.tabs.length; i++){
                if(ev.tabs[i].active){
                    newSiteVisit(getHostname(ev.tabs[i].url), ev.tabs[i].id)
                    break;
                }
            }
        })
    }
});

chrome.tabs.onActivated.addListener(function(e){
    chrome.tabs.get(e.tabId, function(ev){
        if(ev.url != "chrome://newtab/"){
            newSiteVisit(getHostname(ev.url), ev.id)
        }
    })
})

function newSiteVisit(site, tabId){
    console.log("new visit : " + site)
    if(current.site === ""){
        current.start = Date.now()
        current.site = site;
        current.tabId = tabId;
    } else if (site != current.site && tabId != current.tabId){
        if(mousestart != 0){
            current.mouse+= Date.now()-mousestart;
            mousestart = 0;
        }
        current.end = Date.now();
        logSiteVisit(current)
        current = {site:"", start:"", tabId:"", clicks:0, scrolls:0, mouse:0, keys:0}
        current.start = Date.now()
        current.site = site;
        current.tabId = tabId;
    }
}

function getHostname(url){
    var parser = document.createElement('a');
    parser.href = url;
    return parser.hostname;
}

/*
* logSite logs a new tab / new page visit to a site
* @param    site    the name of the site being visited
* @param    start   timestamp for when the site gained focus
* @param    sender  timestamp for when the site lost focus
*/

function logSiteVisit(obj){
    console.log(obj)
    //we want to filter for pages beloning to this extension.
    if(obj.site.indexOf(chrome.runtime.id) != -1){
        obj.site = "drawntodistraction";
    }
    obj.type = "visit"
    log(obj)
}

/*
* logAction logs a user response to the block page
* @param    site    the name of the site being blocked
* @param    action  the user action (dismiss | distract | close)
*/

function logAction(site, action){
    log({type: "action", site: site, action: action})
}

function log(msg){
    var obj = {}
    msg.userID = userID
    obj[Date.now()] = msg;

    chrome.storage.local.set(obj, function() {
          console.log('Log saved');
    });

    //TODO: Make a post to log server -- remember to check for errors (wait till online to send from local storage)
}
