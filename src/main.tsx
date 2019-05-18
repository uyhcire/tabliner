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

  return chromeTabs ? (
    <ul>
      {chromeTabs.map(tab => (
        <li key={tab.id}>{tab.title}</li>
      ))}
    </ul>
  ) : (
    <div>Loading...</div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
