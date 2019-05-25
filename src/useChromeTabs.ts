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

function reindexTabs(tabs: Array<ChromeTab>): Array<ChromeTab> {
  const windowIds = new Set(tabs.map(tab => tab.windowId));
  const maxIndexByWindow: { [windowId: number]: number } = {};
  for (const windowId of windowIds) {
    maxIndexByWindow[windowId] = 0;
  }

  const reindexedTabs = [];
  for (const tab of tabs) {
    const windowId = tab.windowId;
    reindexedTabs.push({ ...tab, index: maxIndexByWindow[windowId] });
    maxIndexByWindow[windowId] += 1;
  }
  return reindexedTabs;
}

type ChromeTabsEvent = QueryReturned | TabRemovedEvent | TabMovedEvent;

function findChromeTab(chromeTabs: Array<ChromeTab>, tabId: number): ChromeTab {
  const tab = chromeTabs.find(tab => tab.id === tabId);
  if (tab == null) {
    throw new Error("Tab not found!");
  }
  return tab;
}

function reduceChromeTabs(
  chromeTabs: Array<ChromeTab> | null,
  event: ChromeTabsEvent
): Array<ChromeTab> | null {
  if (event.type === "QUERY_RETURNED") {
    return event.tabs;
  }

  if (chromeTabs == null) {
    return null;
  }

  let newTabs: Array<ChromeTab>;
  switch (event.type) {
    case "TAB_REMOVED_EVENT":
      newTabs = chromeTabs.filter(tab => tab.id !== event.tabId);
      break;
    case "TAB_MOVED_EVENT": {
      const { tabId, moveInfo } = event;

      if (chromeTabs[moveInfo.fromIndex].id !== tabId) {
        throw new Error("A tab was moved but could not be found!");
      }

      newTabs = [
        ...chromeTabs.slice(0, moveInfo.fromIndex),
        ...chromeTabs.slice(moveInfo.fromIndex + 1)
      ];
      newTabs = [
        ...newTabs.slice(0, moveInfo.toIndex),
        chromeTabs[moveInfo.fromIndex],
        ...newTabs.slice(moveInfo.toIndex)
      ];
      break;
    }
    default:
      throw new Error(`Unexpected event type ${event!.type}`);
  }
  return reindexTabs(newTabs);
}

export function useChromeTabs(): {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
  handleGoToTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
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
      const tab = findChromeTab(chromeTabs, tabId);

      chrome.tabs.update(tabId, { active: true }, () => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    },
    handleCreateTabAfter(tabId: number): void {
      if (chromeTabs == null) {
        return;
      }
      const tab = findChromeTab(chromeTabs, tabId);

      // Create a tab immediately to the right of the given tab.
      //
      // Note: if the tab is pinned, this creates an unpinned tab
      // after the rightmost pinned tab.
      chrome.tabs.create(
        { windowId: tab.windowId, index: tab.index + 1 },
        () => {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      );
    }
  };
}
