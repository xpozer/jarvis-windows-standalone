import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/globals.css";
import "./styles/vignette.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("JARVIS root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
