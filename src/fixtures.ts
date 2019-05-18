import { ChromeTab } from "./ChromeTab";

export const CHROME_TABS: Array<ChromeTab & { id: number }> = [
  {
    id: 1,
    index: 0,
    windowId: 1,
    selected: true,
    highlighted: true,
    active: true,
    pinned: false,
    discarded: false,
    autoDiscardable: false,
    url: "https://google.com",
    title: "Google",
    favIconUrl: "https://example.com/favicon.ico",
    status: "complete",
    incognito: false
  },
  {
    id: 2,
    index: 1,
    windowId: 1,
    selected: false,
    highlighted: false,
    active: false,
    pinned: false,
    discarded: false,
    autoDiscardable: false,
    url: "https://yahoo.com",
    title: "Yahoo",
    favIconUrl: "https://example.com/favicon.ico",
    status: "complete",
    incognito: false
  }
];
