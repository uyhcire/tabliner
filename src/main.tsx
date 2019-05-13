import Handsontable from "handsontable";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.css";

// We have the `tabs` permission, so some fields are guaranteed to be present
type ChromeTab = chrome.tabs.Tab & { title: string };

export function faviconRenderer(
  _instance: never,
  td: HTMLTableCellElement,
  _row: never,
  _col: never,
  _prop: never,
  value: string
): HTMLTableCellElement {
  const escaped = Handsontable.helper.stringify(value);

  if (escaped.indexOf("http") === 0) {
    const img = document.createElement("img");
    img.src = value;
    img.height = 20;
    img.width = 20;

    Handsontable.dom.empty(td);
    td.appendChild(img);
  } else {
    // render nothing
  }

  return td;
}

function App(): JSX.Element | string {
  const [chromeTabs, setChromeTabs] = useState(null as Array<ChromeTab> | null);
  useEffect(() => {
    chrome.tabs.query({}, (tabs: Array<ChromeTab>) => setChromeTabs(tabs));
  }, []);

  return chromeTabs ? (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={chromeTabs.map((tab: ChromeTab) => ({
        faviconUrl: tab.favIconUrl,
        title: tab.title
      }))}
      columns={[
        { data: "faviconUrl", renderer: faviconRenderer, readOnly: true },
        { data: "title", readOnly: true }
      ]}
      colHeaders={["", "Title"]}
      colWidths={[50, 400]}
    />
  ) : (
    "Loading..."
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
