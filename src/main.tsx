import ReactDOM from "react-dom";
import React, { useEffect, useState, useCallback } from "react";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import { ChromeTab } from "./ChromeTab";
import TabTree from "./TabTree";
import { useChromeTabs } from "./useChromeTabs";

function useFocusedWindowId(): number | null {
  const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null);

  useEffect(() => {
    chrome.windows.getAll({}, windows => {
      const focusedWindows = windows.filter(window => window.focused);
      if (focusedWindows.length > 1) {
        throw new Error("Expected at most 1 window to be focused!");
      } else if (focusedWindows.length === 0) {
        setFocusedWindowId(null);
      } else {
        setFocusedWindowId(focusedWindows[0].id);
      }
    });
  }, []);

  useEffect(() => {
    function handleFocusChanged(windowId: number): void {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        setFocusedWindowId(null);
      } else {
        setFocusedWindowId(windowId);
      }
    }

    chrome.windows.onFocusChanged.addListener(handleFocusChanged);
    return () =>
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged);
  }, [setFocusedWindowId]);

  return focusedWindowId;
}

function useOwnTabId(): number | null {
  const [ownTabId, setOwnTabId] = useState<number | null>(null);

  // Get our tab ID so we can detect
  useEffect((): void => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (tabId: number) => {
      setOwnTabId(tabId);
    });
  }, []);

  return ownTabId;
}

/**
 * If you open Tabliner, select the tab you were previously using.
 *
 * This way, if you change your mind, it's easy to go back.
 */
function usePreviousSelectedTabIndexIfExtensionFocused(
  chromeTabs: Array<ChromeTab> | null,
  ownTabId: number | null,
  setSelectedTabIndex: (index: number | null) => void
): void {
  const [focusedTabId, setFocusedTabId] = useState<number | null>(null);
  const focusedWindowId = useFocusedWindowId();

  const handleFocusedTabChanged = useCallback(
    (newFocusedTabId: number): void => {
      if (chromeTabs == null) {
        return;
      }

      // If our own tab is focused, select the previously focused tab.
      if (newFocusedTabId === ownTabId) {
        const previousFocusedTabIndex = chromeTabs.findIndex(
          tab => tab.id === focusedTabId
        );
        if (previousFocusedTabIndex !== -1) {
          setSelectedTabIndex(previousFocusedTabIndex);
        }
      }

      setFocusedTabId(newFocusedTabId);
    },
    [chromeTabs, ownTabId, setSelectedTabIndex, focusedTabId]
  );

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
        handleFocusedTabChanged(tabId);
      }
    }
    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => chrome.tabs.onActivated.removeListener(handleTabActivated);
  }, [chromeTabs, setFocusedTabId, focusedWindowId, handleFocusedTabChanged]);

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
        handleFocusedTabChanged(newFocusedTabId);
      }
    }

    chrome.windows.onFocusChanged.addListener(handleFocusChanged);
    return () =>
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged);
  }, [chromeTabs, handleFocusedTabChanged]);
}

function App(): JSX.Element | null {
  const {
    chromeTabs,
    selectedTabIndex,
    setSelectedTabIndex,
    handleCloseTab,
    handleMoveTab,
    handleGoToTab,
    handleCreateTabAfter
  } = useChromeTabs();

  const ownTabId = useOwnTabId();
  usePreviousSelectedTabIndexIfExtensionFocused(
    chromeTabs,
    ownTabId,
    setSelectedTabIndex
  );

  return (
    <div>
      {chromeTabs ? (
        <TabTree
          chromeTabs={chromeTabs}
          handleCloseTab={handleCloseTab}
          handleMoveTab={handleMoveTab}
          handleGoToTab={handleGoToTab}
          handleCreateTabAfter={handleCreateTabAfter}
          selectedTabIndex={selectedTabIndex}
          setSelectedTabIndex={setSelectedTabIndex}
        />
      ) : null}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
