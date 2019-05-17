import Handsontable from "handsontable";
import React, { useEffect, useRef, useState } from "react";
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

function App(): JSX.Element {
  const [locked, setLocked] = useState(false);
  const [chromeTabs, setChromeTabs] = useState(null as Array<ChromeTab> | null);
  useEffect(() => {
    chrome.tabs.query({}, (tabs: Array<ChromeTab>) => setChromeTabs(tabs));
  }, []);

  const hotTableComponent: React.MutableRefObject<HotTable | null> = useRef(
    null
  );

  return chromeTabs ? (
    <HotTable
      ref={hotTableComponent}
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
      rowHeaders={true}
      // Event handlers
      afterDocumentKeyDown={async e => {
        if (locked) {
          return;
        }

        if (e.key !== "Backspace") {
          return;
        }

        if (!hotTableComponent || !hotTableComponent.current) {
          return;
        }

        const selectedRanges = hotTableComponent.current.hotInstance.getSelected();
        if (!selectedRanges) {
          return;
        }

        const selectedRowIndexes: Set<number> = new Set();
        for (const [startRow, startCol, endRow, endCol] of selectedRanges) {
          const minCol = Math.min(startCol, endCol);
          const maxCol = Math.max(startCol, endCol);
          // Only delete rows if all cells are selected
          if (
            minCol === 0 &&
            maxCol === hotTableComponent.current.hotInstance.countCols() - 1
          ) {
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);
            for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
              selectedRowIndexes.add(rowIndex);
            }
          }
        }

        const tabIds = chromeTabs
          .filter((_tab, i) => selectedRowIndexes.has(i))
          .map(tab => tab.id)
          .filter(tabId => tabId != null) as Array<number>;
        setLocked(true);
        chrome.tabs.remove(tabIds, () => {
          chrome.tabs.query({}, (tabs: Array<ChromeTab>) => {
            setChromeTabs(tabs);
            hotTableComponent &&
              hotTableComponent.current &&
              hotTableComponent.current.hotInstance.deselectCell();
            hotTableComponent &&
              hotTableComponent.current &&
              hotTableComponent.current.hotInstance.render();
            setLocked(false);
          });
        });
      }}
    />
  ) : (
    <div>Loading...</div>
  );
}

ReactDOM.render(<App />, document.getElementById("container"));
