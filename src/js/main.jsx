import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// React quản lý giao diện bên trong #root; nutrition-facts.js vẫn dựng SVG riêng.
createRoot(document.getElementById("root")).render(<App />);
