// src/utils/tagReturnPath.js
// Where "exit this module" / "back to Learn" should land when the session
// started from the Tag -> Region -> Journey drill-down (ModuleJourney.jsx).
// Carried end-to-end as ?tag=<categoryId>&region=<regionId> query params —
// dropping the region here is what used to send learners back to the
// region-picker (RegionSelect) one level up instead of straight back to the
// exact journey path they came from, so every consumer must build both the
// suffix and the back path from this one place instead of re-deriving them.
export function buildTagSuffix(tagId, regionId) {
  if (!tagId) return "";
  return regionId ? `?tag=${tagId}&region=${regionId}` : `?tag=${tagId}`;
}

export function buildLearnBackPath(tagId, regionId) {
  if (!tagId) return "/orbit/modules";
  return regionId ? `/orbit/tags/${tagId}/region/${regionId}` : `/orbit/tags/${tagId}`;
}
