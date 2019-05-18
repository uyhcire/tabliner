import React, { useEffect } from "react";
import { Tree, ITreeNode } from "@blueprintjs/core";

import { ChromeTab } from "./ChromeTab";

interface TabTreeProps {
  chromeTabs: Array<ChromeTab>;
  setChromeTabs: React.Dispatch<React.SetStateAction<Array<ChromeTab>>>;
  setLocked: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTabIndex: number | null;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function TabTree({
  chromeTabs,
  setChromeTabs,
  setLocked,
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
            if (selectedTabId == null) {
              break;
            }
            setLocked(true);

            chrome.tabs.remove(selectedTabId, () => {
              setChromeTabs(chromeTabs.filter(tab => tab.id !== selectedTabId));
              setSelectedTabIndex(
                Math.min(selectedTabIndex, chromeTabs.length - 1 - 1)
              );
              setLocked(false);
            });
          }
          break;
        case "ArrowUp":
          if (selectedTabIndex != null) {
            setSelectedTabIndex(Math.max(0, selectedTabIndex - 1));
          } else {
            setSelectedTabIndex(chromeTabs.length - 1);
          }
          break;
        case "ArrowDown":
          if (selectedTabIndex != null) {
            setSelectedTabIndex(
              Math.min(chromeTabs.length - 1, selectedTabIndex + 1)
            );
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
  }, [
    chromeTabs,
    setChromeTabs,
    setLocked,
    selectedTabIndex,
    setSelectedTabIndex
  ]);

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
