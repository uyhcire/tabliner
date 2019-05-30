import { TablinerState, reduceTablinerState } from "./reduceTablinerState";
import { CHROME_TABS } from "./fixtures";

test.each([[-1, 0], [0, 0], [1, 1], [2, 1]])(
  "sets the tab index but stays within bounds (selecting index %j, expecting index %j)",
  (indexToSelect, expectedIndex) => {
    const state: TablinerState = {
      chromeTabs: CHROME_TABS,
      detachedTabs: [],
      ownTabId: null,
      focusedWindowId: null,
      focusedTabId: null,
      selectedTabIndex: null
    };

    const newState = reduceTablinerState(state, {
      type: "SET_SELECTED_INDEX",
      index: indexToSelect
    });

    expect(newState.selectedTabIndex).toEqual(expectedIndex);
  }
);

it("auto-selects the previously focused tab if Tabliner's own tab is focused", () => {
  const state: TablinerState = {
    chromeTabs: CHROME_TABS,
    detachedTabs: [],
    ownTabId: CHROME_TABS[1].id,
    focusedWindowId: CHROME_TABS[0].windowId,
    focusedTabId: CHROME_TABS[0].id,
    selectedTabIndex: null
  };

  const newState = reduceTablinerState(state, {
    type: "TAB_FOCUSED",
    tabId: CHROME_TABS[1].id
  });

  expect(newState.focusedTabId).toEqual(CHROME_TABS[1].id);
  expect(newState.selectedTabIndex).toEqual(0);
});

// If Tabliner is already open, we don't want to mess with the user's selection.
// So don't auto-select the Tabliner tab, even if it was the most recently focused.
it("never auto-selects Tabliner's own tab", () => {
  const state: TablinerState = {
    chromeTabs: CHROME_TABS,
    detachedTabs: [],
    ownTabId: CHROME_TABS[1].id,
    focusedWindowId: CHROME_TABS[1].windowId,
    focusedTabId: CHROME_TABS[1].id,
    selectedTabIndex: CHROME_TABS[0].id
  };

  const newState = reduceTablinerState(state, {
    type: "TAB_FOCUSED",
    tabId: CHROME_TABS[1].id
  });

  // Tabliner's own tab is focused, but it's not selected in Tabliner
  expect(newState.focusedTabId).toEqual(CHROME_TABS[1].id);
  expect(newState.selectedTabIndex).toEqual(0);
});
