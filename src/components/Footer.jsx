import React from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-section company-info">
          <h3 className="footer-heading">IRIS Business</h3>
          <p className="footer-text">
            <a href="https://irisbusiness.com/" className="footer-link-main">
              www.irisbusiness.com
            </a>
          </p>
          <p className="company-description">
            Leading provider of software, data, and services for financial and business reporting.
          </p>
        </div>

        <div className="footer-section products">
          <h3 className="footer-heading">Our Products</h3>
          <ul>
            <li><a href="http://irisifile.com/" target="_blank" className="footer-link">iFile</a></li>
            <li><a href="https://iriscarbon.com/" target="_blank" className="footer-link">Carbon</a></li>
            <li><a href="https://irisbusiness.com/iris-ideal/" target="_blank" className="footer-link">iDEAL</a></li>
          </ul>
        </div>
        
        <div className="footer-section contact-and-subsidiaries">
          <h3 className="footer-heading">Contact</h3>
          <p>022 6723 1000</p>
          <p><a href="mailto:hello@irisbusiness.com" className="footer-link">hello@irisbusiness.com</a></p>
         
        </div>
        
        <div className="footer-section social-media">
          <h3 className="footer-heading">Follow Us</h3>
          <p className="social-text">Stay connected and follow us on social media for the latest updates and news.</p>
          <div className="social-icons">
             <a href="https://www.linkedin.com/company/iris-business-services-limited/" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
            <a href="https://twitter.com/XBRL_IRIS" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://www.facebook.com/IRISBusinessServicesLimited" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href="https://www.youtube.com/@IrisbusinessXBRL" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} IRIS Business. All Rights Reserved.</p>
      </div>
    </footer>
  );
}