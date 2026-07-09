// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Read previous saved session preference or default natively to light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("iris_orbit_theme") || "light";
  });

  useEffect(() => {
    // Inject attribute token straight over document node layout tree root
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("iris_orbit_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}