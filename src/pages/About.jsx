// src/pages/About.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { StarFill, RocketTakeoffFill, PeopleFill, GlobeAmericas } from "react-bootstrap-icons";
import "./About.css";

const VALUES = [
  {
    icon: RocketTakeoffFill,
    title: "Learning that sticks",
    text: "Bite-sized modules, daily habits, and real Lightyear — built the way people actually retain new skills, not just pass a one-time test.",
  },
  {
    icon: PeopleFill,
    title: "Built for every team",
    text: "From iFile and Carbon to iDEAL and beyond, Iris Orbit adapts its curriculum to the department and team you're actually part of.",
  },
  {
    icon: GlobeAmericas,
    title: "Backed by IRIS Regtech Solutions",
    text: "A leading provider of software, data formats, and services for global financial and compliance business reporting.",
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page-container">
      <div className="about-content-wrapper">
        <div className="duo-spark-badge">
          <StarFill size={11} /> ABOUT US
        </div>
        <h1 className="about-title">
          About <span className="title-accent">Iris Orbit</span>
        </h1>
        <p className="about-lede">
          Iris Orbit is IRIS Regtech Solutions' gamified learning platform — built to turn compliance and
          business-reporting training into something people actually look forward to, one streak, one
          module, and one Lightyear bar at a time.
        </p>

        <div className="about-values-grid">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div className="about-value-card" key={v.title}>
                <div className="about-value-icon">
                  <Icon size={20} />
                </div>
                <h4>{v.title}</h4>
                <p>{v.text}</p>
              </div>
            );
          })}
        </div>

        <p className="about-closing">
          Whether you're new to XBRL or sharpening skills you've used for years, Iris Orbit meets you
          where you are — with a curriculum, a leaderboard, and a community built around actually
          finishing what you start.
        </p>

        <div className="about-cta-row">
          <button className="about-cta-btn" onClick={() => navigate("/orbit")}>
            Go to Iris Orbit →
          </button>
          <button className="about-cta-btn-outline" onClick={() => navigate("/contact")}>
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
