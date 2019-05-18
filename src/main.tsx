import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import TabTree from "./TabTree";
import { ChromeTab } from "./ChromeTab";

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
        <TabTree
          chromeTabs={chromeTabs}
          setChromeTabs={setChromeTabs}
          setLocked={setLocked}
          selectedTabIndex={selectedTabIndex}
          setSelectedTabIndex={setSelectedTabIndex}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
