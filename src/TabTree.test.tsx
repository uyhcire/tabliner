import { mount } from "enzyme";
import React from "react";

import TabTree from "./TabTree";
import { ChromeTab } from "ChromeTab";
import { TreeNode } from "@blueprintjs/core";

const CHROME_TABS: Array<ChromeTab> = [
  {
    id: 1,
    index: 0,
    windowId: 1,
    selected: true,
    highlighted: true,
    active: true,
    pinned: false,
    discarded: false,
    autoDiscardable: false,
    url: "https://google.com",
    title: "Google",
    favIconUrl: "https://example.com/favicon.ico",
    status: "complete",
    incognito: false
  },
  {
    id: 2,
    index: 1,
    windowId: 1,
    selected: false,
    highlighted: false,
    active: false,
    pinned: false,
    discarded: false,
    autoDiscardable: false,
    url: "https://yahoo.com",
    title: "Yahoo",
    favIconUrl: "https://example.com/favicon.ico",
    status: "complete",
    incognito: false
  }
];

it("renders", () => {
  const wrapper = mount(
    <TabTree
      chromeTabs={CHROME_TABS}
      handleCloseTab={() => {}}
      selectedTabIndex={null}
      setSelectedTabIndex={() => {}}
    />
  );
  expect(wrapper.text()).toMatch(/Google/);
  expect(wrapper.text()).toMatch(/Yahoo/);
  expect(wrapper.text()).not.toMatch(/some random website/);
});

describe("selection", () => {
  it("selects a tab when clicked", () => {
    const mockSetSelectedTabIndex = jest.fn();
    const wrapper = mount(
      <TabTree
        chromeTabs={CHROME_TABS}
        handleCloseTab={() => {}}
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
          selectedTabIndex={initialIndex}
          setSelectedTabIndex={mockSetSelectedTabIndex}
        />
      );
      document.dispatchEvent(new KeyboardEvent("keydown", { key }));
      expect(mockSetSelectedTabIndex).lastCalledWith(expectedIndex);
    }
  );
});
