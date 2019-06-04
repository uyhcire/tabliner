import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { cleanUpEnzymeAfterEachTest } from "./src/safeMount";

configure({ adapter: new Adapter() });

afterEach(() => {
  cleanUpEnzymeAfterEachTest();
});
