chrome.contextMenus.create({
    "title": "Dashboard",
    "type": "normal",
    "contexts": ["browser_action"],
    "visible": true,
    "onclick": loadDashboard
});

chrome.contextMenus.create({
    "title": "Study Website",
    "type": "normal",
    "contexts": ["browser_action"],
    "visible": true,
    "onclick": loadStudyWeb
});

function loadDashboard() {
    chrome.tabs.create({
        "url": "../client/dashboard.html"
    });
}

function loadStudyWeb() {
    chrome.tabs.create({
        "url": "https://cio.cs.au.dk/"
    });
}
