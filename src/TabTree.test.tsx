import React from "react";
import { TreeNode } from "@blueprintjs/core";

import TabTree, { TabTreeProps } from "TabTree";
import { TWO_TABS, TWO_WINDOWS_TWO_TABS_EACH } from "fixtures";
import { safeMount } from "safeMount";

const DEFAULT_PROPS: TabTreeProps = {
  chromeTabs: TWO_TABS,
  handleCloseTab: () => {},
  handleMoveTab: () => {},
  handleGoToTab: () => {},
  handleCreateTabAfter: () => {},
  handleMergeWindows: () => {},
  selectedNodePath: null,
  setSelectedNodePath: () => {},
  moveSelectedNodeUp: () => {},
  moveSelectedNodeDown: () => {}
};

it("renders", () => {
  const wrapper = safeMount(<TabTree {...DEFAULT_PROPS} />);
  expect(wrapper.text()).toMatch(/Google/);
  expect(wrapper.text()).toMatch(/Yahoo/);
  expect(wrapper.text()).not.toMatch(/some random website/);
});

it("renders the selected tab as selected", () => {
  const wrapper = safeMount(
    <TabTree {...DEFAULT_PROPS} selectedNodePath={[0, 0]} />
  );
  expect(
    wrapper
      .find(".bp3-tree-node-selected")
      .find(".bp3-tree-node-label")
      .text()
  ).toEqual(TWO_TABS[0].title);
});

it("renders the selected window as selected", () => {
  const wrapper = safeMount(
    <TabTree {...DEFAULT_PROPS} selectedNodePath={[0]} />
  );
  expect(
    wrapper
      .find(".bp3-tree-node-selected")
      .find(".bp3-tree-node-label")
      .at(0)
      .text()
  ).toEqual("Window 1");
});

it("removes the selected tab on Backspace", () => {
  const mockHandleCloseTab = jest.fn();
  safeMount(
    <TabTree
      {...DEFAULT_PROPS}
      handleCloseTab={mockHandleCloseTab}
      selectedNodePath={[0, 0]}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
  expect(mockHandleCloseTab).lastCalledWith(TWO_TABS[0].id);
});

describe("selection", () => {
  it("selects a tab when clicked", () => {
    const mockSetSelectedNodePath = jest.fn();
    const wrapper = safeMount(
      <TabTree
        {...DEFAULT_PROPS}
        setSelectedNodePath={mockSetSelectedNodePath}
      />
    );
    wrapper
      // First window
      .find(TreeNode)
      .at(0)
      // Second tab
      .find(".bp3-tree-node-list")
      .find(TreeNode)
      .at(1)
      .find(".bp3-tree-node-label")
      .simulate("click");
    expect(mockSetSelectedNodePath).lastCalledWith([0, 1]);
  });

  it("selects a window when clicked", () => {
    const mockSetSelectedNodePath = jest.fn();
    const wrapper = safeMount(
      <TabTree
        {...DEFAULT_PROPS}
        setSelectedNodePath={mockSetSelectedNodePath}
      />
    );
    wrapper
      .find(TreeNode)
      .at(0)
      .find(".bp3-tree-node-label")
      .at(0)
      .simulate("click");
    expect(mockSetSelectedNodePath).lastCalledWith([0]);
  });

  test.each([["ArrowDown", [0, 0], "down"], ["ArrowUp", [0, 1], "up"]] as Array<
    [string, [number, number] | null, "up" | "down"]
  >)(
    "supports navigating up and down with the arrow keys (key %j, initial node path %j, expected index %j)",
    (
      key: string,
      initialNodePath: [number, number] | null,
      expectedAction: number | "up" | "down"
    ) => {
      const mockSetSelectedNodePath = jest.fn();
      const mockMoveSelectedNodeUp = jest.fn();
      const mockMoveSelectedNodeDown = jest.fn();
      safeMount(
        <TabTree
          {...DEFAULT_PROPS}
          selectedNodePath={initialNodePath}
          setSelectedNodePath={mockSetSelectedNodePath}
          moveSelectedNodeUp={mockMoveSelectedNodeUp}
          moveSelectedNodeDown={mockMoveSelectedNodeDown}
        />
      );
      document.dispatchEvent(new KeyboardEvent("keydown", { key }));
      if (expectedAction === "up") {
        expect(mockMoveSelectedNodeUp).toBeCalled();
      } else if (expectedAction === "down") {
        expect(mockMoveSelectedNodeDown).toBeCalled();
      } else {
        throw new Error(`Unexpected action ${expectedAction}`);
      }
    }
  );
});

describe("reordering tabs", () => {
  test.each([["ArrowUp", 1, 0, "up"], ["ArrowDown", 0, 1, "down"]])(
    "reorders tabs on Meta + arrow key (key %j, initial index %j, expected index %j, expected direction %j)",
    (
      key: string,
      initialIndex: number,
      expectedIndex: number,
      expectedDirection: "up" | "down"
    ) => {
      const mockHandleMoveTab = jest.fn();
      const mockMoveSelectedNodeDown = jest.fn();
      const mockMoveSelectedNodeUp = jest.fn();
      safeMount(
        <TabTree
          {...DEFAULT_PROPS}
          handleMoveTab={mockHandleMoveTab}
          selectedNodePath={[0, initialIndex]}
          moveSelectedNodeDown={mockMoveSelectedNodeDown}
          moveSelectedNodeUp={mockMoveSelectedNodeUp}
        />
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key, metaKey: true })
      );
      expect(mockHandleMoveTab).lastCalledWith(
        TWO_TABS[initialIndex].windowId,
        TWO_TABS[initialIndex].id,
        expectedIndex
      );
      if (expectedDirection === "up") {
        expect(mockMoveSelectedNodeUp).toBeCalled();
      } else if (expectedDirection === "down") {
        expect(mockMoveSelectedNodeDown).toBeCalled();
      }
    }
  );

  it("does not respond to Meta + arrow key when no tab is selected", () => {
    const mockHandleMoveTab = jest.fn();
    const mockSetSelectedNodePath = jest.fn();
    const mockMoveSelectedNodeDown = jest.fn();
    const mockMoveSelectedNodeUp = jest.fn();
    safeMount(
      <TabTree
        {...DEFAULT_PROPS}
        handleMoveTab={mockHandleMoveTab}
        setSelectedNodePath={mockSetSelectedNodePath}
        moveSelectedNodeUp={mockMoveSelectedNodeUp}
        moveSelectedNodeDown={mockMoveSelectedNodeDown}
      />
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", metaKey: true })
    );
    expect(mockHandleMoveTab).not.toBeCalled();
    expect(mockSetSelectedNodePath).not.toBeCalled();
    expect(mockMoveSelectedNodeUp).not.toBeCalled();
    expect(mockMoveSelectedNodeDown).not.toBeCalled();
  });
});

it("clears selection when Escape is pressed", () => {
  const mockSetSelectedNodePath = jest.fn();
  safeMount(
    <TabTree
      {...DEFAULT_PROPS}
      selectedNodePath={[0, 0]}
      setSelectedNodePath={mockSetSelectedNodePath}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(mockSetSelectedNodePath).lastCalledWith(null);
});

it("goes to the selected tab when Enter is pressed", () => {
  const mockHandleGoToTab = jest.fn();
  safeMount(
    <TabTree
      {...DEFAULT_PROPS}
      handleGoToTab={mockHandleGoToTab}
      selectedNodePath={[0, 0]}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(mockHandleGoToTab).lastCalledWith(TWO_TABS[0].id);
});

it("creates a new tab after the selected tab when Space is pressed", () => {
  const mockHandleCreateTabAfter = jest.fn();
  safeMount(
    <TabTree
      {...DEFAULT_PROPS}
      handleCreateTabAfter={mockHandleCreateTabAfter}
      selectedNodePath={[0, 0]}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  expect(mockHandleCreateTabAfter).lastCalledWith(TWO_TABS[0].id);
});

it("merges the selected window with the previous window when Backspace is pressed", () => {
  const mockHandleMergeWindows = jest.fn();
  safeMount(
    <TabTree
      {...DEFAULT_PROPS}
      chromeTabs={TWO_WINDOWS_TWO_TABS_EACH}
      handleMergeWindows={mockHandleMergeWindows}
      selectedNodePath={[1]}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
  expect(mockHandleMergeWindows).lastCalledWith({
    sourceWindowId: TWO_WINDOWS_TWO_TABS_EACH[2].windowId,
    destinationWindowId: TWO_WINDOWS_TWO_TABS_EACH[0].windowId
  });
});
