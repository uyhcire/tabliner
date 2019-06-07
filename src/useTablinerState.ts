import { useEffect, useReducer } from "react";

import { ChromeTab } from "ChromeTab";
import {
  reduceTablinerState,
  SelectedNodePath,
  groupTabsByWindow
} from "reduceTablinerState";
import { useFocusedWindowListener } from "listeners/useFocusedWindowListener";
import { useFocusedTabListener } from "listeners/useFocusedTabListener";

function findChromeTab(chromeTabs: Array<ChromeTab>, tabId: number): ChromeTab {
  const tab = chromeTabs.find(tab => tab.id === tabId);
  if (tab == null) {
    throw new Error("Tab not found!");
  }
  return tab;
}

function assertTabsAreInOrder(tabs: Array<ChromeTab>): void {
  for (let i = 0; i < tabs.length - 1; i++) {
    if (
      tabs[i].windowId === tabs[i + 1].windowId &&
      tabs[i].index + 1 !== tabs[i + 1].index
    ) {
      throw new Error("Expected tabs in the same window to be contiguous");
    }
    if (
      (i === 0 && tabs[i].index !== 0) ||
      (tabs[i + 1].windowId !== tabs[i].windowId && tabs[i + 1].index !== 0)
    ) {
      throw new Error("Expected the first tab in a window to have index 0");
    }
  }
}

export function useTablinerState(): {
  chromeTabs: Array<ChromeTab> | null;
  focusedWindowId: number | null;
  focusedTabId: number | null;
  selectedNodePath: SelectedNodePath | null;
  setSelectedNodePath(index: SelectedNodePath | null): void;
  moveSelectedNodeUp(): void;
  moveSelectedNodeDown(): void;
  handleCloseTab(tabId: number): void;
  handleMoveTab(
    windowId: number,
    tabId: number,
    newIndexInWindow: number
  ): void;
  handleGoToTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
  handleMergeWindows({
    sourceWindowId,
    destinationWindowId
  }: {
    sourceWindowId: number;
    destinationWindowId: number;
  }): void;
} {
  const [
    { chromeTabs, focusedWindowId, focusedTabId, selectedNodePath },
    dispatch
  ] = useReducer(reduceTablinerState, {
    chromeTabs: null,
    detachedTabs: [],
    ownTabId: null,
    focusedWindowId: null,
    focusedTabId: null,
    selectedNodePath: null
  });

  // Load tabs
  useEffect((): void => {
    chrome.tabs.query(
      {},
      (tabs: Array<ChromeTab>): void => {
        assertTabsAreInOrder(tabs);
        dispatch({ type: "QUERY_RETURNED", tabs });
      }
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
    function handleTabUpdated(
      _tabId: number,
      _changeInfo: chrome.tabs.TabChangeInfo,
      tab: ChromeTab
    ): void {
      dispatch({ type: "TAB_UPDATED_EVENT", tab });
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    return () => chrome.tabs.onUpdated.removeListener(handleTabUpdated);
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

  useEffect(() => {
    function handleTabDetached(
      tabId: number,
      detachInfo: chrome.tabs.TabDetachInfo
    ): void {
      dispatch({ type: "TAB_DETACHED_EVENT", tabId, detachInfo });
    }

    chrome.tabs.onDetached.addListener(handleTabDetached);
    return () => chrome.tabs.onDetached.removeListener(handleTabDetached);
  });

  useEffect(() => {
    function handleTabAttached(
      tabId: number,
      attachInfo: chrome.tabs.TabAttachInfo
    ): void {
      dispatch({ type: "TAB_ATTACHED_EVENT", tabId, attachInfo });
    }

    chrome.tabs.onAttached.addListener(handleTabAttached);
    return () => chrome.tabs.onAttached.removeListener(handleTabAttached);
  });

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
    focusedWindowId,
    focusedTabId,
    selectedNodePath,
    setSelectedNodePath(selectedNodePath: SelectedNodePath | null): void {
      dispatch({ type: "SET_SELECTED_NODE_PATH", selectedNodePath });
    },
    moveSelectedNodeUp(): void {
      dispatch({ type: "MOVE_SELECTED_NODE_UP" });
    },
    moveSelectedNodeDown(): void {
      dispatch({ type: "MOVE_SELECTED_NODE_DOWN" });
    },
    handleCloseTab(tabId: number): void {
      chrome.tabs.remove(tabId);
    },
    handleMoveTab(
      windowId: number,
      tabId: number,
      newIndexInWindow: number
    ): void {
      if (chromeTabs == null) {
        return;
      }

      const groupedTabs = groupTabsByWindow(chromeTabs);
      const windowIndex = groupedTabs.findIndex(
        ({ windowId: _windowId }) => _windowId === windowId
      );
      if (windowIndex === -1) {
        throw new Error("Window not found");
      }

      if (newIndexInWindow < 0) {
        newIndexInWindow = 0;
      }
      if (newIndexInWindow >= groupedTabs[windowIndex].windowTabs.length) {
        newIndexInWindow = groupedTabs[windowIndex].windowTabs.length - 1;
      }

      chrome.tabs.move(tabId, { index: newIndexInWindow });
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
    },
    handleMergeWindows({
      sourceWindowId,
      destinationWindowId
    }: {
      sourceWindowId: number;
      destinationWindowId: number;
    }): void {
      if (chromeTabs == null) {
        return;
      }

      const tabIds = chromeTabs
        .filter(tab => tab.windowId === sourceWindowId)
        .map(tab => tab.id);
      if (tabIds.some(tabId => tabId == null)) {
        throw new Error("Cannot merge window with undefined tab IDs");
      }

      chrome.tabs.move(tabIds as Array<number>, {
        windowId: destinationWindowId,
        index: -1
      });
    }
  };
}
