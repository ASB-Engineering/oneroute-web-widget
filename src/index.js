import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

const root = document.querySelector(".oneroute_widget");

ReactDOM.render(<App {...root.dataset} />, root);
