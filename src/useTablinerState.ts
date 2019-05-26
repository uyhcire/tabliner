import { useEffect, useReducer } from "react";
import { ChromeTab } from "./ChromeTab";
import { reduceTablinerState } from "./reduceTablinerState";
import { useFocusedWindowListener } from "./listeners/useFocusedWindowListener";
import { useFocusedTabListener } from "./listeners/useFocusedTabListener";

function findChromeTab(chromeTabs: Array<ChromeTab>, tabId: number): ChromeTab {
  const tab = chromeTabs.find(tab => tab.id === tabId);
  if (tab == null) {
    throw new Error("Tab not found!");
  }
  return tab;
}

export function useTablinerState(): {
  chromeTabs: Array<ChromeTab> | null;
  selectedTabIndex: number | null;
  setSelectedTabIndex(index: number | null): void;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
  handleGoToTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
} {
  const [
    { chromeTabs, focusedWindowId, selectedTabIndex },
    dispatch
  ] = useReducer(reduceTablinerState, {
    chromeTabs: null,
    ownTabId: null,
    focusedWindowId: null,
    focusedTabId: null,
    selectedTabIndex: null
  });

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

  useEffect(() => {
    function handleTabCreated(tab: ChromeTab): void {
      dispatch({ type: "TAB_CREATED_EVENT", tab });
    }

    chrome.tabs.onCreated.addListener(handleTabCreated);
    return () => chrome.tabs.onCreated.removeListener(handleTabCreated);
  }, []);

  useEffect(() => {
    function handleTabActivated({
      tabId,
      windowId
    }: chrome.tabs.TabActiveInfo): void {
      dispatch({ type: "TAB_ACTIVATED_EVENT", tabId, windowId });
    }

    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => chrome.tabs.onActivated.removeListener(handleTabActivated);
  }, []);

  useEffect((): void => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (tabId: number) => {
      dispatch({ type: "OWN_TAB_ID_FETCHED", tabId });
    });
  }, []);

  function handleWindowFocused(windowId: number | null): void {
    dispatch({ type: "WINDOW_FOCUSED", windowId });
  }
  useFocusedWindowListener(focusedWindowId, handleWindowFocused);

  function handleTabFocused(tabId: number): void {
    dispatch({ type: "TAB_FOCUSED", tabId });
  }
  useFocusedTabListener(chromeTabs, focusedWindowId, handleTabFocused);

  return {
    chromeTabs,
    selectedTabIndex,
    setSelectedTabIndex(index: number | null): void {
      dispatch({ type: "SET_SELECTED_INDEX", index });
    },
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