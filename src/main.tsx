import ReactDOM from "react-dom";
import React from "react";

import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import TabTree from "./TabTree";
import { useTablinerState } from "./useTablinerState";

function App(): JSX.Element | null {
  const {
    chromeTabs,
    selectedNodePath,
    setSelectedNodePath,
    moveSelectedNodeUp,
    moveSelectedNodeDown,
    handleCloseTab,
    handleMoveTab,
    handleGoToTab,
    handleCreateTabAfter,
    handleMergeWindows
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
          handleMergeWindows={handleMergeWindows}
          selectedNodePath={selectedNodePath}
          setSelectedNodePath={setSelectedNodePath}
          moveSelectedNodeUp={moveSelectedNodeUp}
          moveSelectedNodeDown={moveSelectedNodeDown}
        />
      ) : null}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
