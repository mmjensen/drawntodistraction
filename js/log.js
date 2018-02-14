'use strict';
var currentSite, tick, lastRemoteLog = 0;
var userID;
var mousestart;

bootstrap()
function bootstrap(){
    chrome.storage.local.get("userID", function(item){
        if(item.hasOwnProperty("userID")){
            userID = item.userID;
            startLogging()
        } else {
            chrome.runtime.openOptionsPage()
        }
    });
}

function wipeUser(){
    chrome.storage.local.remove("userID", function(e){
        console.log(e)
    })
}

function startLogging() {
    console.log("Logging started!")
    //Note, if adding "blocking" to the opt_extraInfoSpec, then the request is sync and will not complete until the callback funciton returns
    //https://developer.chrome.com/extensions/webRequest
    chrome.webRequest.onResponseStarted.addListener(function(e) {
        if (e.ip) { //Simple check that this is not a "google newpage"
            newSiteVisit(getHostname(e.url), e.tabId)
        } else if (e.url.indexOf(chrome.runtime.id) != -1) {
            newSiteVisit("drawntodistraction", e.tabId)
        } else {
            newSiteVisit("newtab", -1) //we need to log this incase people return to a newtab
        }

    }, {
        urls: [],
        types: ["main_frame"]
    })

    chrome.windows.onFocusChanged.addListener(function(e) {
        if (e === -1) {
            newSiteVisit("external", -1) //this indicates that chrome lost focus completely
        } else {
            chrome.windows.getCurrent({
                populate: true
            }, function(ev) {
                //We want to detect the active tab
                for (var i = 0; i < ev.tabs.length; i++) {
                    if (ev.tabs[i].active) {
                        newSiteVisit(getHostname(ev.tabs[i].url), ev.tabs[i].id)
                        break;
                    }
                }
            })
        }
    });

    chrome.tabs.onActivated.addListener(function(e) {
        chrome.tabs.get(e.tabId, function(ev) {
            if (ev.url != "chrome://newtab/") {
                newSiteVisit(getHostname(ev.url), ev.id)
            }
        })
    })

    chrome.extension.onMessage.addListener(function(msg) {
        if (msg.action === "key") {
            currentSite.interactions.keys++
        } else if (msg.action === "scroll") {
            currentSite.interactions.scrolls++
        } else if (msg.action === "click") {
            currentSite.interactions.clicks++
        } else if (msg.action === "mousestart") {
            mousestart = Date.now()
        } else if (msg.action === "mousestop" && mousestart != 0) {
            currentSite.interactions.mouse += Date.now() - mousestart;
            mousestart = 0
        }

        return;
    });

    tick = setInterval(function() {
        var now = Date.now();
        if (now > lastRemoteLog) {
            var sessions = []
            chrome.storage.local.get(null, function(items) {
                for (var key in items) {
                    if (key != 'userID' && key < now) {
                        sessions.push(items[key])
                    }
                }
                if (sessions.length != 0) {
                    logToServer({
                        userID: userID,
                        sessions: sessions
                    }, function(err) {
                        if (!err) {
                            for (var key in items) {
                                if (key != 'userID' && key < now) {
                                    chrome.storage.local.remove(key);
                                }
                            }
                            lastRemoteLog = now
                        }
                    })
                }
            })
        }
    }, 60000);

}

//We want to handle cases where the extension is refreshed and we need to update injected scripts
//see: https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/QLC4gNlYjbA/URnEOjAsCQAJ
chrome.runtime.onInstalled.addListener(function(e) {
    chrome.windows.getAll({
        populate: true
    }, function(windows) {
        windows.forEach(function(w) {
            w.tabs.forEach(function(tab) {
                if (tab.url != "chrome://extensions/") {
                    //chrome.tabs.reload(tab.id)
                }
            })
        })
    })
})

function newSiteVisit(site, tabId) {
    if (!currentSite) {
        var now = Date.now()
        currentSite = {
            sessionID: now,
            userID: userID,
            start: Date.now(),
            site: site,
            tabId: tabId,
            prev: "external",
            tabs: 0,
            instances: 0,
            windows: 0,
            interactions: {
                clicks: 0,
                scrolls: 0,
                keys: 0,
                mouse: 0
            }
        }
    } else if (currentSite.site != site || tabId != currentSite.tabId) {
        if (mousestart != 0) {
            currentSite.interactions.mouse += Date.now() - mousestart;
            mousestart = 0;
        }

        currentSite.end = Date.now();
        var prev = currentSite.prev;

        currentSite.next = site;
        logSiteVisit(currentSite)
        var now = Date.now()
        currentSite = {
            sessionID: now,
            userID: userID,
            start: now,
            site: site,
            tabId: tabId,
            prev: prev,
            tabs: 0,
            instances: 0,
            windows: 0,
            interactions: {
                clicks: 0,
                scrolls: 0,
                keys: 0,
                mouse: 0
            }
        }
    }

    chrome.windows.getAll({
        populate: true
    }, function(windows) {
        currentSite.windows = windows.length
        windows.forEach(function(w) {
            currentSite.tabs += w.tabs.length;
            w.tabs.forEach(function(tab) {
                if (getHostname(tab.url) === site) {
                    currentSite.instances++;
                }
            })
        })
    })
}

function getHostname(url) {
    var parser = document.createElement('a');
    parser.href = url;
    var protocol =  parser.protocol
    var host = parser.host
    if(protocol === "file:"){
        return "file"
    } else if (protocol == "http:" || protocol == "https:"){
        return host.replace(/^(www)(\.)/i,"");
    } else {
        return protocol + host;
    }
}

/*
 * logSite logs a new tab / new page visit to a site
 * @param    site    the name of the site being visited
 * @param    start   timestamp for when the site gained focus
 * @param    sender  timestamp for when the site lost focus
 */

function logSiteVisit(obj) {
    //we want to filter for pages beloning to this extension.
    if (obj.site.indexOf(chrome.runtime.id) != -1) {
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

function logAction(site, action) {
    log({
        type: "action",
        site: site,
        action: action
    })
}

function log(msg) {
    console.log(msg.site)
    var obj = {}
    msg.userID = userID;
    obj[Date.now()] = msg;

    chrome.storage.local.set(obj, function() {});
}

function logToServer(jsonObject, callback) {
    // Sending and receiving data in JSON format using POST method
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://cio.cs.au.dk/drawntodistraction/sessions", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function(e) {
        if (e.currentTarget.status === 200) {
            console.log("Logged To Server!")
            callback()
        } else { console.log("Onload error") }
    }
    xhr.onerror = function(e) {
        console.log("Onerror error")
        callback("error")
    }
    xhr.send(JSON.stringify(jsonObject));
}


/*
    Getter for the user variable
*/
function getUser() {
    return userID;
}

function registerUser(name, isoDate, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://cio.cs.au.dk/CIOIDS/post", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function(e) {
        if (e.currentTarget.status === 200) {
            var data = JSON.parse(e.currentTarget.responseText);
            userID = data.cioid;
            chrome.storage.local.set({userID:userID});
            startLogging();
            callback()
        } else {
            callback("error")
        }

    }
    xhr.onerror = function(e) {
        callback("error")
        console.log("Error in attempting to get user id!")
    }

    xhr.send(JSON.stringify({
        namestring: name,
        datestring: isoDate
    }));
}
