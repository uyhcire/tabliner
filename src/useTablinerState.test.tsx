import { mount } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

import { useTablinerState } from "./useTablinerState";
import { CHROME_TABS, makeChromeTabs, makeChromeTab } from "./fixtures";
import { ChromeTab } from "ChromeTab";
import {
  ChromeApiListeners,
  mockChromeApi,
  teardownChromeApiMock
} from "mock-chrome-api/mockChromeApi";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: {
  chromeTabs: Array<ChromeTab> | null;
  focusedWindowId: number | null;
  focusedTabId: number | null;
  handleCloseTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
}): null {
  return null;
}

function MockComponent(): JSX.Element {
  const {
    chromeTabs,
    focusedWindowId,
    focusedTabId,
    handleCloseTab,
    handleCreateTabAfter
  } = useTablinerState();

  return (
    <MockChildComponent
      chromeTabs={chromeTabs}
      focusedWindowId={focusedWindowId}
      focusedTabId={focusedTabId}
      handleCloseTab={handleCloseTab}
      handleCreateTabAfter={handleCreateTabAfter}
    />
  );
}

let listeners: ChromeApiListeners;
beforeEach(() => {
  listeners = mockChromeApi(CHROME_TABS);
});

it("returns null initially", () => {
  chrome.tabs.query = () => {};
  const wrapper = mount(<MockComponent />);
  expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual(null);
});

it("returns fetched tabs", () => {
  const wrapper = mount(<MockComponent />);
  expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual(
    CHROME_TABS
  );
});

describe("performing actions", () => {
  it("removes tabs", () => {
    const wrapper = mount(<MockComponent />);
    wrapper
      .find(MockChildComponent)
      .props()
      .handleCloseTab(CHROME_TABS[0].id);
    expect(chrome.tabs.remove).lastCalledWith(CHROME_TABS[0].id);
  });

  it("creates tabs", () => {
    const wrapper = mount(<MockComponent />);
    wrapper
      .find(MockChildComponent)
      .props()
      .handleCreateTabAfter(CHROME_TABS[0].id);
    expect(chrome.tabs.create).lastCalledWith(
      {
        windowId: CHROME_TABS[0].windowId,
        // New tab is to the right of the first tab
        index: 1
      },
      expect.any(Function)
    );
  });
});

describe("responds to Tab API events", () => {
  it("removes tabs from the list when they are closed", () => {
    const wrapper = mount(<MockComponent />);
    act(() => {
      listeners.tabs.onRemoved[0](CHROME_TABS[0].id, {
        windowId: CHROME_TABS[0].windowId,
        isWindowClosing: false
      });
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      { ...CHROME_TABS[1], index: 0 }
    ]);
  });

  it("reorders tabs in the list when they are moved", () => {
    const wrapper = mount(<MockComponent />);
    act(() => {
      listeners.tabs.onMoved[0](CHROME_TABS[0].id, {
        fromIndex: 0,
        toIndex: 1,
        windowId: CHROME_TABS[0].windowId
      });
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      { ...CHROME_TABS[1], index: 0 },
      { ...CHROME_TABS[0], index: 1 }
    ]);
  });

  it("reorders tabs when a tab is moved across multiple tabs", () => {
    const tabs = makeChromeTabs([
      { title: "1", url: "https://example.com/1" },
      { title: "2", url: "https://example.com/2" },
      { title: "3", url: "https://example.com/3" },
      { title: "4", url: "https://example.com/4" },
      { title: "5", url: "https://example.com/5" },
      { title: "6", url: "https://example.com/6" }
    ]);
    teardownChromeApiMock();
    listeners = mockChromeApi(tabs);
    const wrapper = mount(<MockComponent />);
    act(() => {
      // I dragged the 1st tab to be 6th and recorded the events Chrome fired
      for (const [fromIndex, toIndex] of [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5]
      ]) {
        listeners.tabs.onMoved[0](tabs[0].id, {
          fromIndex,
          toIndex,
          windowId: tabs[0].windowId
        });
      }
    });
    wrapper.update();
    expect(
      wrapper
        .find(MockChildComponent)
        .props()
        .chromeTabs!.map(tab => tab.title)
    ).toEqual(["2", "3", "4", "5", "6", "1"]);
  });

  it("reorders tabs when a group of 2 tabs is dragged 2 tabs to the right", () => {
    const tabs = makeChromeTabs([
      { title: "1", url: "https://example.com/1" },
      { title: "2", url: "https://example.com/2" },
      { title: "3", url: "https://example.com/3" },
      { title: "4", url: "https://example.com/4" }
    ]);
    teardownChromeApiMock();
    listeners = mockChromeApi(tabs);
    const wrapper = mount(<MockComponent />);
    act(() => {
      // I dragged a group of 2 tabs and recorded the events Chrome fired
      for (const [tabId, fromIndex, toIndex] of [
        [tabs[0].id, 0, 2],
        [tabs[1].id, 0, 2],
        [tabs[0].id, 1, 3],
        [tabs[1].id, 1, 3]
      ]) {
        listeners.tabs.onMoved[0](tabId, {
          fromIndex,
          toIndex,
          windowId: tabs[0].windowId
        });
      }
    });
    wrapper.update();
    expect(
      wrapper
        .find(MockChildComponent)
        .props()
        .chromeTabs!.map(tab => tab.title)
    ).toEqual(["3", "4", "1", "2"]);
  });

  it("creates tabs at the beginning of a window", () => {
    const wrapper = mount(<MockComponent />);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 0,
      windowId: CHROME_TABS[0].windowId,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      listeners.tabs.onCreated[0](newTab);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      newTab,
      { ...CHROME_TABS[0], index: 1 },
      { ...CHROME_TABS[1], index: 2 }
    ]);
  });

  it("creates tabs at the end of a window", () => {
    const wrapper = mount(<MockComponent />);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 2,
      windowId: CHROME_TABS[0].windowId,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      listeners.tabs.onCreated[0](newTab);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      ...CHROME_TABS,
      newTab
    ]);
  });

  it("creates a tab in a new window", () => {
    const wrapper = mount(<MockComponent />);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 0,
      windowId: 1234,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      listeners.tabs.onCreated[0](newTab);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      ...CHROME_TABS,
      newTab
    ]);
  });

  it("updates tabs", () => {
    const wrapper = mount(<MockComponent />);

    act(() => {
      listeners.tabs.onUpdated[0](
        CHROME_TABS[0].id,
        {},
        { ...CHROME_TABS[0], title: "new title !" }
      );
    });
    wrapper.update();

    const newChromeTabs = wrapper.find(MockChildComponent).props().chromeTabs;
    expect(newChromeTabs && newChromeTabs[0]).toMatchObject({
      title: "new title !"
    });
  });

  it("changes the active tab", () => {
    const wrapper = mount(<MockComponent />);
    act(() => {
      listeners.tabs.onActivated[0]({
        tabId: CHROME_TABS[1].id,
        windowId: CHROME_TABS[1].windowId
      });
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      { ...CHROME_TABS[0], active: false },
      { ...CHROME_TABS[1], active: true }
    ]);
  });

  it("sets focusedWindowId and focusedTabId", () => {
    const wrapper = mount(<MockComponent />);

    act(() => {
      listeners.windows.onFocusChanged.forEach(listener =>
        listener(CHROME_TABS[1].windowId)
      );
    });
    wrapper.update();

    act(() => {
      listeners.tabs.onActivated.forEach(listener =>
        listener({
          tabId: CHROME_TABS[1].id,
          windowId: CHROME_TABS[1].windowId
        })
      );
    });
    wrapper.update();

    expect(wrapper.find(MockChildComponent).props()).toMatchObject({
      focusedWindowId: CHROME_TABS[1].windowId,
      focusedTabId: CHROME_TABS[1].id
    });
  });

  it("detaches and re-attaches a tab", () => {
    const wrapper = mount(<MockComponent />);

    const windowId = CHROME_TABS[0].windowId;
    act(() => {
      listeners.tabs.onDetached[0](CHROME_TABS[0].id, {
        oldWindowId: windowId,
        oldPosition: 0
      });
    });
    wrapper.update();
    act(() => {
      listeners.tabs.onAttached[0](CHROME_TABS[0].id, {
        newWindowId: windowId,
        newPosition: 1
      });
    });
    wrapper.update();

    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      { ...CHROME_TABS[1], index: 0 },
      { ...CHROME_TABS[0], index: 1 }
    ]);
  });
});

afterEach(() => {
  teardownChromeApiMock();
});
