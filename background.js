chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});

let extensionTabId = null;
chrome.commands.onCommand.addListener(function(command) {
  if (command === "open") {
    if (extensionTabId != null) {
      chrome.tabs.update(extensionTabId, { active: true }, tab => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    } else {
      chrome.tabs.create({ url: "index.html" }, tab => {
        extensionTabId = tab.id;
      });
    }
  }
});
chrome.tabs.onRemoved.addListener(function(tabId) {
  if (extensionTabId === tabId) {
    extensionTabId = null;
  }
});

// Allow the extension page to get the ID of its own tab
// https://stackoverflow.com/a/45600887
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === "GET_TAB_ID") {
    sendResponse(sender.tab.id);
  }
});
