// src/utils/tagReturnPath.js
// Where "exit this module" / "back to Learn" should land, carried end-to-end
// as query params from the Learn page into the module player:
//   ?path=<pathId>                 — opened from a Path (Learn → Tag → Path)
//   ?tag=<categoryId>&region=<id>  — legacy Tag -> Region -> Journey links
// Every consumer must build both the suffix and the back path from this one
// place instead of re-deriving them.
export function buildTagSuffix(tagId, regionId, pathId) {
  if (pathId) return `?path=${pathId}`;
  if (!tagId) return "";
  return regionId ? `?tag=${tagId}&region=${regionId}` : `?tag=${tagId}`;
}

export function buildLearnBackPath(tagId, regionId, pathId) {
  if (pathId) return `/orbit/paths/${pathId}`;
  if (!tagId) return "/orbit/modules";
  return regionId ? `/orbit/tags/${tagId}/region/${regionId}` : `/orbit/tags/${tagId}`;
}
