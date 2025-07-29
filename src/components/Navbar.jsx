import React, { useEffect, useState } from "react";
import "./Navbar.css";
import irisLogo from "../assets/IRIS-logo_CMYK.svg"; // replace with your logo path
import { Link } from "react-router-dom";

// Importing icons for theme toggle (example: from react-icons)
// If you don't have react-icons, you'd use SVGs or simple text.
// Example: npm install react-icons
import { MdLightMode, MdDarkMode } from "react-icons/md";


export default function Navbar() {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage, or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply the theme class to the body element
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    // Also update any previous quiz-specific theme setting if it existed
    // (This ensures consistency if old quiz theme logic needs cleanup)
    // document.body.classList.remove('quiz-dark-theme', 'quiz-light-theme'); // Example cleanup
    localStorage.setItem('theme', theme); // Save theme preference
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <nav className="navbar1">
      <Link to="/" className="navbar__link navbar__branding-link">
        <div className="navbar__branding">
          <img src={irisLogo} alt="IRIS logo" className="navbar__logo" />
          {/* Optional: Add a text brand name next to the logo */}
          {/* <span className="navbar__name">Your Brand</span> */}
        </div>
      </Link>

      <div className="navbar__nav-links">
        <Link to="/world" className="nav-item">
          Trail
        </Link>
        {/* Add more navigation links as needed */}
        <Link to="/about" className="nav-item">
          About
        </Link>
        <Link to="/contact" className="nav-item">
          Contact
        </Link>
      </div>

      <div className="navbar__theme-toggle">
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'light' ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
        </button>
      </div>
    </nav>
  );
}