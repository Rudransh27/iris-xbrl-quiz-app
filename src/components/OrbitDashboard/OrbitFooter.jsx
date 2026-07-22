// src/components/OrbitDashboard/OrbitFooter.jsx
// Simple centered footer band — brand mark, a row of real in-app quick
// links, a row of the company's real social links, and a copyright line.
// Mounted at the bottom of Learn, Progress, Ideas & R&D, and Leaderboard
// (the same four pages that got SectionHeader) so those pages don't just
// end abruptly after their content.
import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";
import irisOrbitLogo from "../../assets/iris-orbit-logo.png";
import "./OrbitFooter.css";

const QUICK_LINKS = [
  { to: "/orbit",             label: "Home" },
  { to: "/orbit/modules",     label: "Learn" },
  { to: "/orbit/progress",    label: "Progress" },
  { to: "/orbit/leaderboard", label: "Leaderboard" },
  { to: "/orbit/ideas",       label: "Ideas" },
  { to: "/orbit/profile",     label: "Profile" },
];

export default function OrbitFooter() {
  return (
    <footer className="orbit-footer">
      <img src={irisOrbitLogo} alt="IRIS Orbit" className="orbit-footer__logo" />

      <nav className="orbit-footer__links">
        {QUICK_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className="orbit-footer__link">{label}</Link>
        ))}
      </nav>

      <div className="orbit-footer__social">
        <a href="https://www.linkedin.com/company/iris-business-services-limited/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
        <a href="https://twitter.com/XBRL_IRIS" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
        <a href="https://www.facebook.com/IRISBusinessServicesLimited" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
        <a href="https://www.youtube.com/@IrisbusinessXBRL" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube /></a>
      </div>

      <p className="orbit-footer__copyright">© {new Date().getFullYear()} IRIS Regtech Solutions</p>
    </footer>
  );
}
