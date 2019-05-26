import { mount } from "enzyme";
import React, { useState } from "react";
import { act } from "react-dom/test-utils";

import { MockEvent } from "./MockEvent";
import { useFocusedWindowListener } from "./useFocusedWindowListener";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: { focusedWindowId: number | null }): null {
  return null;
}

function MockComponent(): JSX.Element {
  const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null);

  function setFocusedWindow(windowId: number | null): void {
    setFocusedWindowId(windowId);
  }
  useFocusedWindowListener(focusedWindowId, setFocusedWindow);

  return <MockChildComponent focusedWindowId={focusedWindowId} />;
}

type WindowFocusChangedListener = Parameters<
  chrome.windows.WindowIdEvent["addListener"]
>[0];

interface MockChromeApi {
  windows: {
    getAll: (callback: (windows: Array<chrome.windows.Window>) => void) => void;
    onFocusChanged: MockEvent<WindowFocusChangedListener>;
  };
}

declare let global: NodeJS.Global & {
  chrome?: MockChromeApi;
};

const CHROME_WINDOWS: Array<chrome.windows.Window> = [
  {
    id: 1,
    focused: true,
    type: "normal",
    state: "normal",
    incognito: false,
    alwaysOnTop: false
  },
  {
    id: 2,
    focused: false,
    type: "normal",
    state: "normal",
    incognito: false,
    alwaysOnTop: false
  }
];

let onFocusChangedListeners: Array<WindowFocusChangedListener>;
beforeEach(() => {
  onFocusChangedListeners = [];
  global.chrome = {
    windows: {
      getAll(callback: (windows: Array<chrome.windows.Window>) => void): void {
        callback(CHROME_WINDOWS);
      },
      onFocusChanged: {
        addListener: (cb: WindowFocusChangedListener) => {
          onFocusChangedListeners.push(cb);
        },
        removeListener: (cb: WindowFocusChangedListener) => {
          onFocusChangedListeners = onFocusChangedListeners.filter(
            listener => listener !== cb
          );
        }
      }
    }
  };
});

it("responds to focus change", () => {
  const wrapper = mount(<MockComponent />);
  // Initially focused window
  expect(wrapper.find(MockChildComponent).props().focusedWindowId).toEqual(
    CHROME_WINDOWS[0].id
  );

  expect(onFocusChangedListeners).toHaveLength(1);
  act(() => {
    onFocusChangedListeners[0](CHROME_WINDOWS[1].id);
  });
  wrapper.update();
  expect(wrapper.find(MockChildComponent).props().focusedWindowId).toEqual(
    CHROME_WINDOWS[1].id
  );
});

afterEach(() => {
  delete global.chrome;
});
