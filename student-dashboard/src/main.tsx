# Entry point for the React app
# Renders the App component into the #root div

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";   # Import all the styles
import App from "./App"; # Import the main component

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
