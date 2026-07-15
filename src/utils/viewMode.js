// src/utils/viewMode.js
//
// Single source of truth for the learner/admin/superadmin view-mode toggle
// (used by OrbitShell.jsx, and formerly duplicated — with a bug — in
// Layout.jsx). View mode must NEVER be trusted from storage alone:
// resolveViewMode always re-derives it against the CURRENT user's actual
// role, so a stale or shared value can never grant a mode that role isn't
// allowed to see. A "user"-role account always resolves to "learner", full
// stop, regardless of anything saved in localStorage.
export function resolveViewMode(role, saved) {
  if (role === "superadmin") {
    return saved === "admin" || saved === "learner" ? saved : "superadmin";
  }
  if (role === "admin") {
    return saved === "learner" ? "learner" : "admin";
  }
  return "learner";
}

// Scoped per user id — a shared/global key let one account's chosen view
// mode leak into whichever DIFFERENT account next logged in on the same
// browser (an admin picks "Admin Panel", then a regular user logs in on the
// same machine and inherits "admin" on mount). This is exactly the bug that
// motivated this file.
export function viewModeStorageKey(userId) {
  return userId ? `orbit_view_mode:${userId}` : null;
}
