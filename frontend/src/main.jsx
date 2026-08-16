import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CrmProvider } from "./context/CrmContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CrmProvider>
        <App />
      </CrmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
