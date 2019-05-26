import ReactDOM from "react-dom";
import React from "react";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import TabTree from "./TabTree";
import { useTablinerState } from "./useTablinerState";

function App(): JSX.Element | null {
  const {
    chromeTabs,
    selectedTabIndex,
    setSelectedTabIndex,
    handleCloseTab,
    handleMoveTab,
    handleGoToTab,
    handleCreateTabAfter
  } = useTablinerState();

  return (
    <div>
      {chromeTabs ? (
        <TabTree
          chromeTabs={chromeTabs}
          handleCloseTab={handleCloseTab}
          handleMoveTab={handleMoveTab}
          handleGoToTab={handleGoToTab}
          handleCreateTabAfter={handleCreateTabAfter}
          selectedTabIndex={selectedTabIndex}
          setSelectedTabIndex={setSelectedTabIndex}
        />
      ) : null}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
