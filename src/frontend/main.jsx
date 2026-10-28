import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Index.css";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes.jsx";
import { StoreProvider } from "./hooks/StoreProvider.jsx";
import { ToastContainer } from "react-toastify";

export const Main = () => {
  return (
    <React.StrictMode>
      {/* Provide global state to all components */}
      <ToastContainer position="top-right" autoClose={3000} />
      <StoreProvider>
        {/* Set up routing for the application */}
        <RouterProvider router={router} />
      </StoreProvider>
    </React.StrictMode>
  );
};

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
