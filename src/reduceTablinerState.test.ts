import {
  TablinerState,
  reduceTablinerState,
  reduceForTabInserted
} from "./reduceTablinerState";
import { CHROME_TABS, makeChromeTabs, makeChromeTab } from "./fixtures";
import { ChromeTab } from "./ChromeTab";

describe("reduceForTabInserted", () => {
  let oldTabs: Array<ChromeTab>;
  beforeEach(() => {
    // 2 windows with 2 tabs each
    oldTabs = makeChromeTabs([
      { title: "0", url: "https://example.com" },
      { title: "1", url: "https://example.com" },
      { title: "2", url: "https://example.com" },
      { title: "3", url: "https://example.com" }
    ]);
    oldTabs = [
      { ...oldTabs[0], windowId: 1, index: 0 },
      { ...oldTabs[1], windowId: 1, index: 1 },
      { ...oldTabs[2], windowId: 2, index: 0 },
      { ...oldTabs[3], windowId: 2, index: 1 }
    ];
  });

  test.each([
    { windowId: 1, index: 0, finalPosition: 0 },
    { windowId: 1, index: 1, finalPosition: 1 },
    { windowId: 1, index: 2, finalPosition: 2 },
    { windowId: 2, index: 0, finalPosition: 2 },
    { windowId: 2, index: 1, finalPosition: 3 },
    { windowId: 2, index: 2, finalPosition: 4 },
    { windowId: 3, index: 0, finalPosition: 4 }
  ])(
    "inserts a new tab (%j)",
    ({
      windowId,
      index,
      finalPosition
    }: {
      windowId: number;
      index: number;
      finalPosition: number;
    }) => {
      const newTab = makeChromeTab({
        id: 1234,
        windowId,
        index,
        title: "new",
        url: "https://example.com"
      });

      const newTabs = reduceForTabInserted(oldTabs, newTab);

      expect(newTabs.findIndex(tab => tab.id === 1234)).toEqual(finalPosition);
    }
  );
});

it("handles moving tabs when there are multiple windows", () => {
  // 2 windows with 2 tabs each
  let oldTabs = makeChromeTabs([
    { title: "0", url: "https://example.com" },
    { title: "1", url: "https://example.com" },
    { title: "2", url: "https://example.com" },
    { title: "3", url: "https://example.com" }
  ]);
  oldTabs = [
    { ...oldTabs[0], windowId: 1, index: 0 },
    { ...oldTabs[1], windowId: 1, index: 1 },
    { ...oldTabs[2], windowId: 2, index: 0 },
    { ...oldTabs[3], windowId: 2, index: 1 }
  ];

  const state: TablinerState = {
    chromeTabs: oldTabs,
    detachedTabs: [],
    ownTabId: null,
    focusedWindowId: null,
    focusedTabId: null,
    selectedTabIndex: null
  };
  const newState = reduceTablinerState(state, {
    type: "TAB_MOVED_EVENT",
    tabId: oldTabs[3].id,
    moveInfo: { windowId: 2, fromIndex: 1, toIndex: 0 }
  });

  expect(newState.chromeTabs).toEqual([
    oldTabs[0],
    oldTabs[1],
    { ...oldTabs[3], index: 0 },
    { ...oldTabs[2], index: 1 }
  ]);
});

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
