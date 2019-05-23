import React, { useEffect } from "react";
import { Tree, ITreeNode } from "@blueprintjs/core";

import { ChromeTab } from "./ChromeTab";

// Helper to make sure we call e.preventDefault() if and only if we handle the key
function handleKey(key: string, e: KeyboardEvent, handler: () => void): void {
  if (e.key === key) {
    e.preventDefault();
    handler();
  }
}

interface TabTreeProps {
  chromeTabs: Array<ChromeTab>;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
  selectedTabIndex: number | null;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function TabTree({
  chromeTabs,
  handleCloseTab,
  handleMoveTab,
  selectedTabIndex,
  setSelectedTabIndex
}: TabTreeProps): JSX.Element {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      handleKey("Backspace", e, () => {
        if (selectedTabIndex != null) {
          const selectedTabId = chromeTabs[selectedTabIndex].id;
          if (selectedTabId != null) {
            handleCloseTab(selectedTabId);
          }
        }
      });
      handleKey("ArrowUp", e, () => {
        if (e.metaKey) {
          if (selectedTabIndex != null && selectedTabIndex > 0) {
            const selectedTabId = chromeTabs[selectedTabIndex].id;
            if (selectedTabId != null) {
              setSelectedTabIndex(selectedTabIndex - 1);
              handleMoveTab(selectedTabId, selectedTabIndex - 1);
            }
          }
        } else if (selectedTabIndex != null) {
          setSelectedTabIndex(selectedTabIndex - 1);
        } else {
          setSelectedTabIndex(chromeTabs.length - 1);
        }
      });
      handleKey("ArrowDown", e, () => {
        if (e.metaKey) {
          if (
            selectedTabIndex != null &&
            selectedTabIndex < chromeTabs.length - 1
          ) {
            const selectedTabId = chromeTabs[selectedTabIndex].id;
            if (selectedTabId != null) {
              setSelectedTabIndex(selectedTabIndex + 1);
              handleMoveTab(selectedTabId, selectedTabIndex + 1);
            }
          }
        } else if (selectedTabIndex != null) {
          setSelectedTabIndex(selectedTabIndex + 1);
        } else {
          setSelectedTabIndex(0);
        }
      });
      handleKey("Escape", e, () => {
        setSelectedTabIndex(null);
      });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    chromeTabs,
    handleCloseTab,
    handleMoveTab,
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
