import { createContext, useContext, useState, ReactNode } from "react";

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

function getInitialTheme(): boolean {
  return localStorage.getItem("theme") === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(getInitialTheme);

  const toggle = () => {
    setIsDark((v) => {
      const next = !v;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
