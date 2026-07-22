// src/components/hero3d/AstronautModel.jsx
import React from "react";
import { useGLTF } from "@react-three/drei";

const MODEL_PATH = "/models/astronaut_boy.glb";

// Tuned against the actual file's glTF bounding box (parsed directly from
// its JSON chunk): native size ~2.60 x 3.07 x 2.45 (w,h,d), native center at
// [0, 1.07, 0.14] — the model's own origin sits near its lower third, not
// its visual center. SCALE brings its ~3.07 max dimension down to a
// comfortable ~2.3 world units; CENTER_OFFSET (-SCALE * native center)
// re-centers the scaled model on the primitive's local origin, so
// AstronautRig's group position/rotation pivot around the astronaut's
// visual center rather than its native (offset) pivot.
const SCALE = 0.75;
const CENTER_OFFSET = [0, -0.8, -0.11];

export default function AstronautModel() {
  const { scene } = useGLTF(MODEL_PATH);
  return <primitive object={scene} scale={SCALE} position={CENTER_OFFSET} />;
}

useGLTF.preload(MODEL_PATH);
