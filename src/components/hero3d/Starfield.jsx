// src/components/hero3d/Starfield.jsx
import React, { useEffect, useState } from "react";
import { Stars } from "@react-three/drei";
import useReducedMotion from "./useReducedMotion";

const MOBILE_BREAKPOINT = "(max-width: 991px)"; // matches HeroEntryCard.css's split-layout breakpoint

export default function Starfield() {
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT).matches
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (e) => setIsMobile(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return (
    <Stars
      radius={100}
      depth={50}
      count={isMobile ? 1300 : 4000}
      factor={4}
      saturation={0}
      fade
      speed={reducedMotion ? 0 : 1}
    />
  );
}
