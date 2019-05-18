import React, { useState } from "react";
import ReactDOM from "react-dom";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import TabTree from "./TabTree";
import { useChromeTabs } from "./useChromeTabs";

function useSelectedTabIndex(
  numTabs: number | null
): [number | null, React.Dispatch<React.SetStateAction<number | null>>] {
  let [selectedTabIndex, setSelectedTabIndex] = useState<number | null>(null);

  // Keep selectedTabIndex within bounds
  if (selectedTabIndex == null || numTabs == null) {
    selectedTabIndex == null;
  } else if (selectedTabIndex < 0) {
    selectedTabIndex = 0;
  } else if (selectedTabIndex >= numTabs) {
    selectedTabIndex = numTabs - 1;
  }

  return [selectedTabIndex, setSelectedTabIndex];
}

function App(): JSX.Element {
  const { chromeTabs, handleCloseTab } = useChromeTabs();
  const [selectedTabIndex, setSelectedTabIndex] = useSelectedTabIndex(
    chromeTabs && chromeTabs.length
  );

  return (
    <div>
      {chromeTabs ? (
        <TabTree
          chromeTabs={chromeTabs}
          handleCloseTab={handleCloseTab}
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
