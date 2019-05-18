// We have the `tabs` permission, so some fields are guaranteed to be present
export type ChromeTab = chrome.tabs.Tab & { title: string };
