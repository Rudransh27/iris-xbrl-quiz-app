// src/components/hero3d/AstronautRig.jsx
import React, { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import AstronautModel from "./AstronautModel";
import AstronautFallback from "./AstronautFallback";
import CanvasErrorBoundary from "./CanvasErrorBoundary";
import useReducedMotion from "./useReducedMotion";

const BASE_Y = -0.3;
const IS_COARSE_POINTER =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

// Owns the idle bob/yaw + mouse-follow tilt on a <group> wrapper, so the same
// animation applies identically whether the real model or the placeholder is
// currently mounted inside it (neither AstronautModel nor AstronautFallback
// carries any animation logic of their own). `Model` defaults to the
// original astronaut.glb loader (AstronautModel) so the homepage's existing
// CosmicHeroCanvas usage is unaffected — pass a different one (e.g.
// AstronautBoyModel) to swap the mounted figure without touching this rig.
export default function AstronautRig({ position = [2.1, BASE_Y, 0], Model }) {
  const groupRef = useRef();
  const reducedMotion = useReducedMotion();
  const AstronautComponent = Model || AstronautModel;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (reducedMotion) {
      // Static, pleasant pose — no bob, no tilt.
      group.position.y = position[1];
      group.rotation.x = 0;
      group.rotation.y = 0;
      return;
    }

    group.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.15;

    const idleYaw = Math.sin(state.clock.elapsedTime * 0.25) * 0.25;

    if (IS_COARSE_POINTER) {
      // No persistent cursor on touch devices — idle motion only.
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0, 4, delta);
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, idleYaw, 4, delta);
      return;
    }

    const targetX = state.pointer.y * 0.25;
    const targetY = idleYaw + state.pointer.x * 0.35;
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetX, 4, delta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetY, 4, delta);
  });

  return (
    <group ref={groupRef} position={position}>
      <CanvasErrorBoundary fallback={<AstronautFallback />}>
        <Suspense fallback={<AstronautFallback />}>
          <AstronautComponent />
        </Suspense>
      </CanvasErrorBoundary>
    </group>
  );
}
