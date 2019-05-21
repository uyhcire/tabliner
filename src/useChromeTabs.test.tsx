import { mount } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

import { useChromeTabs } from "./useChromeTabs";
import { CHROME_TABS, makeChromeTabs } from "./fixtures";
import { ChromeTab } from "ChromeTab";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
}): null {
  return null;
}

function MockComponent(): JSX.Element {
  const { chromeTabs, handleCloseTab } = useChromeTabs();

  return (
    <MockChildComponent
      chromeTabs={chromeTabs}
      handleCloseTab={handleCloseTab}
    />
  );
}

type TabMovedListener = Parameters<chrome.tabs.TabMovedEvent["addListener"]>[0];
type TabRemovedListener = Parameters<
  chrome.tabs.TabRemovedEvent["addListener"]
>[0];

interface MockEvent<ListenerType> {
  addListener: (cb: ListenerType) => void;
  removeListener: (cb: ListenerType) => void;
}

interface MockChromeApi {
  tabs: {
    query: typeof chrome.tabs.query;
    remove: typeof chrome.tabs.remove;
    onMoved: MockEvent<TabMovedListener>;
    onRemoved: MockEvent<TabRemovedListener>;
  };
}

declare let global: NodeJS.Global & {
  chrome?: MockChromeApi;
};

let onMovedListeners: Array<TabMovedListener>;
let onRemovedListeners: Array<TabRemovedListener>;
function getMockChromeTabsApi(tabs: Array<ChromeTab>): MockChromeApi {
  return {
    tabs: {
      query: (_options: never, cb: (tabs: Array<ChromeTab>) => void) => {
        cb(tabs);
      },
      remove: jest.fn(),
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
      }
    }
  };
}

beforeEach(() => {
  onMovedListeners = [];
  onRemovedListeners = [];
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

it("removes tabs", () => {
  const wrapper = mount(<MockComponent />);
  wrapper
    .find(MockChildComponent)
    .props()
    .handleCloseTab(CHROME_TABS[0].id);
  expect(chrome.tabs.remove).lastCalledWith(CHROME_TABS[0].id);
});

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
    CHROME_TABS[1]
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
  // I dragged the 1st tab to be 6th and recorded the events Chrome fired
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
  expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
    { ...tabs[1], index: 0 },
    { ...tabs[2], index: 1 },
    { ...tabs[3], index: 2 },
    { ...tabs[4], index: 3 },
    { ...tabs[5], index: 4 },
    { ...tabs[0], index: 5 }
  ]);
});

afterEach(() => {
  delete global.chrome;
});
