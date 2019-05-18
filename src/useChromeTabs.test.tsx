import { mount } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

import { useChromeTabs } from "./useChromeTabs";
import { CHROME_TABS } from "./fixtures";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: NodeJS.Global & { chrome?: any };

let onRemovedListeners: Array<(tabId: number) => void>;
beforeEach(() => {
  onRemovedListeners = [];
  global.chrome = {
    tabs: {
      query: (_options: never, cb: (tabs: Array<ChromeTab>) => void) => {
        cb(CHROME_TABS);
      },
      onRemoved: {
        addListener: (cb: (tabId: number) => void) => {
          onRemovedListeners.push(cb);
        },
        removeListener: (cb: (tabId: number) => void) => {
          onRemovedListeners = onRemovedListeners.filter(
            listener => listener !== cb
          );
        }
      },
      remove: jest.fn()
    }
  };
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
    onRemovedListeners[0](CHROME_TABS[0].id);
  });
  wrapper.update();
  expect(wrapper.find(MockChildComponent).props().chromeTabs).toEqual([
    CHROME_TABS[1]
  ]);
});

afterEach(() => {
  delete global.chrome;
});
