// src/components/OrbitDashboard/tagTheme.js
// One look per Tag, shared by every place a Tag appears (Learn chips, path
// cards, TagCard) so a Tag keeps the same icon and colour across the app.
// Indexed by the Tag's position in the server's order. Colours are the
// --cat-* category tokens — for telling Tags apart only, never meaning.
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

// Distinct glyphs — no two Tags share an icon until there are more Tags
// than this pool.
export const TAG_ICONS = [
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

// Matches the ui-icon-tile tone modifiers (ui-icon-tile--teal, …).
export const TAG_TONES = ["violet", "teal", "amber", "rose", "sky", "green"];

export function tagTheme(index = 0) {
  const i = Math.max(0, index);
  return { Icon: TAG_ICONS[i % TAG_ICONS.length], tone: TAG_TONES[i % TAG_TONES.length] };
}
