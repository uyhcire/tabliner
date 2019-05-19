import { useEffect, useState } from "react";
import { ChromeTab } from "./ChromeTab";

export function useChromeTabs(): {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
} {
  const [chromeTabs, setChromeTabs] = useState<Array<ChromeTab> | null>(null);

  // Load tabs
  useEffect((): void => {
    chrome.tabs.query(
      {},
      (tabs: Array<ChromeTab>): void => setChromeTabs(tabs)
    );
  }, []);

  useEffect(() => {
    function handleTabRemoved(tabId: number): void {
      setChromeTabs(chromeTabs && chromeTabs.filter(tab => tab.id !== tabId));
    }
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    return () => chrome.tabs.onRemoved.removeListener(handleTabRemoved);
  });

  useEffect(() => {
    function handleTabMoved(
      tabId: number,
      // Chrome also sends fromIndex, but that doesn't seem reliable.
      // When a tab is dragged across multiple other tabs, Chrome fires
      // multiple onMoved events, each with the same fromIndex
      // (instead of using the tab's new location as the fromIndex each time).
      // So in general, chromeTabs[fromIndex].id !== tabId, and fromIndex isn't very useful.
      moveInfo: { toIndex: number }
    ): void {
      if (chromeTabs) {
        const fromIndex = chromeTabs.findIndex(tab => tab.id === tabId);
        if (fromIndex === -1) {
          throw new Error(`Tab ID ${tabId} could not be found`);
        }

        let newTabs = [
          ...chromeTabs.slice(0, fromIndex),
          ...chromeTabs.slice(fromIndex + 1)
        ];
        newTabs = [
          ...newTabs.slice(0, moveInfo.toIndex),
          chromeTabs[fromIndex],
          ...newTabs.slice(moveInfo.toIndex)
        ];
        newTabs = newTabs.map((tab, index) => ({ ...tab, index }));

        setChromeTabs(newTabs);
      }
    }

    chrome.tabs.onMoved.addListener(handleTabMoved);
    return () => chrome.tabs.onMoved.removeListener(handleTabMoved);
  });

  return {
    chromeTabs,
    handleCloseTab(tabId: number): void {
      chrome.tabs.remove(tabId);
    },
    handleMoveTab(tabId: number, newIndex: number): void {
      chrome.tabs.move(tabId, { index: newIndex });
    }
  };
}
