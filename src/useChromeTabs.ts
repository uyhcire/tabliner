import { useEffect, useReducer } from "react";
import { ChromeTab } from "./ChromeTab";

interface QueryReturned {
  type: "QUERY_RETURNED";
  tabs: Array<ChromeTab>;
}

interface TabRemovedEvent {
  type: "TAB_REMOVED_EVENT";
  tabId: number;
}

interface TabMovedEvent {
  type: "TAB_MOVED_EVENT";
  tabId: number;
  moveInfo: chrome.tabs.TabMoveInfo;
}

type ChromeTabsAction = QueryReturned | TabRemovedEvent | TabMovedEvent;

function reduceChromeTabs(
  chromeTabs: Array<ChromeTab> | null,
  action: ChromeTabsAction
): Array<ChromeTab> | null {
  if (action.type === "QUERY_RETURNED") {
    return action.tabs;
  }

  if (chromeTabs == null) {
    return null;
  }

  switch (action.type) {
    case "TAB_REMOVED_EVENT":
      return chromeTabs.filter(tab => tab.id !== action.tabId);
    case "TAB_MOVED_EVENT": {
      const { tabId, moveInfo } = action;

      if (chromeTabs[moveInfo.fromIndex].id !== tabId) {
        throw new Error("A tab was moved but could not be found!");
      }

      let newTabs = [
        ...chromeTabs.slice(0, moveInfo.fromIndex),
        ...chromeTabs.slice(moveInfo.fromIndex + 1)
      ];
      newTabs = [
        ...newTabs.slice(0, moveInfo.toIndex),
        chromeTabs[moveInfo.fromIndex],
        ...newTabs.slice(moveInfo.toIndex)
      ];
      return newTabs.map((tab, index) => ({ ...tab, index }));
    }
  }
}

export function useChromeTabs(): {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
  handleGoToTab(tabId: number): void;
} {
  const [chromeTabs, dispatch] = useReducer(reduceChromeTabs, null);

  // Load tabs
  useEffect((): void => {
    chrome.tabs.query(
      {},
      (tabs: Array<ChromeTab>): void =>
        dispatch({ type: "QUERY_RETURNED", tabs })
    );
  }, []);

  useEffect(() => {
    function handleTabRemoved(tabId: number): void {
      dispatch({ type: "TAB_REMOVED_EVENT", tabId });
    }
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    return () => chrome.tabs.onRemoved.removeListener(handleTabRemoved);
  }, []);

  useEffect(() => {
    function handleTabMoved(
      tabId: number,
      moveInfo: chrome.tabs.TabMoveInfo
    ): void {
      dispatch({ type: "TAB_MOVED_EVENT", tabId, moveInfo });
    }

    chrome.tabs.onMoved.addListener(handleTabMoved);
    return () => chrome.tabs.onMoved.removeListener(handleTabMoved);
  }, []);

  return {
    chromeTabs,
    handleCloseTab(tabId: number): void {
      chrome.tabs.remove(tabId);
    },
    handleMoveTab(tabId: number, newIndex: number): void {
      chrome.tabs.move(tabId, { index: newIndex });
    },
    handleGoToTab(tabId: number): void {
      if (chromeTabs == null) {
        return;
      }
      const tab = chromeTabs.find(tab => tab.id === tabId);
      if (tab == null) {
        throw new Error("Tab not found!");
      }

      chrome.tabs.update(tabId, { active: true }, () => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    }
  };
}
