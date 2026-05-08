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
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialTheme();
    document.documentElement.classList.toggle("dark", dark);
    return dark;
  });

  const toggle = () => {
    setIsDark((v) => {
      const next = !v;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
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
