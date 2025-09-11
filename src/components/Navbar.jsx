// src/components/Navbar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { MdLightMode, MdDarkMode } from 'react-icons/md';
import './Navbar.css';
import irisLogo from '../assets/IRIS-logo_CMYK.svg';
import AuthContext from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal'; // Import the new modal component

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showModal, setShowModal] = useState(false); // New state for the modal
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLoginClick = () => {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectPath', currentPath);
    }
    navigate('/login');
    toggleMobileMenu();
  };

  const handleLogoutConfirmation = () => {
    setShowModal(true); // Show the modal instead of logging out immediately
    if (isMobileMenuOpen) {
      toggleMobileMenu(); // Close the mobile menu when the modal opens
    }
  };

  const handleLogout = () => {
    logout();
    setShowModal(false); // Close the modal
    navigate('/');
  };

  return (
    <nav className="navbar-complete">
      <Link to="/" className="navbar__branding">
        <img src={irisLogo} alt="IRIS logo" className="navbar__logo" />
      </Link>

      <div className={`navbar__links ${isMobileMenuOpen ? 'navbar__links--open' : ''}`}>
        <Link
          to="/"
          className={`nav-item ${window.location.pathname === '/' ? 'active' : ''}`}
          onClick={toggleMobileMenu}
        >
          Home
        </Link>
        <Link
          to="/modules"
          className={`nav-item ${window.location.pathname === '/modules' ? 'active' : ''}`}
          onClick={toggleMobileMenu}
        >
          Modules
        </Link>
        {isAuthenticated && isAdmin && (
          <Link
            to="/admin"
            className={`nav-item ${window.location.pathname.startsWith('/admin') ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            Admin Dashboard
          </Link>
        )}

        <div className="mobile-only-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn mobile-theme-btn"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          {!isAuthenticated ? (
            <button onClick={handleLoginClick} className="nav-item-button mobile-login-btn">
              Sign In
            </button>
          ) : (
            <button onClick={handleLogoutConfirmation} className="nav-item-button mobile-logout-btn">
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="navbar__actions">
        {/* <button
          onClick={toggleTheme}
          className="theme-toggle-btn desktop-only-theme"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
        </button> */}

        {!isAuthenticated ? (
          <Link
            to="/login"
            className="nav-item-button desktop-login-btn"
            onClick={() => {
              const currentPath = window.location.pathname;
              if (currentPath !== '/login' && currentPath !== '/register') {
                localStorage.setItem('redirectPath', currentPath);
              }
            }}
          >
            Sign In
          </Link>
        ) : (
          <button onClick={handleLogoutConfirmation} className="nav-item-button desktop-logout-btn">
            Logout
          </button>
        )}
      </div>

      <div
        className="hamburger-menu"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </div>
      
      {/* The modal component is rendered at the bottom */}
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
      />
    </nav>
  );
}