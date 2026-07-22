// src/components/hero3d/AstronautBoyModel.jsx
import React from "react";
import { useGLTF } from "@react-three/drei";

const MODEL_PATH = "/models/astronaut_boy.glb";

// Tuned against the actual file's glTF bounding box (computed by walking
// every mesh node's full transform matrix, not just top-level translation —
// this model bakes its geometry several units off-origin per-node, e.g.
// z≈-7.1 to -7.6, so a naive read of just the root node would miss it
// entirely). Real world-space bounds: size ≈ [1.73, 2.45, 1.23] (w,h,d),
// center ≈ [-0.05, 1.25, -7.20]. SCALE brings the ~2.45 max dimension down
// to a comfortable ~2.2 world units (matching AstronautModel's ~2.3
// target); CENTER_OFFSET (-SCALE * center) re-centers the scaled model on
// the primitive's local origin, so AstronautRig's group position/rotation
// pivot around the astronaut's visual center rather than its native
// (heavily offset) pivot.
const SCALE = 0.9;
const CENTER_OFFSET = [0.05, -1.12, 6.48];

export default function AstronautBoyModel() {
  const { scene } = useGLTF(MODEL_PATH);
  return <primitive object={scene} scale={SCALE} position={CENTER_OFFSET} />;
}

useGLTF.preload(MODEL_PATH);
