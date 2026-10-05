// src/utils/safeNav.js
//
// Navigation hardening. Any value that reaches navigate()/<Link to> from the
// URL (route params, ?query) or from storage is validated here first, so a
// crafted link can only ever produce an in-app path:
//   - entity ids must be MongoDB ObjectIds (24 hex chars);
//   - stored "return to" paths must be same-site app paths.

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** The id if it is a valid ObjectId, otherwise null. */
export function safeId(value) {
  return typeof value === "string" && OBJECT_ID.test(value) ? value : null;
}

/** Like safeId, but also accepts the given literal tokens (e.g. "all"). */
export function safeIdOrToken(value, ...tokens) {
  if (typeof value === "string" && tokens.includes(value)) return value;
  return safeId(value);
}

/**
 * A same-site app path ("/orbit/...") or the fallback. Rejects absolute and
 * protocol-relative URLs ("https://…", "//host", "/\host"), schemes such as
 * "javascript:", and control characters.
 */
export function safeInternalPath(value, fallback = "/orbit") {
  if (typeof value !== "string" || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}

/** Reads and clears the post-login redirect saved by the route guards. */
export function takeRedirectPath(fallback) {
  let stored = null;
  try {
    stored = localStorage.getItem("redirectPath");
    localStorage.removeItem("redirectPath");
  } catch { /* storage blocked */ }
  return safeInternalPath(stored, fallback);
}
