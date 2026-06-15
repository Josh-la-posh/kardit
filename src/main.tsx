import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import './styles/issue-card.css'
import './styles/app.css'
import "react-country-state-city/dist/react-country-state-city.css";
import { installIamFetch } from './iam/installIamFetch';

installIamFetch();
createRoot(document.getElementById("root")!).render(<App />);
