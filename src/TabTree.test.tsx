import { mount } from "enzyme";
import React from "react";

import TabTree from "./TabTree";
import { TreeNode } from "@blueprintjs/core";
import { CHROME_TABS } from "./fixtures";

it("renders", () => {
  const wrapper = mount(
    <TabTree
      chromeTabs={CHROME_TABS}
      handleCloseTab={() => {}}
      handleMoveTab={() => {}}
      selectedTabIndex={null}
      setSelectedTabIndex={() => {}}
    />
  );
  expect(wrapper.text()).toMatch(/Google/);
  expect(wrapper.text()).toMatch(/Yahoo/);
  expect(wrapper.text()).not.toMatch(/some random website/);
});

it("removes the selected tab on Backspace", () => {
  const mockHandleCloseTab = jest.fn();
  mount(
    <TabTree
      chromeTabs={CHROME_TABS}
      handleCloseTab={mockHandleCloseTab}
      handleMoveTab={() => {}}
      selectedTabIndex={0}
      setSelectedTabIndex={() => {}}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
  expect(mockHandleCloseTab).lastCalledWith(CHROME_TABS[0].id);
});

describe("selection", () => {
  it("selects a tab when clicked", () => {
    const mockSetSelectedTabIndex = jest.fn();
    const wrapper = mount(
      <TabTree
        chromeTabs={CHROME_TABS}
        handleCloseTab={() => {}}
        handleMoveTab={() => {}}
        selectedTabIndex={null}
        setSelectedTabIndex={mockSetSelectedTabIndex}
      />
    );
    wrapper
      .find(TreeNode)
      .at(1)
      .find(".bp3-tree-node-label")
      .simulate("click");
    expect(mockSetSelectedTabIndex).lastCalledWith(1);
  });

  test.each([
    ["ArrowDown", 0, 1],
    ["ArrowUp", 1, 0],
    // If no tab is initially selected, we should select the first or last tab
    ["ArrowDown", null, 0],
    ["ArrowUp", null, 1]
  ])(
    "supports navigating up and down with the arrow keys (key %j, initial index %j, expected index %j)",
    (key: string, initialIndex: number, expectedIndex: number) => {
      let mockSetSelectedTabIndex = jest.fn();
      mount(
        <TabTree
          chromeTabs={CHROME_TABS}
          handleCloseTab={() => {}}
          handleMoveTab={() => {}}
          selectedTabIndex={initialIndex}
          setSelectedTabIndex={mockSetSelectedTabIndex}
        />
      );
      document.dispatchEvent(new KeyboardEvent("keydown", { key }));
      expect(mockSetSelectedTabIndex).lastCalledWith(expectedIndex);
    }
  );
});

describe("reordering tabs", () => {
  test.each([["ArrowUp", 1, 0], ["ArrowDown", 0, 1]])(
    "reorders tabs on Meta + arrow key (key %j, initial index %j, expected index %j)",
    (key: string, initialIndex: number, expectedIndex: number) => {
      let mockHandleMoveTab = jest.fn();
      let mockSetSelectedTabIndex = jest.fn();
      mount(
        <TabTree
          chromeTabs={CHROME_TABS}
          handleCloseTab={() => {}}
          handleMoveTab={mockHandleMoveTab}
          selectedTabIndex={initialIndex}
          setSelectedTabIndex={mockSetSelectedTabIndex}
        />
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key, metaKey: true })
      );
      expect(mockHandleMoveTab).lastCalledWith(
        CHROME_TABS[initialIndex].id,
        expectedIndex
      );
      expect(mockSetSelectedTabIndex).lastCalledWith(expectedIndex);
    }
  );

  it("does not respond to Meta + arrow key when no tab is selected", () => {
    let mockHandleMoveTab = jest.fn();
    let mockSetSelectedTabIndex = jest.fn();
    mount(
      <TabTree
        chromeTabs={CHROME_TABS}
        handleCloseTab={() => {}}
        handleMoveTab={mockHandleMoveTab}
        selectedTabIndex={null}
        setSelectedTabIndex={mockSetSelectedTabIndex}
      />
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", metaKey: true })
    );
    expect(mockHandleMoveTab).not.toBeCalled();
    expect(mockSetSelectedTabIndex).not.toBeCalled();
  });
});
