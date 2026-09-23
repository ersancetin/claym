import { createRoot } from "react-dom/client";
import App from "./App";
import { PasswordGate } from "@/components/PasswordGate";
import "react-day-picker/style.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <PasswordGate>
        <App />
    </PasswordGate>,
);
