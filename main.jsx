import "./storage.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthGate } from "./Auth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      {({ isAdmin, user }) => <App isAdmin={isAdmin} userEmail={user.email} />}
    </AuthGate>
  </React.StrictMode>
);
