import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

// eslint-disable-next-line no-restricted-imports
import { cleanUpEnzymeAfterEachTest } from "./src/safeMount";

configure({ adapter: new Adapter() });

afterEach(() => {
  cleanUpEnzymeAfterEachTest();
});
