console.log("[v0] main.tsx loading");
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[v0] main.tsx rendering App");
createRoot(document.getElementById("root")!).render(<App />);
