// src/components/hero3d/AstronautFallback.jsx
import React from "react";

// Shown via Suspense (while astronaut.glb is loading) and via
// CanvasErrorBoundary (while it's missing/corrupt) — a cheap wireframe
// icosahedron tinted with the app's --orbit-brand violet, so it reads as an
// intentional placeholder rather than a broken asset. AstronautRig drives its
// position/rotation exactly like the real model, so bob/tilt still demos.
export default function AstronautFallback() {
  return (
    <mesh>
      <icosahedronGeometry args={[0.9, 1]} />
      <meshStandardMaterial color="#9d91fa" wireframe />
    </mesh>
  );
}
