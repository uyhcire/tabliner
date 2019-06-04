import React, { useState } from "react";
import { act } from "react-dom/test-utils";

import { useFocusedWindowListener } from "./useFocusedWindowListener";
import {
  ChromeApiListeners,
  mockChromeApi,
  teardownChromeApiMock
} from "../mock-chrome-api/mockChromeApi";
import { CHROME_TABS, CHROME_WINDOWS } from "../fixtures";
import { safeMount } from "../safeMount";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: { focusedWindowId: number | null }): null {
  return null;
}

function MockComponent(): JSX.Element {
  const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null);

  useFocusedWindowListener(focusedWindowId, setFocusedWindowId);

  return <MockChildComponent focusedWindowId={focusedWindowId} />;
}

let listeners: ChromeApiListeners;
beforeEach(() => {
  listeners = mockChromeApi(CHROME_TABS);
});

it("responds to focus change", () => {
  const wrapper = safeMount(<MockComponent />);
  // Initially focused window
  expect(wrapper.find(MockChildComponent).props().focusedWindowId).toEqual(
    CHROME_WINDOWS[0].id
  );

  act(() => {
    listeners.windows.onFocusChanged[0](CHROME_WINDOWS[1].id);
  });
  wrapper.update();
  expect(wrapper.find(MockChildComponent).props().focusedWindowId).toEqual(
    CHROME_WINDOWS[1].id
  );
});

afterEach(() => {
  teardownChromeApiMock();
});
