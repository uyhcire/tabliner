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
