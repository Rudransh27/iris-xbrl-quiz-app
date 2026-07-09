// src/components/OrbitDashboard/HeroWelcome.jsx
import React from "react";

export default function HeroWelcome() {
  return (
    <div className="orbit-hero">
      <div className="orbit-hero__blob" style={{ width: 220, height: 220, top: -60, right: 60 }} />
      <div className="orbit-hero__blob" style={{ width: 140, height: 140, bottom: -40, left: "28%" }} />
      <span className="orbit-hero__eyebrow">Iris Orbit</span>
      <h1 className="orbit-hero__heading">WELCOME TO IRIS ORBIT</h1>
      <p className="orbit-hero__subheading">
        You are orbiting through knowledge, hope you find something interesting today!
      </p>
    </div>
  );
}
