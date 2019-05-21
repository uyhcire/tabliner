import { ChromeTab } from "./ChromeTab";

export function makeChromeTabs(
  tabInfos: Array<{ url: string; title: string }>
): Array<ChromeTab & { id: number }> {
  if (tabInfos.length === 0) {
    throw new Error("At least one tab is required");
  }

  const tabs = tabInfos.map((tabInfo, i) => ({
    id: i,
    index: i,
    windowId: 1,
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
  }));

  tabs[0].selected = true;
  tabs[0].highlighted = true;
  tabs[0].active = true;

  return tabs;
}

export const CHROME_TABS: Array<ChromeTab & { id: number }> = makeChromeTabs([
  { url: "https://google.com", title: "Google" },
  { url: "https://yahoo.com", title: "Yahoo" }
]);
