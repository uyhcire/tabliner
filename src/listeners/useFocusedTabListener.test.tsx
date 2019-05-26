import React, { useState } from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";

import { useFocusedTabListener } from "./useFocusedTabListener";
import { CHROME_TABS } from "../fixtures";
import {
  ChromeApiListeners,
  teardownChromeApiMock,
  mockChromeApi
} from "../mock-chrome-api/mockChromeApi";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: { focusedTabId: number | null }): null {
  return null;
}

function MockComponent({
  focusedWindowId
}: {
  focusedWindowId: number;
}): JSX.Element {
  const [focusedTabId, setFocusedTabId] = useState<number | null>(null);

  useFocusedTabListener(CHROME_TABS, focusedWindowId, setFocusedTabId);

  return <MockChildComponent focusedTabId={focusedTabId} />;
}

let listeners: ChromeApiListeners;
beforeEach(() => {
  listeners = mockChromeApi(CHROME_TABS);
});

it("responds when a tab is activated in the focused window", () => {
  const wrapper = mount(
    <MockComponent focusedWindowId={CHROME_TABS[1].windowId} />
  );
  act(() => {
    listeners.tabs.onActivated[0]({
      tabId: CHROME_TABS[1].id,
      windowId: CHROME_TABS[1].windowId
    });
  });
  wrapper.update();
  expect(wrapper.find(MockChildComponent).props().focusedTabId).toEqual(
    CHROME_TABS[1].id
  );
});

it("when another window is focused, reports the active tab in that window", () => {
  const wrapper = mount(<MockComponent focusedWindowId={1234} />);
  expect(CHROME_TABS[0].active).toBeTruthy();
  act(() => {
    listeners.windows.onFocusChanged[0](CHROME_TABS[0].windowId);
  });
  wrapper.update();
  expect(wrapper.find(MockChildComponent).props().focusedTabId).toEqual(
    CHROME_TABS[0].id
  );
});

afterEach(() => {
  teardownChromeApiMock();
});
