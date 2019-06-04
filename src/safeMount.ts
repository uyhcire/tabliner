import { mount, ReactWrapper } from "enzyme";

let allWrappers: Array<ReactWrapper> = [];

/*
 * Wrapper around Enzyme's `mount` that enables automatic cleanup after each test.
 *
 * With Enzyme's `mount`, event listeners may interfere with subsequent tests.
 * By unmounting all components after each test, we can ensure that
 * event listeners are automatically cleaned up.
 */
export const safeMount: typeof mount = (...args: Parameters<typeof mount>) => {
  // eslint-disable-next-line no-restricted-syntax
  const wrapper = mount(...args);
  allWrappers.push(wrapper);
  return wrapper;
};

export function cleanUpEnzymeAfterEachTest(): void {
  for (const wrapper of allWrappers) {
    if (wrapper.length > 0) {
      wrapper.unmount();
    }
  }
  allWrappers = [];
}
