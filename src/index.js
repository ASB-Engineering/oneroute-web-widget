import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

// Find all widget divs
const WidgetDivs = document.querySelectorAll(".oneroute_widget");

// Inject our React App into each
WidgetDivs.forEach((Div) => {
  ReactDOM.render(
    <React.StrictMode>
      <App domElement={Div} />
    </React.StrictMode>,
    Div
  );
});
