import ReactDOM from "react-dom";
import React from "react";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import TabTree from "./TabTree";
import { useChromeTabs } from "./useChromeTabs";
import { useSelectedTabIndex } from "./useSelectedTabIndex";

function App(): JSX.Element | null {
  const { chromeTabs, handleCloseTab, handleMoveTab } = useChromeTabs();
  const [selectedTabIndex, setSelectedTabIndex] = useSelectedTabIndex(
    chromeTabs && chromeTabs.length
  );

  return (
    <div>
      {chromeTabs ? (
        <TabTree
          chromeTabs={chromeTabs}
          handleCloseTab={handleCloseTab}
          handleMoveTab={handleMoveTab}
          selectedTabIndex={selectedTabIndex}
          setSelectedTabIndex={setSelectedTabIndex}
        />
      ) : null}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
