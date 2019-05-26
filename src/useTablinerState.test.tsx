import { mount } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

import { useTablinerState } from "./useTablinerState";
import { CHROME_TABS, makeChromeTabs, makeChromeTab } from "./fixtures";
import { ChromeTab } from "ChromeTab";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
}): null {
  return null;
}

function MockComponent(): JSX.Element {
  const {
    chromeTabs,
    handleCloseTab,
    handleCreateTabAfter
  } = useTablinerState();

  return (
    <MockChildComponent
      chromeTabs={chromeTabs}
      handleCloseTab={handleCloseTab}
      handleCreateTabAfter={handleCreateTabAfter}
    />
  );
}

type TabMovedListener = Parameters<chrome.tabs.TabMovedEvent["addListener"]>[0];
type TabRemovedListener = Parameters<
  chrome.tabs.TabRemovedEvent["addListener"]
>[0];
type TabCreatedListener = Parameters<
  chrome.tabs.TabCreatedEvent["addListener"]
>[0];
type TabActivatedListener = Parameters<
  chrome.tabs.TabActivatedEvent["addListener"]
>[0];
type WindowFocusChangedListener = Parameters<
  chrome.windows.WindowIdEvent["addListener"]
>[0];

interface MockEvent<ListenerType> {
  addListener: (cb: ListenerType) => void;
  removeListener: (cb: ListenerType) => void;
}

interface MockChromeApi {
  runtime: {
    sendMessage: typeof chrome.runtime.sendMessage;
  };
  tabs: {
    query: typeof chrome.tabs.query;
    remove: typeof chrome.tabs.remove;
    create: typeof chrome.tabs.create;
    onMoved: MockEvent<TabMovedListener>;
    onRemoved: MockEvent<TabRemovedListener>;
    onCreated: MockEvent<TabCreatedListener>;
    onActivated: MockEvent<TabActivatedListener>;
  };
  windows: {
    getAll: typeof chrome.windows.getAll;
    onFocusChanged: MockEvent<WindowFocusChangedListener>;
  };
}

declare let global: NodeJS.Global & {
  chrome?: MockChromeApi;
};

let onMovedListeners: Array<TabMovedListener>;
let onRemovedListeners: Array<TabRemovedListener>;
let onCreatedListeners: Array<TabCreatedListener>;
let onActivatedListeners: Array<TabActivatedListener>;
function getMockChromeTabsApi(tabs: Array<ChromeTab>): MockChromeApi {
  return {
    runtime: { sendMessage: jest.fn() },
    tabs: {
      query: (_options: never, cb: (tabs: Array<ChromeTab>) => void) => {
        cb(tabs);
      },
      remove: jest.fn(),
      create: jest.fn(),
      onMoved: {
        addListener: (cb: TabMovedListener) => {
          onMovedListeners.push(cb);
        },
        removeListener: (cb: TabMovedListener) => {
          onMovedListeners = onMovedListeners.filter(
            listener => listener !== cb
          );
        }
      },
      onRemoved: {
        addListener: (cb: TabRemovedListener) => {
          onRemovedListeners.push(cb);
        },
        removeListener: (cb: TabRemovedListener) => {
          onRemovedListeners = onRemovedListeners.filter(
            listener => listener !== cb
          );
        }
      },
      onCreated: {
        addListener: (cb: TabCreatedListener) => {
          onCreatedListeners.push(cb);
        },
        removeListener: (cb: TabCreatedListener) => {
          onCreatedListeners = onCreatedListeners.filter(
            listener => listener !== cb
          );
        }
      },
      onActivated: {
        addListener: (cb: TabActivatedListener) => {
          onActivatedListeners.push(cb);
        },
        removeListener: (cb: TabActivatedListener) => {
          onActivatedListeners = onActivatedListeners.filter(
            listener => listener !== cb
          );
        }
      }
    },
    windows: {
      getAll: jest.fn(),
      onFocusChanged: {
        addListener: () => {},
        removeListener: () => {}
      }
    }
  };
}

beforeEach(() => {
  onMovedListeners = [];
  onRemovedListeners = [];
  onCreatedListeners = [];
  onActivatedListeners = [];
  global.chrome = getMockChromeTabsApi(CHROME_TABS);
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
    expect(onRemovedListeners).toHaveLength(1);
    act(() => {
      onRemovedListeners[0](CHROME_TABS[0].id, {
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
    expect(onMovedListeners).toHaveLength(1);
    act(() => {
      onMovedListeners[0](CHROME_TABS[0].id, {
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
    global.chrome = getMockChromeTabsApi(tabs);
    const wrapper = mount(<MockComponent />);
    expect(onMovedListeners).toHaveLength(1);
    act(() => {
      // I dragged the 1st tab to be 6th and recorded the events Chrome fired
      for (const [fromIndex, toIndex] of [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5]
      ]) {
        onMovedListeners[0](tabs[0].id, {
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
    global.chrome = getMockChromeTabsApi(tabs);
    const wrapper = mount(<MockComponent />);
    expect(onMovedListeners).toHaveLength(1);
    act(() => {
      // I dragged a group of 2 tabs and recorded the events Chrome fired
      for (const [tabId, fromIndex, toIndex] of [
        [tabs[0].id, 0, 2],
        [tabs[1].id, 0, 2],
        [tabs[0].id, 1, 3],
        [tabs[1].id, 1, 3]
      ]) {
        onMovedListeners[0](tabId, {
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
    expect(onCreatedListeners).toHaveLength(1);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 0,
      windowId: CHROME_TABS[0].windowId,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      onCreatedListeners[0](newTab);
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
    expect(onCreatedListeners).toHaveLength(1);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 2,
      windowId: CHROME_TABS[0].windowId,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      onCreatedListeners[0](newTab);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      ...CHROME_TABS,
      newTab
    ]);
  });

  it("creates a tab in a new window", () => {
    const wrapper = mount(<MockComponent />);
    expect(onCreatedListeners).toHaveLength(1);
    const newTab: ChromeTab = makeChromeTab({
      id: 1234,
      index: 0,
      windowId: 1234,
      url: "https://example.com",
      title: "Example"
    });
    act(() => {
      onCreatedListeners[0](newTab);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
      ...CHROME_TABS,
      newTab
    ]);
  });

  it("changes the active tab", () => {
    const wrapper = mount(<MockComponent />);
    expect(onActivatedListeners.length).toBeLessThanOrEqual(2);
    act(() => {
      onActivatedListeners[0]({
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
});

afterEach(() => {
  delete global.chrome;
});
