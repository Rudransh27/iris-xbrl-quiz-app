// src/components/OrbitDashboard/HeroWelcome.jsx
import React, { Suspense, lazy, useMemo } from "react";
import { RocketTakeoffFill, Globe2 } from "react-bootstrap-icons";

// Lazy-loaded: pulls in @react-three/fiber/drei/three only once this hero
// actually mounts, not as part of the app's initial bundle.
const HeroAstronaut = lazy(() => import("../hero3d/HeroAstronaut"));

// Deterministic "random" star field — no Math.random() re-roll per render,
// generated once via useMemo so the twinkle positions stay stable while the
// rest of the dashboard re-renders around it. Exported so other hero-style
// banners (e.g. the Learn page hero) can reuse the exact same star pattern
// instead of duplicating this generator.
export function useStars(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${(i * 47) % 100}%`,
        left: `${(i * 83) % 100}%`,
        size: 1 + (i % 3),
        delay: `${(i % 10) * 0.4}s`,
        duration: `${2.6 + (i % 5) * 0.5}s`,
      })),
    [count]
  );
}

export default function HeroWelcome() {
  const stars = useStars(36);

  return (
    <div className="orbit-hero orbit-hero--split">
      <div className="orbit-hero__stars" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.id}
            className="orbit-hero__star"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration }}
          />
        ))}
      </div>
      <div className="orbit-hero__comet" aria-hidden="true" />

      <div className="orbit-hero__left">
        <span className="orbit-hero__eyebrow">
          <RocketTakeoffFill size={11} /> IRIS ORBIT
        </span>

        <h1 className="orbit-hero__heading">
          IRIS{" "}
          <span className="orbit-hero__orbit-word">
            <span className="orbit-hero__orbit-o">
              <span className="orbit-hero__o-glyph">O</span>
              <span className="orbit-hero__rings" aria-hidden="true">
                <span className="orbit-hero__ring orbit-hero__ring--1"><span className="orbit-hero__moon orbit-hero__moon--teal" /></span>
                <span className="orbit-hero__ring orbit-hero__ring--2"><span className="orbit-hero__moon orbit-hero__moon--pink" /></span>
                <span className="orbit-hero__ring orbit-hero__ring--3"><span className="orbit-hero__moon orbit-hero__moon--sky" /></span>
              </span>
            </span>
            RBIT
          </span>
        </h1>

        <p className="orbit-hero__subheading">
          You are orbiting through knowledge, hope you find something interesting today!
        </p>

        <p className="orbit-hero__caption">
          <Globe2 size={13} /> Chart your course · every module launches you further into orbit
        </p>
      </div>

      <div className="orbit-hero__astronaut" aria-hidden="true">
        <Suspense fallback={null}>
          <HeroAstronaut />
        </Suspense>
      </div>
    </div>
  );
}
