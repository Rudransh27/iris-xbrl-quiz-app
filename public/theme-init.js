// Applies the saved (or system) theme before React renders, so dark-mode
// users don't see a flash of the light theme. Must stay in sync with
// src/context/ThemeContext.jsx (same storage key and attributes).
(function () {
  try {
    var saved = localStorage.getItem('iris_orbit_theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    root.style.colorScheme = theme;
  } catch (e) { /* storage blocked — CSS defaults to light */ }
})();
