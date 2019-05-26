import { TablinerState, reduceTablinerState } from "./reduceTablinerState";
import { CHROME_TABS } from "./fixtures";

test.each([[-1, 0], [0, 0], [1, 1], [2, 1]])(
  "sets the tab index but stays within bounds (selecting index %j, expecting index %j)",
  (indexToSelect, expectedIndex) => {
    const state: TablinerState = {
      chromeTabs: CHROME_TABS,
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

it("selects the previously focused tab if Tabliner's own tab is focused", () => {
  const state: TablinerState = {
    chromeTabs: CHROME_TABS,
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
