import { useEffect, useState } from "react";
import { ChromeTab } from "./ChromeTab";

export function useChromeTabs(): {
  chromeTabs: Array<ChromeTab> | null;
  handleCloseTab(tabId: number): void;
} {
  const [chromeTabs, setChromeTabs] = useState<Array<ChromeTab> | null>(null);

  // Load tabs
  useEffect((): void => {
    chrome.tabs.query(
      {},
      (tabs: Array<ChromeTab>): void => setChromeTabs(tabs)
    );
  }, []);

  useEffect(() => {
    function handleTabRemoved(tabId: number): void {
      setChromeTabs(chromeTabs && chromeTabs.filter(tab => tab.id !== tabId));
    }
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    return () => chrome.tabs.onRemoved.removeListener(handleTabRemoved);
  });

  return {
    chromeTabs,
    handleCloseTab(tabId: number): void {
      chrome.tabs.remove(tabId);
    }
  };
}
