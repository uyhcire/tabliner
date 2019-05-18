import { mount } from "enzyme";
import React from "react";

import TabTree from "./TabTree";
import { ChromeTab } from "ChromeTab";

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
