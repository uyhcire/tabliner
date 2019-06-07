import { ChromeTab } from "ChromeTab";

export const CHROME_WINDOWS: Array<chrome.windows.Window> = [
  {
    id: 1,
    focused: true,
    type: "normal",
    state: "normal",
    incognito: false,
    alwaysOnTop: false
  },
  {
    id: 2,
    focused: false,
    type: "normal",
    state: "normal",
    incognito: false,
    alwaysOnTop: false
  }
];

export function makeChromeTab(tabInfo: {
  id: number;
  index: number;
  windowId: number;
  url: string;
  title: string;
}): ChromeTab & { id: number } {
  return {
    id: tabInfo.id,
    index: tabInfo.index,
    windowId: tabInfo.windowId,
    selected: false,
    highlighted: false,
    active: false,
    pinned: false,
    discarded: false,
    autoDiscardable: false,
    url: tabInfo.url,
    title: tabInfo.title,
    favIconUrl: "https://example.com/favicon.ico",
    status: "complete",
    incognito: false
  };
}

export function makeChromeTabs(
  tabInfos: Array<{ url: string; title: string }>
): Array<ChromeTab & { id: number }> {
  if (tabInfos.length === 0) {
    throw new Error("At least one tab is required");
  }

  const tabs = tabInfos.map((tabInfo, i) =>
    makeChromeTab({
      id: i,
      index: i,
      windowId: CHROME_WINDOWS[0].id,
      url: tabInfo.url,
      title: tabInfo.title
    })
  );

  tabs[0].selected = true;
  tabs[0].highlighted = true;
  tabs[0].active = true;

  return tabs;
}

export const TWO_TABS: Array<ChromeTab & { id: number }> = makeChromeTabs([
  { url: "https://google.com", title: "Google" },
  { url: "https://yahoo.com", title: "Yahoo" }
]);

export let TWO_WINDOWS_TWO_TABS_EACH: Array<ChromeTab & { id: number }>;
TWO_WINDOWS_TWO_TABS_EACH = makeChromeTabs([
  { title: "0", url: "https://example.com" },
  { title: "1", url: "https://example.com" },
  { title: "2", url: "https://example.com" },
  { title: "3", url: "https://example.com" }
]);
TWO_WINDOWS_TWO_TABS_EACH = [
  { ...TWO_WINDOWS_TWO_TABS_EACH[0], windowId: 1, index: 0 },
  { ...TWO_WINDOWS_TWO_TABS_EACH[1], windowId: 1, index: 1 },
  { ...TWO_WINDOWS_TWO_TABS_EACH[2], windowId: 2, index: 0 },
  { ...TWO_WINDOWS_TWO_TABS_EACH[3], windowId: 2, index: 1 }
];
