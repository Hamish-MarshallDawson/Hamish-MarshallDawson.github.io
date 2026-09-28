import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { applyColour, storedColour } from "./styles/palette";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// The stylesheets are in by now and nothing has painted yet: apply the
// visitor's chosen colour (if they picked one from the Colour menu) and
// rebuild the favicon and theme-color from the --signal token.
applyColour(storedColour());

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
