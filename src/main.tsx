import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

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
      {JSON.stringify(
        chromeTabs &&
          chromeTabs.map(tab => ({
            title: tab.title,
            faviconUrl: tab.favIconUrl
          }))
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
