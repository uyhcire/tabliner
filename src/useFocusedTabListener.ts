import { useEffect } from "react";

import { ChromeTab } from "./ChromeTab";

export function useFocusedTabListener(
  chromeTabs: Array<ChromeTab> | null,
  focusedWindowId: number | null,
  setFocusedTab: (tabId: number) => void
): void {
  // Handle activating a different tab in the same window
  useEffect(() => {
    function handleTabActivated({
      tabId,
      windowId
    }: chrome.tabs.TabActiveInfo): void {
      if (chromeTabs == null || focusedWindowId == null) {
        return;
      }
      if (windowId === focusedWindowId) {
        setFocusedTab(tabId);
      }
    }
    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => chrome.tabs.onActivated.removeListener(handleTabActivated);
  }, [chromeTabs, focusedWindowId, setFocusedTab]);

  // Handle focusing a different window
  useEffect(() => {
    function handleFocusChanged(windowId: number): void {
      if (chromeTabs == null || windowId === chrome.windows.WINDOW_ID_NONE) {
        return;
      }

      const newFocusedTab = chromeTabs.find(
        tab => tab.windowId === windowId && tab.active
      );
      const newFocusedTabId = newFocusedTab && newFocusedTab.id;
      if (newFocusedTabId) {
        setFocusedTab(newFocusedTabId);
      }
    }

    chrome.windows.onFocusChanged.addListener(handleFocusChanged);
    return () =>
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged);
  }, [chromeTabs, setFocusedTab]);
}
