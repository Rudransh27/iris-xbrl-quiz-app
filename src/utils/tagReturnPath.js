// src/utils/tagReturnPath.js
// Where "exit this module" / "back to Learn" should land, carried end-to-end
// as query params from the Learn page into the module player:
//   ?path=<pathId>                 — opened from a Path (Learn → Tag → Path)
//   ?tag=<categoryId>&region=<id>  — legacy Tag -> Region -> Journey links
// Every consumer must build both the suffix and the back path from this one
// place instead of re-deriving them.
import { safeId, safeIdOrToken } from "./safeNav";

export function buildTagSuffix(rawTagId, rawRegionId, rawPathId) {
  // Values come from the URL — only well-formed ids survive (see safeNav.js).
  const pathId = safeId(rawPathId);
  const tagId = safeId(rawTagId);
  const regionId = safeIdOrToken(rawRegionId, "all");
  if (pathId) return `?path=${pathId}`;
  if (!tagId) return "";
  return regionId ? `?tag=${tagId}&region=${regionId}` : `?tag=${tagId}`;
}

export function buildLearnBackPath(rawTagId, rawRegionId, rawPathId) {
  const pathId = safeId(rawPathId);
  const tagId = safeId(rawTagId);
  const regionId = safeIdOrToken(rawRegionId, "all");
  if (pathId) return `/orbit/paths/${pathId}`;
  if (!tagId) return "/orbit/modules";
  return regionId ? `/orbit/tags/${tagId}/region/${regionId}` : `/orbit/tags/${tagId}`;
}
