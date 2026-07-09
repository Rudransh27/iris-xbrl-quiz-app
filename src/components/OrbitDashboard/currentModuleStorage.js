// src/components/OrbitDashboard/currentModuleStorage.js
// Persists which module (and, when relevant, which topic within it) the user
// last explicitly opened. Mirrors dashboardStorage.js's conventions — the
// backend has no per-user "current module" field, so this lives client-side.

const STORAGE_PREFIX = "orbit_current_module_";

const storageKey = (userId) => `${STORAGE_PREFIX}${userId || "guest"}`;

export const getCurrentModule = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null; // { moduleId, topicId, updatedAt }
  } catch {
    return null;
  }
};

export const setCurrentModule = (userId, { moduleId, topicId = null }) => {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ moduleId, topicId, updatedAt: Date.now() })
    );
  } catch {
    /* localStorage unavailable — selection simply won't persist */
  }
};
