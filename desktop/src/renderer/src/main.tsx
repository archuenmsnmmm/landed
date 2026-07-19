import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const isOverlayRoute = window.location.hash.replace(/^#/, "").startsWith("/overlay");
if (isOverlayRoute) {
  document.documentElement.classList.add("overlay");
  document.body.classList.add("overlay");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
