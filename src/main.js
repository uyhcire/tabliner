import React from "react";
import ReactDOM from "react-dom";

class App extends React.Component {
  render() {
    return "hello, world.";
  }
}

ReactDOM.render(<App />, document.getElementById("container"));
