// src/components/hero3d/HeroAstronaut.jsx
// A compact reuse of the 3D astronaut rig (Starfield + AstronautRig) for a
// hero banner's right-side panel — shared by the Home dashboard hero and
// the Learn page hero. Deliberately does NOT reuse CosmicHeroCanvas itself
// — that component is a full-bleed, always-opaque-dark backdrop meant to
// sit behind an entire hero section (see its own comment: "sits behind
// BOTH text and graphic columns"), which would paint over these pages' own
// galaxy-gradient hero background instead of sitting inside it. This
// renders just the transparent-clear-color <Canvas> + rig into a small
// fixed-size stage instead, mounting AstronautBoyModel (not the homepage's
// astronaut.glb) and positioned/scaled for that much smaller frame (the
// homepage's default position=[2.1, ...] assumes a wide full-bleed stage,
// not a ~230px panel).
import React from "react";
import { Canvas } from "@react-three/fiber";
import Starfield from "./Starfield";
import AstronautRig from "./AstronautRig";
import AstronautBoyModel from "./AstronautBoyModel";

export default function HeroAstronaut() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true }}
      camera={{ position: [0, 0, 5.5], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Starfield />
      <AstronautRig position={[0, -0.2, 0]} Model={AstronautBoyModel} />
    </Canvas>
  );
}
