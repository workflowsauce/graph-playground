// src/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";

import './index.css'; // Import Tailwind CSS

import App from "./app";

// Get the root element from the DOM
const rootElement = document.getElementById("root");

// Create a root and render the App component
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
