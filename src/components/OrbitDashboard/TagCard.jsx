// src/components/OrbitDashboard/TagCard.jsx
import React from "react";
// Phosphor icons (already used elsewhere in this app, e.g. UserProfile.jsx)
// — rounded, friendly, current-gen glyphs instead of react-bootstrap-icons'
// flatter/older-looking set. A large, varied pool (not just 6) so distinct
// tags never end up sharing the same icon — see TAG_THEMES below.
import {
  PiRocketLaunchFill, PiTargetFill, PiPuzzlePieceFill, PiChartLineUpFill,
  PiCompassFill, PiSparkleFill, PiBookOpenTextFill, PiLeafFill,
  PiShieldCheckFill, PiCircuitryFill, PiGlobeHemisphereWestFill, PiUsersThreeFill,
  PiLightningFill, PiGraduationCapFill, PiFlagBannerFoldFill, PiTrophyFill,
  PiGiftFill, PiKeyFill, PiLightbulbFilamentFill, PiMapTrifoldFill,
  PiAnchorSimpleFill, PiDiamondFill, PiCrownFill, PiMagicWandFill,
  PiPlanetFill, PiBinocularsFill, PiFlaskFill, PiGearFill,
  PiStarFourFill, PiPresentationChartFill, PiHandshakeFill, PiChatCircleDotsFill,
  PiFingerprintFill, PiInfinityFill, PiPathFill, PiTreeStructureFill,
} from "react-icons/pi";
import "./TagCard.css";

// A wide pool of distinct glyphs — every tag gets its own icon (indexed by
// position, no repeats until a tag list somehow exceeds this pool's size).
const ICON_POOL = [
  PiRocketLaunchFill, PiTargetFill, PiPuzzlePieceFill, PiChartLineUpFill,
  PiCompassFill, PiSparkleFill, PiBookOpenTextFill, PiLeafFill,
  PiShieldCheckFill, PiCircuitryFill, PiGlobeHemisphereWestFill, PiUsersThreeFill,
  PiLightningFill, PiGraduationCapFill, PiFlagBannerFoldFill, PiTrophyFill,
  PiGiftFill, PiKeyFill, PiLightbulbFilamentFill, PiMapTrifoldFill,
  PiAnchorSimpleFill, PiDiamondFill, PiCrownFill, PiMagicWandFill,
  PiPlanetFill, PiBinocularsFill, PiFlaskFill, PiGearFill,
  PiStarFourFill, PiPresentationChartFill, PiHandshakeFill, PiChatCircleDotsFill,
  PiFingerprintFill, PiInfinityFill, PiPathFill, PiTreeStructureFill,
];

// Gradients built ONLY from this app's own established accent hexes
// (--orbit-brand/rose/pink/mint/teal/sky/lavender in index.css — the exact
// same palette the streak badges and module-card accents already use)
// instead of a synthetic hue-wheel rotation, which drifted into off-brand
// orange/green territory the rest of the site never uses. Each pair
// combines two ADJACENT hues from that palette (teal→sky→brand→
// lavender→pink→rose→back to teal) so every gradient still looks cohesive.
const COLOR_THEMES = [
  { gradient: "linear-gradient(135deg, #7c6ef7 0%, #6f5fc0 100%)", glow: "rgba(124,110,247,0.4)" },
  { gradient: "linear-gradient(135deg, #3f7fc6 0%, #7c6ef7 100%)", glow: "rgba(63,127,198,0.4)" },
  { gradient: "linear-gradient(135deg, #2f9a90 0%, #3f7fc6 100%)", glow: "rgba(47,154,144,0.4)" },
  { gradient: "linear-gradient(135deg, #2f9e79 0%, #2f9a90 100%)", glow: "rgba(47,158,121,0.4)" },
  { gradient: "linear-gradient(135deg, #c8508f 0%, #6f5fc0 100%)", glow: "rgba(200,80,143,0.4)" },
  { gradient: "linear-gradient(135deg, #c8557c 0%, #c8508f 100%)", glow: "rgba(200,85,124,0.4)" },
  { gradient: "linear-gradient(135deg, #6f5fc0 0%, #3f7fc6 100%)", glow: "rgba(111,95,192,0.4)" },
];

// One theme per tag — the ICON always cycles through the full unique pool
// above; the COLOR cycles through the smaller on-brand palette (repeats
// are fine and expected for color, unlike the icon, since every repeat is
// still a real site accent color, not an arbitrary one).
const TAG_THEMES = ICON_POOL.map((Icon, i) => ({
  ...COLOR_THEMES[i % COLOR_THEMES.length],
  Icon,
}));

// tag: { _id, name } — compact tile: icon chip + name only, no description
// or module count. The per-tag icon+gradient pairing (indexed, no repeats
// within the pool) is what keeps this from reading as a generic label
// despite the small footprint.
export default function TagCard({ tag, index = 0, onClick }) {
  const theme = TAG_THEMES[index % TAG_THEMES.length];

  return (
    <button
      type="button"
      className="tagcard"
      style={{ "--tagcard-gradient": theme.gradient, "--tagcard-glow": theme.glow }}
      onClick={onClick}
    >
      <div className="tagcard__icon">
        <theme.Icon size={17} />
      </div>
      <span className="tagcard__title">{tag.name}</span>
    </button>
  );
}
