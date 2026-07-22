// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="duo-site-footer">
      <div className="duo-footer-container">

        {/* Brand */}
        <div className="duo-footer-section company-info">
          <h3 className="duo-footer-heading">IRIS Orbit</h3>
          <p className="duo-footer-text-link">
            <a href="https://irisbusiness.com/" target="_blank" rel="noopener noreferrer">
              irisbusiness.com
            </a>
          </p>
          <p className="duo-company-description">
            The learning platform for every team at IRIS — bite-sized modules,
            streaks, Lightyear rewards, and a real leaderboard.
          </p>
        </div>

        {/* Quick Links — real in-app destinations, not external product sites */}
        <div className="duo-footer-section products">
          <h3 className="duo-footer-heading">Quick Links</h3>
          <ul className="duo-footer-ul">
            <li><Link to="/orbit/modules" className="product-link link-azure">Learn</Link></li>
            <li><Link to="/orbit/progress" className="product-link link-pink">Progress</Link></li>
            <li><Link to="/orbit/leaderboard" className="product-link link-gold">Leaderboard</Link></li>
            <li><Link to="/orbit/ideas" className="product-link link-azure">Ideas & R&D</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="duo-footer-section contact">
          <h3 className="duo-footer-heading">Contact Us</h3>
          <p className="duo-contact-node">022 6723 1000</p>
          <p className="duo-contact-node">
            <a href="mailto:hello@irisbusiness.com">hello@irisbusiness.com</a>
          </p>
        </div>

        {/* Social */}
        <div className="duo-footer-section social-media">
          <h3 className="duo-footer-heading">Follow Along</h3>
          <p className="duo-social-text">Stay connected with our global circles for updates and news release logs.</p>
          <div className="duo-social-icons">
            <a href="https://www.linkedin.com/company/iris-business-services-limited/" target="_blank" rel="noopener noreferrer" className="duo-social-btn social-linkedin">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com/XBRL_IRIS" target="_blank" rel="noopener noreferrer" className="duo-social-btn social-twitter">
              <FaTwitter />
            </a>
            <a href="https://www.facebook.com/IRISBusinessServicesLimited" target="_blank" rel="noopener noreferrer" className="duo-social-btn social-facebook">
              <FaFacebook />
            </a>
            <a href="https://www.youtube.com/@IrisbusinessXBRL" target="_blank" rel="noopener noreferrer" className="duo-social-btn social-youtube">
              <FaYoutube />
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Legal Band */}
      <div className="duo-footer-bottom text-center">
        <p>© {new Date().getFullYear()} IRIS Regtech Solutions. Made with Orbit Engine.</p>
        <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>
          3D astronaut model "Falling Spaceman (FanArt)" by wallmasterr, licensed{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
          , based on a design by Tenhun.
        </p>
      </div>
    </footer>
  );
}
