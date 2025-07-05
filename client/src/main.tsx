import { createRoot } from "react-dom/client";
import App from "./App-fixed";
import "./index.css";

// Error boundary to catch any issues
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to mount React app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial; background: white; color: black;">
      <h1>Application Error</h1>
      <p>Failed to load the application. Please refresh the page.</p>
      <pre style="background: #f5f5f5; padding: 10px; margin: 10px 0;">${error}</pre>
    </div>
  `;
}
