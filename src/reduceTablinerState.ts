import { ChromeTab } from "ChromeTab";

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

interface TabCreatedEvent {
  type: "TAB_CREATED_EVENT";
  tab: ChromeTab;
}

interface TabUpdatedEvent {
  type: "TAB_UPDATED_EVENT";
  tab: ChromeTab;
}

interface TabActivatedEvent {
  type: "TAB_ACTIVATED_EVENT";
  tabId: number;
  windowId: number;
}

interface TabDetachedEvent {
  type: "TAB_DETACHED_EVENT";
  tabId: number;
  detachInfo: chrome.tabs.TabDetachInfo;
}

interface TabAttachedEvent {
  type: "TAB_ATTACHED_EVENT";
  tabId: number;
  attachInfo: chrome.tabs.TabAttachInfo;
}

type ChromeTabsEvent =
  | QueryReturned
  | TabRemovedEvent
  | TabMovedEvent
  | TabCreatedEvent
  | TabUpdatedEvent
  | TabActivatedEvent
  | TabDetachedEvent
  | TabAttachedEvent;

export type TablinerAction =
  | ChromeTabsEvent
  | { type: "OWN_TAB_ID_FETCHED"; tabId: number }
  | { type: "WINDOW_FOCUSED"; windowId: number | null }
  | { type: "TAB_FOCUSED"; tabId: number }
  | { type: "SET_SELECTED_INDEX"; index: number | null };

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

function reduceForTabCreatedOrAttached(
  chromeTabs: Array<ChromeTab>,
  newTab: ChromeTab
): Array<ChromeTab> {
  let newTabs: Array<ChromeTab> = [];

  // If there's an existing window to put the tab in, find where to put it
  let indexToInsertAt = -1;
  if (newTab.index > 0) {
    const indexToInsertAfter = chromeTabs.findIndex(
      tab => tab.index === newTab.index - 1 && tab.windowId === newTab.windowId
    );
    if (indexToInsertAfter !== -1) {
      indexToInsertAt = indexToInsertAfter + 1;
    }
  } else {
    indexToInsertAt = chromeTabs.findIndex(
      tab => tab.index === 0 && tab.windowId === newTab.windowId
    );
  }

  if (indexToInsertAt !== -1) {
    newTabs = [
      ...chromeTabs.slice(0, indexToInsertAt),
      newTab,
      ...chromeTabs.slice(indexToInsertAt)
    ];
  } else {
    // If there's no existing window for the tab, put it at the end
    if (newTab.index !== 0) {
      throw new Error("Expected tab in new window to have index 0");
    }
    newTabs = [...chromeTabs, newTab];
  }

  return newTabs;
}

export function reduceChromeTabs(
  {
    chromeTabs,
    detachedTabs
  }: { chromeTabs: Array<ChromeTab> | null; detachedTabs: Array<ChromeTab> },
  event: TablinerAction
): { chromeTabs: Array<ChromeTab> | null; detachedTabs: Array<ChromeTab> } {
  if (event.type === "QUERY_RETURNED") {
    chromeTabs = event.tabs;
  } else if (chromeTabs == null) {
    chromeTabs = null;
  } else {
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
      case "TAB_CREATED_EVENT": {
        const { tab: newTab } = event;
        newTabs = reduceForTabCreatedOrAttached(chromeTabs, newTab);
        break;
      }
      case "TAB_UPDATED_EVENT": {
        const { tab: newTab } = event;
        newTabs = chromeTabs.map(oldTab =>
          oldTab.id === newTab.id ? newTab : oldTab
        );
        break;
      }
      case "TAB_ACTIVATED_EVENT": {
        const { tabId, windowId } = event;

        newTabs = chromeTabs.map(tab => {
          if (tab.id === tabId) {
            return { ...tab, active: true };
          } else if (tab.windowId === windowId) {
            return { ...tab, active: false };
          } else {
            return tab;
          }
        });

        break;
      }
      case "TAB_DETACHED_EVENT": {
        const { tabId, detachInfo } = event;
        const detachedTab = chromeTabs.find(tab => tab.id === tabId);
        if (detachedTab == null) {
          throw new Error("Tab was detached but it could not be found");
        }
        if (detachedTab.windowId !== detachInfo.oldWindowId) {
          throw new Error(
            "Tab was detached but the specified oldWindowId did not match"
          );
        }
        if (detachedTab.index !== detachInfo.oldPosition) {
          throw new Error(
            "Tab was detached but the specified oldPosition did not match"
          );
        }
        detachedTabs = [...detachedTabs, detachedTab];
        newTabs = chromeTabs.filter(tab => tab.id !== tabId);
        break;
      }
      case "TAB_ATTACHED_EVENT": {
        const { tabId, attachInfo } = event;
        const tabToAttach = detachedTabs.find(tab => tab.id === tabId);
        if (tabToAttach == null) {
          throw new Error(
            "Tab was attached but it could not be found in the list of detached tabs"
          );
        }
        detachedTabs = detachedTabs.filter(tab => tab.id !== tabId);
        newTabs = reduceForTabCreatedOrAttached(chromeTabs, {
          ...tabToAttach,
          windowId: attachInfo.newWindowId,
          index: attachInfo.newPosition
        });
        break;
      }
      default:
        newTabs = chromeTabs;
    }
    chromeTabs = reindexTabs(newTabs);
  }

  return { chromeTabs, detachedTabs };
}

export function reduceSelectedTabIndex(
  selectedTabIndex: number | null,
  action: TablinerAction
): number | null {
  if (action.type === "SET_SELECTED_INDEX") {
    return action.index;
  }
  return selectedTabIndex;
}

export interface TablinerState {
  chromeTabs: Array<ChromeTab> | null;
  detachedTabs: Array<ChromeTab>;
  ownTabId: number | null;
  focusedWindowId: number | null;
  focusedTabId: number | null;
  selectedTabIndex: number | null;
}

export function reduceTablinerState(
  state: TablinerState,
  action: TablinerAction
): TablinerState {
  const { chromeTabs, detachedTabs } = reduceChromeTabs(
    { chromeTabs: state.chromeTabs, detachedTabs: state.detachedTabs },
    action
  );
  let selectedTabIndex = reduceSelectedTabIndex(state.selectedTabIndex, action);

  // Keep selectedTabIndex within bounds
  if (selectedTabIndex == null || chromeTabs == null) {
    selectedTabIndex == null;
  } else if (selectedTabIndex < 0) {
    selectedTabIndex = 0;
  } else if (selectedTabIndex >= chromeTabs.length) {
    selectedTabIndex = chromeTabs.length - 1;
  }

  let ownTabId = state.ownTabId;
  if (action.type === "OWN_TAB_ID_FETCHED") {
    ownTabId = action.tabId;
  }

  let focusedWindowId = state.focusedWindowId;
  if (action.type === "WINDOW_FOCUSED") {
    focusedWindowId = action.windowId;
  }

  let focusedTabId = state.focusedTabId;
  if (action.type === "TAB_FOCUSED") {
    const previousFocusedTabId = focusedTabId;
    focusedTabId = action.tabId;

    /*
     * If Tabliner's tab is focused, select the tab you were previously using.
     *
     * This way, if you change your mind, it's easy to go back.
     */
    if (
      chromeTabs != null &&
      action.tabId === ownTabId &&
      // If Tabliner is already open, we don't want to mess with the user's selection.
      // So don't auto-select the Tabliner tab, even if it was the most recently focused.
      previousFocusedTabId !== ownTabId
    ) {
      const previousFocusedTabIndex = chromeTabs.findIndex(
        tab => tab.id === previousFocusedTabId
      );
      if (previousFocusedTabIndex !== -1) {
        selectedTabIndex = previousFocusedTabIndex;
      }
    }
  }

  return {
    chromeTabs,
    detachedTabs,
    ownTabId,
    focusedWindowId,
    focusedTabId,
    selectedTabIndex
  };
}
