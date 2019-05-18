import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Tree, ITreeNode, Colors } from "@blueprintjs/core";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

// We have the `tabs` permission, so some fields are guaranteed to be present
type ChromeTab = chrome.tabs.Tab & { title: string };

function useChromeTabs(): {
  chromeTabs: Array<ChromeTab> | null;
  setChromeTabs: React.Dispatch<React.SetStateAction<Array<ChromeTab> | null>>;
  locked: boolean;
  setLocked: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const [chromeTabs, setChromeTabs] = useState<Array<ChromeTab> | null>(null);
  const [locked, setLocked] = useState<boolean>(false);

  // Load tabs
  useEffect(() => {
    chrome.tabs.query({}, (tabs: Array<ChromeTab>) => setChromeTabs(tabs));
  }, []);

  return {
    chromeTabs,
    setChromeTabs: (newChromeTabs: Array<ChromeTab> | null) => {
      if (!locked) {
        setChromeTabs(newChromeTabs);
      }
    },
    locked,
    setLocked
  };
}

function App(): JSX.Element {
  const { chromeTabs, setChromeTabs, setLocked } = useChromeTabs();
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(null);

  return (
    <div>
      {chromeTabs ? (
        <div
          tabIndex={0}
          onKeyDown={e => {
            switch (e.key) {
              case "Backspace":
                if (selectedTabIndex != null) {
                  const selectedTabId = chromeTabs[selectedTabIndex].id;
                  if (selectedTabId == null) {
                    break;
                  }
                  setLocked(true);

                  chrome.tabs.remove(selectedTabId, () => {
                    setChromeTabs(
                      chromeTabs.filter(tab => tab.id !== selectedTabId)
                    );
                    setSelectedTabIndex(
                      Math.min(selectedTabIndex, chromeTabs.length - 1 - 1)
                    );
                    setLocked(false);
                  });
                }
                break;
              default:
              // Do nothing
            }
          }}
        >
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
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
