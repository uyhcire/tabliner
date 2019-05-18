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
  const [selectedTabId, setSelectedTabId] = useState(null as number | null);

  return (
    <div>
      {chromeTabs ? (
        <div
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Backspace" && selectedTabId) {
              setLocked(true);
              chrome.tabs.remove(selectedTabId, () => {
                setChromeTabs(
                  chromeTabs.filter(tab => tab.id !== selectedTabId)
                );
                setLocked(false);
              });
            }
          }}
        >
          <Tree
            contents={chromeTabs.map(
              (tab): ITreeNode => ({
                id: String(tab.id),
                icon: <img src={tab.favIconUrl} height={20} width={20} />,
                label: tab.title,
                isSelected: tab.id === selectedTabId
              })
            )}
            onNodeClick={node => setSelectedTabId(Number(node.id))}
          />
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
