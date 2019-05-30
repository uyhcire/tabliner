import React, { useEffect } from "react";
import { Tree, ITreeNode } from "@blueprintjs/core";
import scrollIntoView from "scroll-into-view-if-needed";

import { ChromeTab } from "./ChromeTab";

// Helper to make sure we call e.preventDefault() if and only if we handle the key
function handleKey(key: string, e: KeyboardEvent, handler: () => void): void {
  if (e.key === key) {
    e.preventDefault();
    handler();
  }
}

function groupTabsByWindow(
  chromeTabs: Array<ChromeTab>
): Array<{ windowId: number; windowTabs: Array<ChromeTab> }> {
  const tabsByWindowId: { [windowId: number]: Array<ChromeTab> } = {};
  for (const tab of chromeTabs) {
    if (!(tab.windowId in tabsByWindowId)) {
      tabsByWindowId[tab.windowId] = [];
    }
    tabsByWindowId[tab.windowId].push(tab);
  }

  const orderedWindowIds: Set<number> = new Set(
    chromeTabs.map(tab => tab.windowId)
  );

  return [...orderedWindowIds].map(windowId => ({
    windowId,
    windowTabs: tabsByWindowId[windowId]
  }));
}

export interface TabTreeProps {
  chromeTabs: Array<ChromeTab>;
  handleCloseTab(tabId: number): void;
  handleMoveTab(tabId: number, newIndex: number): void;
  handleGoToTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
  selectedTabIndex: number | null;
  setSelectedTabIndex(index: number | null): void;
}

export default function TabTree({
  chromeTabs,
  handleCloseTab,
  handleMoveTab,
  handleGoToTab,
  handleCreateTabAfter,
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
      handleKey("Enter", e, () => {
        if (selectedTabIndex != null) {
          const selectedTabId = chromeTabs[selectedTabIndex].id;
          if (selectedTabId != null) {
            handleGoToTab(selectedTabId);
          }
        }
      });
      handleKey(" ", e, () => {
        if (selectedTabIndex != null) {
          const selectedTabId = chromeTabs[selectedTabIndex].id;
          if (selectedTabId != null) {
            handleCreateTabAfter(selectedTabId);
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
    handleGoToTab,
    handleCreateTabAfter,
    selectedTabIndex,
    setSelectedTabIndex
  ]);

  const groupedTabs = groupTabsByWindow(chromeTabs);

  return (
    <Tree
      ref={(treeInstance: Tree | null) => {
        if (treeInstance && selectedTabIndex != null) {
          const selectedTabId = chromeTabs[selectedTabIndex].id;
          const selectedNode =
            selectedTabId && treeInstance.getNodeContentElement(selectedTabId);
          if (selectedNode) {
            scrollIntoView(selectedNode, {
              scrollMode: "if-needed",
              block: "center",
              inline: "center"
            });
          }
        }
      }}
      contents={(() => {
        const windowTreeNodes = [];

        let windowBaseTabIndex = 0;
        for (const [
          windowIndex,
          { windowId, windowTabs }
        ] of groupedTabs.entries()) {
          windowTreeNodes.push({
            id: windowId,
            label: `Window ${windowIndex + 1}`,
            isExpanded: true,
            hasCaret: false,
            childNodes: windowTabs.map(
              (tab, windowTabIndex): ITreeNode => ({
                id: tab.id != null ? String(tab.id) : `undefined-tab-id-${i}`,
                icon: <img src={tab.favIconUrl} height={20} width={20} />,
                label: (
                  <span>
                    {tab.active ? <strong>{tab.title}</strong> : tab.title}
                  </span>
                ),
                isSelected:
                  windowBaseTabIndex + windowTabIndex === selectedTabIndex
              })
            )
          });

          windowBaseTabIndex += windowTabs.length;
        }

        return windowTreeNodes;
      })()}
      onNodeClick={(_node, nodePath) => {
        if (nodePath.length === 2) {
          const [windowIndex, tabIndex] = nodePath;

          let windowBaseTabIndex = 0;
          for (const { windowTabs } of groupedTabs.slice(0, windowIndex)) {
            windowBaseTabIndex += windowTabs.length;
          }

          setSelectedTabIndex(windowBaseTabIndex + tabIndex);
        } else if (nodePath.length === 1) {
          // For now, do nothing if a window's tree node is clicked
        } else {
          throw new Error(`Unexpected node path of length ${nodePath.length}`);
        }
      }}
    />
  );
}
