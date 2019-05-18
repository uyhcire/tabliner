import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { act } from "react-dom/test-utils";

import { useSelectedTabIndex } from "./useSelectedTabIndex";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockChildComponent(props: {
  selectedTabIndex: number | null;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<number | null>>;
}): null {
  return null;
}

function MockComponent(props: { numTabs: number }): JSX.Element {
  const [selectedTabIndex, setSelectedTabIndex] = useSelectedTabIndex(
    props.numTabs
  );

  return (
    <MockChildComponent
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
    />
  );
}

let wrapper: ReactWrapper;
beforeEach(() => {
  wrapper = mount(<MockComponent numTabs={3} />);
});

it("initializes to null", () => {
  expect(wrapper.find(MockChildComponent).props().selectedTabIndex).toEqual(
    null
  );
});

test.each([[-1, 0], [0, 0], [2, 2], [3, 2]])(
  "sets the tab index but stays within bounds (selecting index %j, expecting index %j)",
  (indexToSelect, expectedIndex) => {
    act(() => {
      wrapper
        .find(MockChildComponent)
        .props()
        .setSelectedTabIndex(indexToSelect);
    });
    wrapper.update();
    expect(wrapper.find(MockChildComponent).props().selectedTabIndex).toEqual(
      expectedIndex
    );
  }
);
