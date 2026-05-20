import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './styles/card.css'
import './styles/batches.css'
import './styles/portal.css'
import "react-country-state-city/dist/react-country-state-city.css";

createRoot(document.getElementById("root")!).render(<App />);
