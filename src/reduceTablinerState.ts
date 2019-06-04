import produce from "immer";

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
  | {
      type: "SET_SELECTED_NODE_PATH";
      selectedNodePath: SelectedNodePath | null;
    }
  | { type: "MOVE_SELECTED_NODE_UP" }
  | { type: "MOVE_SELECTED_NODE_DOWN" };

const reindexTabs = (tabs: Array<ChromeTab>): Array<ChromeTab> =>
  produce(tabs, draft => {
    for (let i = 0; i < draft.length; i++) {
      if (i === 0 || draft[i - 1].windowId !== draft[i].windowId) {
        draft[i].index = 0;
      } else {
        draft[i].index = draft[i - 1].index + 1;
      }
    }
  });

export const reduceForTabInserted = (
  chromeTabs: Array<ChromeTab>,
  newTab: ChromeTab
): Array<ChromeTab> =>
  produce(chromeTabs, draft => {
    // If there's an existing window to put the tab in, find where to put it
    let indexToInsertAt = -1;
    if (newTab.index > 0) {
      const indexToInsertAfter = draft.findIndex(
        tab =>
          tab.index === newTab.index - 1 && tab.windowId === newTab.windowId
      );
      if (indexToInsertAfter !== -1) {
        indexToInsertAt = indexToInsertAfter + 1;
      }
    } else {
      indexToInsertAt = draft.findIndex(
        tab => tab.index === 0 && tab.windowId === newTab.windowId
      );
    }

    if (indexToInsertAt !== -1) {
      draft.splice(indexToInsertAt, 0, newTab);
    } else {
      // If there's no existing window for the tab, put it at the end
      if (newTab.index !== 0) {
        throw new Error("Expected tab in new window to have index 0");
      }
      draft.push(newTab);
    }
  });

// Tabs grouped by window
export type GroupedTabs = Array<{
  windowId: number;
  windowTabs: Array<ChromeTab>;
}>;

export function groupTabsByWindow(chromeTabs: Array<ChromeTab>): GroupedTabs {
  const tabsByWindowId: { [windowId: number]: Array<ChromeTab> } = {};
  for (const tab of chromeTabs) {
    if (!(tab.windowId in tabsByWindowId)) {
      tabsByWindowId[tab.windowId] = [];
    }
    tabsByWindowId[tab.windowId].push(tab);
  }

  const orderedWindowIds: Set<number> = new Set(
    chromeTabs.map(tab => tab.windowId)
  );

  return [...orderedWindowIds].map(windowId => ({
    windowId,
    windowTabs: tabsByWindowId[windowId]
  }));
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

        // Translate from moveInfo to chromeTabs indexes.
        // When there are multiple windows, the indexes a tab moves between in chromeTabs
        // may be different from moveInfo.fromIndex and moveInfo.toIndex.
        const fromIndex = chromeTabs.findIndex(
          tab =>
            tab.windowId === moveInfo.windowId &&
            tab.index === moveInfo.fromIndex
        );
        const toIndex = chromeTabs.findIndex(
          tab =>
            tab.windowId === moveInfo.windowId && tab.index === moveInfo.toIndex
        );

        if (chromeTabs[fromIndex].id !== tabId) {
          throw new Error("A tab was moved but could not be found!");
        }

        newTabs = [
          ...chromeTabs.slice(0, fromIndex),
          ...chromeTabs.slice(fromIndex + 1)
        ];
        newTabs = [
          ...newTabs.slice(0, toIndex),
          chromeTabs[fromIndex],
          ...newTabs.slice(toIndex)
        ];
        break;
      }
      case "TAB_CREATED_EVENT": {
        const { tab: newTab } = event;
        newTabs = reduceForTabInserted(chromeTabs, newTab);
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
        newTabs = reduceForTabInserted(chromeTabs, {
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

export type SelectedNodePath =
  // If a window is selected
  | [number]
  // If a tab is selected
  | [number, number];

export function keepSelectionWithinBounds(
  groupedTabs: GroupedTabs,
  selectedNodePath: SelectedNodePath
): SelectedNodePath {
  if (selectedNodePath.length === 2) {
    let [windowIndex, tabIndex] = selectedNodePath;

    if (windowIndex >= groupedTabs.length) {
      windowIndex = groupedTabs.length - 1;
      tabIndex = groupedTabs[windowIndex].windowTabs.length - 1;
    } else if (tabIndex < 0) {
      tabIndex = 0;
    } else if (tabIndex >= groupedTabs[windowIndex].windowTabs.length) {
      tabIndex = groupedTabs[windowIndex].windowTabs.length - 1;
    }

    return [windowIndex, tabIndex];
  } else if (selectedNodePath.length === 1) {
    let [windowIndex] = selectedNodePath;
    if (windowIndex >= groupedTabs.length) {
      windowIndex = groupedTabs.length - 1;
    }
    return [windowIndex];
  } else {
    throw new Error("Expected either a tab or window to be selected");
  }
}

export function reduceSelectedNodePath(
  groupedTabs: GroupedTabs,
  selectedNodePath: SelectedNodePath | null,
  action: TablinerAction
): SelectedNodePath | null {
  if (action.type === "SET_SELECTED_NODE_PATH") {
    return action.selectedNodePath;
  }

  if (selectedNodePath == null) {
    return null;
  }

  if (action.type === "MOVE_SELECTED_NODE_UP") {
    let [windowIndex, tabIndex] = selectedNodePath;

    if (windowIndex === 0 && tabIndex == null) {
      return selectedNodePath;
    } else if (tabIndex === 0) {
      return [windowIndex];
    } else if (tabIndex == null) {
      return [
        windowIndex - 1,
        groupedTabs[windowIndex - 1].windowTabs.length - 1
      ];
    } else {
      return [windowIndex, tabIndex - 1];
    }
  } else if (action.type === "MOVE_SELECTED_NODE_DOWN") {
    let [windowIndex, tabIndex] = selectedNodePath;

    if (
      windowIndex === groupedTabs.length - 1 &&
      tabIndex === groupedTabs[windowIndex].windowTabs.length - 1
    ) {
      return selectedNodePath;
    } else if (tabIndex === groupedTabs[windowIndex].windowTabs.length - 1) {
      return [windowIndex + 1];
    } else if (tabIndex == null) {
      return [windowIndex, 0];
    } else {
      return [windowIndex, tabIndex + 1];
    }
  } else {
    return keepSelectionWithinBounds(groupedTabs, selectedNodePath);
  }
}

export interface TablinerState {
  chromeTabs: Array<ChromeTab> | null;
  detachedTabs: Array<ChromeTab>;
  ownTabId: number | null;
  focusedWindowId: number | null;
  focusedTabId: number | null;
  selectedNodePath: SelectedNodePath | null;
}

export function reduceTablinerState(
  state: TablinerState,
  action: TablinerAction
): TablinerState {
  const { chromeTabs, detachedTabs } = reduceChromeTabs(
    { chromeTabs: state.chromeTabs, detachedTabs: state.detachedTabs },
    action
  );

  const groupedTabs = chromeTabs && groupTabsByWindow(chromeTabs);

  let selectedNodePath =
    groupedTabs &&
    reduceSelectedNodePath(groupedTabs, state.selectedNodePath, action);

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
      groupedTabs != null &&
      action.tabId === ownTabId &&
      // If Tabliner is already open, we don't want to mess with the user's selection.
      // So don't auto-select the Tabliner tab, even if it was the most recently focused.
      previousFocusedTabId !== ownTabId
    ) {
      outer: for (const [
        windowIndex,
        { windowTabs }
      ] of groupedTabs.entries()) {
        for (const [tabIndex, tab] of windowTabs.entries()) {
          if (tab.id === previousFocusedTabId) {
            selectedNodePath = [windowIndex, tabIndex];
            break outer;
          }
        }
      }
    }
  }

  return {
    chromeTabs,
    detachedTabs,
    ownTabId,
    focusedWindowId,
    focusedTabId,
    selectedNodePath
  };
}
