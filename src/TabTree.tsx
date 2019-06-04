import React, { useEffect } from "react";
import { Tree, ITreeNode } from "@blueprintjs/core";
import scrollIntoView from "scroll-into-view-if-needed";

import { ChromeTab } from "./ChromeTab";
import {
  SelectedNodePath,
  GroupedTabs,
  groupTabsByWindow
} from "./reduceTablinerState";

// Helper to make sure we call e.preventDefault() if and only if we handle the key
function handleKey(key: string, e: KeyboardEvent, handler: () => void): void {
  if (e.key === key) {
    e.preventDefault();
    handler();
  }
}

function getSelectedTabId(
  groupedTabs: GroupedTabs,
  selectedNodePath: SelectedNodePath | null
): number | null {
  if (selectedNodePath != null && selectedNodePath.length === 2) {
    const [windowIndex, tabIndex] = selectedNodePath;
    const selectedTabId = groupedTabs[windowIndex].windowTabs[tabIndex].id;
    return selectedTabId != null ? selectedTabId : null;
  } else {
    return null;
  }
}

export interface TabTreeProps {
  chromeTabs: Array<ChromeTab>;
  handleCloseTab(tabId: number): void;
  handleMoveTab(
    windowId: number,
    tabId: number,
    newIndexInWindow: number
  ): void;
  handleGoToTab(tabId: number): void;
  handleCreateTabAfter(tabId: number): void;
  selectedNodePath: SelectedNodePath | null;
  setSelectedNodePath(nodePath: SelectedNodePath | null): void;
  moveSelectedNodeUp(): void;
  moveSelectedNodeDown(): void;
}

export default function TabTree({
  chromeTabs,
  handleCloseTab,
  handleMoveTab,
  handleGoToTab,
  handleCreateTabAfter,
  selectedNodePath,
  setSelectedNodePath,
  moveSelectedNodeUp,
  moveSelectedNodeDown
}: TabTreeProps): JSX.Element {
  const groupedTabs = groupTabsByWindow(chromeTabs);
  const selectedTabId = getSelectedTabId(groupedTabs, selectedNodePath);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      handleKey("Backspace", e, () => {
        if (selectedTabId != null) {
          handleCloseTab(selectedTabId);
        }
      });
      handleKey("Enter", e, () => {
        if (selectedTabId != null) {
          handleGoToTab(selectedTabId);
        }
      });
      handleKey(" ", e, () => {
        if (selectedTabId != null) {
          handleCreateTabAfter(selectedTabId);
        }
      });
      handleKey("ArrowUp", e, () => {
        if (e.metaKey) {
          if (
            selectedTabId != null &&
            selectedNodePath != null &&
            selectedNodePath.length === 2
          ) {
            const [windowIndex, tabIndex] = selectedNodePath;
            moveSelectedNodeUp();
            handleMoveTab(
              groupedTabs[windowIndex].windowId,
              selectedTabId,
              tabIndex - 1
            );
          }
        } else if (selectedNodePath != null) {
          moveSelectedNodeUp();
        } else {
          setSelectedNodePath([
            groupedTabs.length - 1,
            // Index of last tab in last window
            groupedTabs[groupedTabs.length - 1].windowTabs.length - 1
          ]);
        }
      });
      handleKey("ArrowDown", e, () => {
        if (e.metaKey) {
          if (
            selectedTabId != null &&
            selectedNodePath != null &&
            selectedNodePath.length === 2
          ) {
            const [windowIndex, tabIndex] = selectedNodePath;
            moveSelectedNodeDown();
            handleMoveTab(
              groupedTabs[windowIndex].windowId,
              selectedTabId,
              tabIndex + 1
            );
          }
        } else if (selectedNodePath != null) {
          moveSelectedNodeDown();
        } else {
          setSelectedNodePath([0, 0]);
        }
      });
      handleKey("Escape", e, () => {
        setSelectedNodePath(null);
      });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    groupedTabs,
    selectedTabId,
    handleCloseTab,
    handleMoveTab,
    handleGoToTab,
    handleCreateTabAfter,
    selectedNodePath,
    setSelectedNodePath,
    moveSelectedNodeUp,
    moveSelectedNodeDown
  ]);

  return (
    <Tree
      ref={(treeInstance: Tree | null) => {
        if (treeInstance) {
          const selectedNode =
            selectedTabId &&
            treeInstance.getNodeContentElement(`tab-${selectedTabId}`);
          if (selectedNode) {
            scrollIntoView(selectedNode, {
              scrollMode: "if-needed",
              block: "center",
              inline: "center"
            });
          }
        }
      }}
      contents={[...groupedTabs.entries()].map(
        ([windowIndex, { windowId, windowTabs }]) => ({
          id: `window-${windowId}`,
          label: `Window ${windowIndex + 1}`,
          isExpanded: true,
          hasCaret: false,
          isSelected: Boolean(
            selectedNodePath &&
              selectedNodePath.length === 1 &&
              selectedNodePath[0] === windowIndex
          ),
          childNodes: windowTabs.map(
            (tab, windowTabIndex): ITreeNode => ({
              id:
                tab.id != null
                  ? `tab-${tab.id}`
                  : `undefined-tab-id-${windowTabIndex}`,
              icon: <img src={tab.favIconUrl} height={20} width={20} />,
              label: (
                <span>
                  {tab.active ? <strong>{tab.title}</strong> : tab.title}
                </span>
              ),
              isSelected: Boolean(
                selectedNodePath &&
                  selectedNodePath[0] === windowIndex &&
                  selectedNodePath[1] === windowTabIndex
              )
            })
          )
        })
      )}
      onNodeClick={(_node, nodePath) => {
        if (nodePath.length === 2) {
          setSelectedNodePath(nodePath as [number, number]);
        } else if (nodePath.length === 1) {
          setSelectedNodePath(nodePath as [number]);
        } else {
          throw new Error(`Unexpected node path of length ${nodePath.length}`);
        }
      }}
    />
  );
}
