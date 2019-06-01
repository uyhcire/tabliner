import {
  TablinerState,
  reduceTablinerState,
  reduceForTabInserted,
  GroupedTabs,
  groupTabsByWindow,
  reduceSelectedNodePath,
  TablinerAction
} from "./reduceTablinerState";
import {
  CHROME_TABS,
  makeChromeTab,
  TWO_WINDOWS_TWO_TABS_EACH
} from "./fixtures";

describe("reduceForTabInserted", () => {
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

      const newTabs = reduceForTabInserted(TWO_WINDOWS_TWO_TABS_EACH, newTab);

      expect(newTabs.findIndex(tab => tab.id === 1234)).toEqual(finalPosition);
    }
  );
});

describe("reduceSelectedNodePath", () => {
  let groupedTabs: GroupedTabs;
  beforeEach(() => {
    groupedTabs = groupTabsByWindow(TWO_WINDOWS_TWO_TABS_EACH);
  });

  it("sets the selected node path", () => {
    const selectedNodePath: [number, number] = [0, 0];
    const newSelectedNodePath = reduceSelectedNodePath(
      groupedTabs,
      selectedNodePath,
      {
        type: "SET_SELECTED_NODE_PATH",
        selectedNodePath: [0, 1]
      }
    );
    expect(newSelectedNodePath).toEqual([0, 1]);
  });

  type MoveNodePathTestArgs = [
    "up" | "down",
    [number, number] | null,
    [number, number] | null
  ];

  test.each([
    ["up", null, null],
    ["up", [0, 0], [0, 0]],
    ["up", [0, 1], [0, 0]],
    ["up", [1, 0], [0, 1]],
    ["down", null, null],
    ["down", [1, 1], [1, 1]],
    ["down", [1, 0], [1, 1]],
    ["down", [0, 1], [1, 0]]
  ] as Array<MoveNodePathTestArgs>)(
    "moves the node path up or down (direction %j, starting at %j, expected to end at %j)",
    (...args: MoveNodePathTestArgs) => {
      const [direction, selectedNodePath, expectedNodePath] = args;
      const newSelectedNodePath = reduceSelectedNodePath(
        groupedTabs,
        selectedNodePath,
        direction === "up"
          ? { type: "MOVE_SELECTED_NODE_UP" }
          : { type: "MOVE_SELECTED_NODE_DOWN" }
      );
      expect(newSelectedNodePath).toEqual(expectedNodePath);
    }
  );
});

it("handles moving tabs when there are multiple windows", () => {
  const state: TablinerState = {
    chromeTabs: TWO_WINDOWS_TWO_TABS_EACH,
    detachedTabs: [],
    ownTabId: null,
    focusedWindowId: null,
    focusedTabId: null,
    selectedNodePath: null
  };
  const newState = reduceTablinerState(state, {
    type: "TAB_MOVED_EVENT",
    tabId: TWO_WINDOWS_TWO_TABS_EACH[3].id,
    moveInfo: { windowId: 2, fromIndex: 1, toIndex: 0 }
  });

  expect(newState.chromeTabs).toEqual([
    TWO_WINDOWS_TWO_TABS_EACH[0],
    TWO_WINDOWS_TWO_TABS_EACH[1],
    { ...TWO_WINDOWS_TWO_TABS_EACH[3], index: 0 },
    { ...TWO_WINDOWS_TWO_TABS_EACH[2], index: 1 }
  ]);
});

it("sets the selected node path", () => {
  const state: TablinerState = {
    chromeTabs: CHROME_TABS,
    detachedTabs: [],
    ownTabId: null,
    focusedWindowId: null,
    focusedTabId: null,
    selectedNodePath: null
  };

  const newState = reduceTablinerState(state, {
    type: "SET_SELECTED_NODE_PATH",
    selectedNodePath: [0, 1]
  });

  expect(newState.selectedNodePath).toEqual([0, 1]);
});

it("auto-selects the previously focused tab if Tabliner's own tab is focused", () => {
  const state: TablinerState = {
    chromeTabs: CHROME_TABS,
    detachedTabs: [],
    ownTabId: CHROME_TABS[1].id,
    focusedWindowId: CHROME_TABS[0].windowId,
    focusedTabId: CHROME_TABS[0].id,
    selectedNodePath: null
  };

  const newState = reduceTablinerState(state, {
    type: "TAB_FOCUSED",
    tabId: CHROME_TABS[1].id
  });

  expect(newState.focusedTabId).toEqual(CHROME_TABS[1].id);
  expect(newState.selectedNodePath).toEqual([0, 0]);
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
    selectedNodePath: [0, CHROME_TABS[0].index]
  };

  const newState = reduceTablinerState(state, {
    type: "TAB_FOCUSED",
    tabId: CHROME_TABS[1].id
  });

  // Tabliner's own tab is focused, but it's not selected in Tabliner
  expect(newState.focusedTabId).toEqual(CHROME_TABS[1].id);
  expect(newState.selectedNodePath).toEqual([0, 0]);
});
