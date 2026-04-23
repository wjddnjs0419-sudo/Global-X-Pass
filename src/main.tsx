import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// 💡 1. app 폴더에 만든 LanguageContext에서 Provider를 불러옵니다.
import { LanguageProvider } from "./app/LanguageContext"; 

// 💡 2. <App /> 컴포넌트를 <LanguageProvider>로 감싸줍니다.
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);