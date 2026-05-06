import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-country-state-city/dist/react-country-state-city.css";

createRoot(document.getElementById("root")!).render(<App />);
