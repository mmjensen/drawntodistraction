
var current; 
var userID = 1234 
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

/*
    Session data model:

    session = {
        site: "sitename",
        start: Epoch,
        end: Epoch,
        duration: end - start,
        prev: last activity site,
        next: next activity site,
        interactions: {clicks: num, moves: num, scrolls: num, keys: num}, //user interactions: Plain info related to activity and specific sites (consume versus produce etc.)
        tabId: num, //used for reference -> do people return to a tab with the specific 
        tabs: num, //how many tabs to people have open (simple information)
        windows: num, //how many windows do people have open (simple info)
        instances: num () //how many instances do the user have with this site? (research q: do people habitually open the same site in differnt tabs) 
    }


    Action data model:

    action = {
        type: "distract | focus",
        site: "sitename"
        ...
    }

    Post data model:

    post = {
        user: UserID,
        data: {session | action} 
    }



    //TODO: The introduction of prev and next creates an issue, as it would be "newtab"
    //in many instances. Consider saving the previous and next instances and check for 
    // newtab and external.
*/


/* Useful for claering local storage in development
chrome.storage.local.clear(function() {
    var error = chrome.runtime.lastError;
    if (error) {
        console.error(error);
    }
});
*/


//We want to handle cases where the extension is refreshed and we need to update injected scripts
//see: https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/QLC4gNlYjbA/URnEOjAsCQAJ
chrome.runtime.onInstalled.addListener(function(e){
    chrome.windows.getAll({populate: true}, function(windows){
        windows.forEach(function(w){
            w.tabs.forEach(function(tab){
                console.log(tab)
                if(tab.url != "chrome://extensions/") {
                    chrome.tabs.reload(tab.id)   
                }
            })
        })
        
    })
})


chrome.extension.onMessage.addListener(function(msg){
    if(msg.action === "key"){
        current.interactions.keys++
    } else if(msg.action === "scroll"){
        current.interactions.scrolls++
    } else if(msg.action === "click"){
        current.interactions.clicks++
    } else if(msg.action === "mousestart"){
        mousestart = Date.now()
    } else if(msg.action === "mousestop" && mousestart != 0){
        current.interactions.mouse+= Date.now()-mousestart;
        mousestart = 0
    }

    return;
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

    if(!current){
        current = { }
        current.start = Date.now()
        current.site = site;
        current.tabId = tabId;
        current.prev = "external"
        current.tabs = 0;
        current.instances = 0;
        current.interactions = {clicks:0, scrolls:0, keys:0, mouse:0 }

    } else if (current.site != site || tabId != current.tabId){
        if(mousestart != 0){
            current.interactions.mouse+= Date.now()-mousestart;
            mousestart = 0;
        }

        current.end = Date.now();
        current.next = site;

        var prev = current.prev;

        logSiteVisit(current)

        current = { }
        current.start = Date.now()
        current.site = site;
        current.tabId = tabId;
        current.prev = prev;
        current.tabs = 0;
        current.instances = 0;
        current.interactions = {clicks:0, scrolls:0, keys:0, mouse:0 }
    }

    chrome.windows.getAll({populate: true}, function(windows){
        current.windows = windows.length
        windows.forEach(function(w){
            current.tabs+= w.tabs.length;
            w.tabs.forEach(function(tab){
                if(getHostname(tab.url) === site){
                    current.instances++;
                }
            })
        })
        
    })
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

    //POST METHOD SKETCH (for memory)
    //Should this run at an interval rather than *every* site visit, e.g. 5 mins?
    //Save last timestamp for local storage
    //Post to server
        // Successfull reply: purge items in local storage with key before timestamp
        // Error: Wait for next log round

}
