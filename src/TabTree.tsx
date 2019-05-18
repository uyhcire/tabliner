import React, { useEffect } from "react";
import { Tree, ITreeNode } from "@blueprintjs/core";

import { ChromeTab } from "./ChromeTab";

interface TabTreeProps {
  chromeTabs: Array<ChromeTab>;
  handleCloseTab(tabId: number): void;
  selectedTabIndex: number | null;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function TabTree({
  chromeTabs,
  handleCloseTab,
  selectedTabIndex,
  setSelectedTabIndex
}: TabTreeProps): JSX.Element {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      let shouldCapture = true;
      switch (e.key) {
        case "Backspace":
          if (selectedTabIndex != null) {
            const selectedTabId = chromeTabs[selectedTabIndex].id;
            if (selectedTabId != null) {
              handleCloseTab(selectedTabId);
            }
          }
          break;
        case "ArrowUp":
          if (selectedTabIndex != null) {
            setSelectedTabIndex(selectedTabIndex - 1);
          } else {
            setSelectedTabIndex(chromeTabs.length - 1);
          }
          break;
        case "ArrowDown":
          if (selectedTabIndex != null) {
            setSelectedTabIndex(selectedTabIndex + 1);
          } else {
            setSelectedTabIndex(0);
          }
          break;
        default:
          // Do nothing
          shouldCapture = false;
      }
      if (shouldCapture) {
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [chromeTabs, handleCloseTab, selectedTabIndex, setSelectedTabIndex]);

  return (
    <Tree
      contents={chromeTabs.map(
        (tab, i): ITreeNode => ({
          id: tab.id != null ? String(tab.id) : `undefined-tab-id-${i}`,
          icon: <img src={tab.favIconUrl} height={20} width={20} />,
          label: tab.title,
          isSelected: i === selectedTabIndex
        })
      )}
      onNodeClick={(_node, nodePath) => {
        if (nodePath.length !== 1) {
          throw new Error("Expected tab list to be flat");
        }
        setSelectedTabIndex(nodePath[0]);
      }}
    />
  );
}
