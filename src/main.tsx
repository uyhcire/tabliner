import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function App(): JSX.Element {
  const [chromeTabs, setChromeTabs] = useState(null as Array<
    chrome.tabs.Tab
  > | null);
  useEffect(() => {
    chrome.tabs.query({}, tabs => setChromeTabs(tabs));
  }, []);

  return (
    <div>
      {(() => {
        const keys = new Set();
        for (const tab of chromeTabs || []) {
          for (const key of Object.keys(tab)) {
            keys.add(key);
          }
        }
        return JSON.stringify([...keys]);
      })()}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
