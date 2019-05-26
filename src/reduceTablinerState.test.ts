import { TablinerState, reduceTablinerState } from "./reduceTablinerState";
import { CHROME_TABS } from "./fixtures";

test.each([[-1, 0], [0, 0], [1, 1], [2, 1]])(
  "sets the tab index but stays within bounds (selecting index %j, expecting index %j)",
  (indexToSelect, expectedIndex) => {
    const state: TablinerState = {
      chromeTabs: CHROME_TABS,
      selectedTabIndex: null
    };

    const newState = reduceTablinerState(state, {
      type: "SET_SELECTED_INDEX",
      index: indexToSelect
    });

    expect(newState.selectedTabIndex).toEqual(expectedIndex);
  }
);
