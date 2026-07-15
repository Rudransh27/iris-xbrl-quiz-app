// src/components/hero3d/CosmicHeroCanvas.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import Starfield from "./Starfield";
import AstronautRig from "./AstronautRig";
import "./CosmicHero.css";

const CREDIT_URL =
  "https://sketchfab.com/3d-models/tenhun-falling-spaceman-fanart-9fd80b6a259f41fd99e6f56eee686dc5";

// Full-bleed 3D backdrop for HeroEntryCard — sits behind BOTH text and
// graphic columns so the starfield/astronaut reads as an environment the
// text floats in front of, not a boxed-in illustration. Always dark/cosmic
// regardless of the app's light/dark toggle (see CosmicHero.css's --hero-*
// namespace, deliberately independent of the global --orbit-* tokens).
export default function CosmicHeroCanvas() {
  return (
    <div className="cosmic-hero-stage">
      <Canvas dpr={[1, 2]} gl={{ alpha: true }} camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Starfield />
        <AstronautRig />
      </Canvas>

      <a
        href={CREDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="cosmic-hero-credit"
      >
        Astronaut model "Falling Spaceman (FanArt)" by wallmasterr — CC BY 4.0 — based on a design by Tenhun.
      </a>
    </div>
  );
}
