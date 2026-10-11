import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
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
