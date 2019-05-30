import { mount } from "enzyme";
import React from "react";

import TabTree, { TabTreeProps } from "./TabTree";
import { TreeNode } from "@blueprintjs/core";
import { CHROME_TABS } from "./fixtures";
import { findAllInRenderedTree } from "react-dom/test-utils";

const DEFAULT_PROPS: TabTreeProps = {
  chromeTabs: CHROME_TABS,
  handleCloseTab: () => {},
  handleMoveTab: () => {},
  handleGoToTab: () => {},
  handleCreateTabAfter: () => {},
  selectedTabIndex: null,
  setSelectedTabIndex: () => {}
};

it("renders", () => {
  const wrapper = mount(<TabTree {...DEFAULT_PROPS} />);
  expect(wrapper.text()).toMatch(/Google/);
  expect(wrapper.text()).toMatch(/Yahoo/);
  expect(wrapper.text()).not.toMatch(/some random website/);
});

it("removes the selected tab on Backspace", () => {
  const mockHandleCloseTab = jest.fn();
  mount(
    <TabTree
      {...DEFAULT_PROPS}
      handleCloseTab={mockHandleCloseTab}
      selectedTabIndex={0}
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
        {...DEFAULT_PROPS}
        setSelectedTabIndex={mockSetSelectedTabIndex}
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
      const mockSetSelectedTabIndex = jest.fn();
      mount(
        <TabTree
          {...DEFAULT_PROPS}
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
      const mockHandleMoveTab = jest.fn();
      const mockSetSelectedTabIndex = jest.fn();
      mount(
        <TabTree
          {...DEFAULT_PROPS}
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
    const mockHandleMoveTab = jest.fn();
    const mockSetSelectedTabIndex = jest.fn();
    mount(
      <TabTree
        {...DEFAULT_PROPS}
        handleMoveTab={mockHandleMoveTab}
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

it("clears selection when Escape is pressed", () => {
  const mockSetSelectedTabIndex = jest.fn();
  mount(
    <TabTree
      {...DEFAULT_PROPS}
      selectedTabIndex={0}
      setSelectedTabIndex={mockSetSelectedTabIndex}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(mockSetSelectedTabIndex).lastCalledWith(null);
});

it("goes to the selected tab when Enter is pressed", () => {
  const mockHandleGoToTab = jest.fn();
  mount(
    <TabTree
      {...DEFAULT_PROPS}
      handleGoToTab={mockHandleGoToTab}
      selectedTabIndex={0}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(mockHandleGoToTab).lastCalledWith(CHROME_TABS[0].id);
});

it("creates a new tab after the selected tab when Space is pressed", () => {
  const mockHandleCreateTabAfter = jest.fn();
  mount(
    <TabTree
      {...DEFAULT_PROPS}
      handleCreateTabAfter={mockHandleCreateTabAfter}
      selectedTabIndex={0}
    />
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  expect(mockHandleCreateTabAfter).lastCalledWith(CHROME_TABS[0].id);
});
