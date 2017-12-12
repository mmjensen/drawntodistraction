var counter = 0;
chrome.browserAction.onClicked.addListener(function (tab) {
    counter++;
    if (counter == 5) {
        alert("Hey !!! You have clicked five times");
    }
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete') {
    	console.log("tabs onUpdated called");
    	chrome.tabs.get(tabId, function(tab){
     		console.log(tab.url);
     		if(tab.url.includes("facebook.")){
     			console.log("in the loop");
          highlightDistraction();
     		}
  		});
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  // how to fetch tab url using activeInfo.tabid
  chrome.tabs.get(activeInfo.tabId, function(tab){
    console.log(tab.url);
    if(tab.url.includes("facebook.")){
      console.log("in the loop (onActivated");
      highlightDistraction();
    }
  });
}); 

function highlightDistraction(){
  var script = "blocking.js";
  var css = "style.css";
  //var script = 'document.body.style.backgroundColor="yellow"; let newDiv = document.createElement("div"); newDiv.id = "interference"; newDiv.style.position = "absolute"; newDiv.style.top = "0px"; newDiv.style.left = "0px"; newDiv.style.width = "90%"; newDiv.style.height = "90%"; newDiv.style.backgroundColor = "black"; newDiv.style.color = "white"; newDiv.style.textAlign = "center"; newDiv.style.fontSize = "15vmin"; newDiv.style.padding = "5%"; newDiv.innerHTML = "ER DU SIKKER PÅ AT DU VIL PÅ FACEBOOK?!?"; document.body.appendChild(newDiv);';

  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    file: script
  });

  chrome.tabs.insertCSS({
    file: css
  });
}
