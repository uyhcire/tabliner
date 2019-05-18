import React, { useState } from "react";

export function useSelectedTabIndex(
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
