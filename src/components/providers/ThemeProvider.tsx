import { createContext, useContext, useEffect, useState } from "react";
import { themeColors } from "@/theme/colors";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "forgeflow-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (
        (localStorage.getItem(storageKey) as Theme) ||
        (localStorage.getItem("theme") as Theme) ||
        defaultTheme
      );
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const getSystemTheme = () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const activeTheme = theme === "system" ? getSystemTheme() : theme;
    root.classList.add(activeTheme);

    // Inject CSS variables from colors.ts
    const currentColors = themeColors[activeTheme];
    if (currentColors) {
      Object.entries(currentColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string);
      });
    }

    // If theme is system, listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => {
        const sys = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(sys);
        const colors = themeColors[sys];
        if (colors) {
          Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value as string);
          });
        }
      };
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
        localStorage.setItem("theme", newTheme);
      } catch (err) {
        console.error("Failed to persist theme", err);
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
