import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CrmProvider } from "./context/CrmContext.jsx";
import "./index.css";

/*
 * AuthProvider wraps CrmProvider because the CRM data layer waits on
 * the session before it fetches anything — it reads useAuth().
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CrmProvider>
          <App />
        </CrmProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
