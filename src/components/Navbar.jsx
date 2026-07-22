// src/components/Navbar.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Badge } from 'react-bootstrap';
import { BoxArrowRight, TrophyFill, Sun, MoonStarsFill } from 'react-bootstrap-icons';
import './Navbar.css';
import irisLogo from '../assets/iris-orbit-logo.png';
import AuthContext from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import ConfirmationModal from './ConfirmationModal';

const AVATAR_LIST = [
  { id: 'dev', emoji: '💻' },
  { id: 'xbrl', emoji: '⚙️' },
  { id: 'db', emoji: '🗄️' },
  { id: 'cyber', emoji: '⚡' }
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false); 
  // 💡 State to track if the custom image fails to load
  const [imageLoadError, setImageLoadError] = useState(false);
  
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user;
  const hasAdminDashboardAccess = user?.role === 'admin' || user?.role === 'superadmin';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLoginClick = () => {
    const currentPath = location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectPath', currentPath);
    }
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleLogoutConfirmation = () => {
    setShowModal(true); 
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setShowModal(false); 
    navigate('/');
    setImageLoadError(false); // Reset error state on logout
  };

  // 🔑 SAFETIED PICTURE ENGINE: Only renders custom image if url exists AND hasn't failed to load
  const hasCustomAvatar = Boolean(user?.avatarUrl) && !imageLoadError; 
  const activeAvatar = AVATAR_LIST.find(a => a.id === user?.avatarId) || AVATAR_LIST[0];
  const avatarImage = hasCustomAvatar ? user.avatarUrl : null;

  return (
    <nav className="duo-nav-container">
      <div className="duo-nav-wrapper">
        
        {/* LEFT CLUSTER: Brand & Navigation Routes */}
        <div className="nav-left-cluster">
          <Link to="/" className="duo-logo-link" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={irisLogo} alt="IRIS logo" className="duo-logo-img" />
          </Link>

          <div className={`duo-links-panel ${isMobileMenuOpen ? 'mobile-panel-open' : ''}`}>
            
            {/* 📱 MOBILE NAVIGATION DRAWER USER PROFILE WIDGET */}
            {isAuthenticated && (
              <div className="duo-mobile-profile-hero-card">
                <Link to="/profile" className="duo-profile-anchor w-100" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="navbar-avatar-frame">
                    {avatarImage ? (
                      <img 
                        src={avatarImage} 
                        alt="User Profile Image" 
                        className="navbar-avatar-img-element" 
                        onError={() => setImageLoadError(true)} // 🛡️ Triggers emoji fallback on broken link
                      />
                    ) : (
                      <span className="navbar-avatar-emoji-font">{activeAvatar.emoji}</span>
                    )}
                  </div>
                  <div className="d-flex flex-column align-items-start justify-content-center">
                    <span className="duo-username-text">{user.username}</span>
                    <Badge className="duo-xp-badge mt-1">
                      {user.xp || 0} Plasma
                    </Badge>
                  </div>
                </Link>
              </div>
            )}

            {/* Standard Navigation Link Stack */}
            <div className="duo-nav-item-wrapper">
              <Link to="/" className={`duo-nav-item ${location.pathname === '/' ? 'item-active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            </div>
            
             {isAuthenticated && (
              <div className="duo-nav-item-wrapper">
                <Link to="/orbit" className={`duo-nav-item ${location.pathname.startsWith('/orbit') ? 'item-active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  Iris Orbit
                </Link>
              </div>
            )}

            {isAuthenticated && hasAdminDashboardAccess && (
              <div className="duo-nav-item-wrapper">
                <Link to="/admin" className={`duo-nav-item ${location.pathname.startsWith('/admin') ? 'item-active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </div>
            )}

            {/* Mobile View Sidebar Footer Controls Container */}
            <div className="duo-mobile-actions-wrapper">
              <button onClick={toggleTheme} className="duo-theme-toggle-btn text-start gap-3 w-100 mb-2">
                {theme === 'light' ? <MoonStarsFill size={14} /> : <Sun size={14} />}
                <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
              </button>

              {!isAuthenticated ? (
                <button onClick={handleLoginClick} className="duo-btn-primary">Sign In</button>
              ) : (
                <button onClick={handleLogoutConfirmation} className="duo-btn-secondary d-flex align-items-center justify-content-center gap-2">
                  <BoxArrowRight size={14} /> <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CLUSTER: Desktop Mode Navigation Tools HUD */}
        <div className="duo-actions-desktop">
          <button onClick={toggleTheme} className="duo-theme-toggle-btn" title="Toggle Light/Dark">
            {theme === 'light' ? <MoonStarsFill size={14} /> : <Sun size={14} />}
          </button>

          {isAuthenticated ? (
            <div className="duo-user-hud-box">
              <Link to="/profile" className="duo-profile-anchor" title="View Profile Analytics">
                <div className="navbar-avatar-frame">
                  {avatarImage ? (
                    <img 
                      src={avatarImage} 
                      alt="User Profile Image" 
                      className="navbar-avatar-img-element" 
                      onError={() => setImageLoadError(true)} // 🛡️ Triggers emoji fallback on broken link
                    />
                  ) : (
                    <span className="navbar-avatar-emoji-font">{activeAvatar.emoji}</span>
                  )}
                </div>
                <span className="duo-username-text">{user.username}</span>
                <Badge className="duo-xp-badge">
                  {user.xp || 0} Plasma
                </Badge>
              </Link>
              <div className="hud-separator"></div>
              <button onClick={handleLogoutConfirmation} className="duo-logout-icon-btn" title="Sign Out">
                <BoxArrowRight size={15} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="duo-btn-outline" onClick={() => {
              const currentPath = location.pathname;
              if (currentPath !== '/login' && currentPath !== '/register') {
                localStorage.setItem('redirectPath', currentPath);
              }
            }}>
              Log In
            </Link>
          )}
        </div>

        {/* Mobile View Drawer Hamburger Menu Trigger Button Icon */}
        <button className={`duo-hamburger-trigger ${isMobileMenuOpen ? 'rotated' : ''}`} onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>
      
      <ConfirmationModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleLogout} />
    </nav>
  );
}