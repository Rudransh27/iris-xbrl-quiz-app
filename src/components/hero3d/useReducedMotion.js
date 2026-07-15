// src/components/hero3d/useReducedMotion.js
import { useEffect, useState } from "react";

// Live-subscribed prefers-reduced-motion check — the cosmic hero's idle bob/
// mouse-follow animation needs to react if the OS setting changes mid-session,
// not just at mount.
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e) => setReduced(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}
