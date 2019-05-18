import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Tree, ITreeNode, Colors } from "@blueprintjs/core";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

// We have the `tabs` permission, so some fields are guaranteed to be present
type ChromeTab = chrome.tabs.Tab & { title: string };

function App(): JSX.Element {
  const [chromeTabs, setChromeTabs] = useState(null as Array<ChromeTab> | null);
  // Load tabs
  useEffect(() => {
    chrome.tabs.query({}, (tabs: Array<ChromeTab>) => setChromeTabs(tabs));
  }, []);

  return (
    <div>
      {chromeTabs ? (
        <Tree
          contents={chromeTabs.map(
            (tab): ITreeNode => ({
              id: String(tab.id),
              icon: <img src={tab.favIconUrl} height={20} width={20} />,
              label: tab.title
            })
          )}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
