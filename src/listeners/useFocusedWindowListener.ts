import { useEffect } from "react";

export function useFocusedWindowListener(
  focusedWindowId: number | null,
  setFocusedWindow: (windowId: number | null) => void
): void {
  useEffect(() => {
    // Avoid infinite loop of calling chrome.windows.getAll(...)
    if (focusedWindowId != null) {
      return;
    }

    chrome.windows.getAll(windows => {
      const focusedWindows = windows.filter(window => window.focused);
      if (focusedWindows.length > 1) {
        throw new Error("Expected at most 1 window to be focused!");
      } else if (focusedWindows.length === 0) {
        setFocusedWindow(null);
      } else {
        setFocusedWindow(focusedWindows[0].id);
      }
    });
  }, [focusedWindowId, setFocusedWindow]);

  useEffect(() => {
    function handleFocusChanged(windowId: number): void {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        setFocusedWindow(null);
      } else {
        setFocusedWindow(windowId);
      }
    }

    chrome.windows.onFocusChanged.addListener(handleFocusChanged);
    return () =>
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged);
  }, [setFocusedWindow]);
}
