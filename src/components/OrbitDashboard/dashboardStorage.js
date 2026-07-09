// src/components/OrbitDashboard/dashboardStorage.js
// Pure helpers for the checklist -> calendar -> streak dependency.
// Persistence is localStorage-only: the backend has no per-day task/LeetCode
// model today, so the whole "activity history" lives on the client, keyed
// per user. See the "Behind the Scenes" write-up for the tradeoffs.

const STORAGE_PREFIX = "orbit_dashboard_history_";

export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const storageKey = (userId) => `${STORAGE_PREFIX}${userId || "guest"}`;

export const loadHistory = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveHistory = (userId, history) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(history));
  } catch {
    /* localStorage unavailable — history simply won't persist */
  }
};

// Merge a partial day entry (e.g. { read: true }) into today's record and persist it.
export const markDay = (userId, history, dateKey, patch) => {
  const nextEntry = { ...(history[dateKey] || {}), ...patch };
  const nextHistory = { ...history, [dateKey]: nextEntry };
  saveHistory(userId, nextHistory);
  return nextHistory;
};

// Rule 1 (calendar highlight + streak): ANY ONE of the three daily checklist
// tasks — Today's Read, Module Completion, or Idea Submission — was done that
// day. Relaxed from the old "read AND module" rule so the streak doesn't
// require clearing every task, matching the backend's verifyDailyStreak (1-of-3).
export const anyTaskDone = (entry) => !!(entry && (entry.read || entry.module || entry.idea));

// Rule 2 (calendar dot, informational only): no platform activity (idea
// submission) was logged that day. Doesn't affect the streak.
export const thirdTaskMissing = (entry) => !(entry && entry.idea);

// The streak depends ONLY on rule 1 per the product spec.
export const dayQualifies = (entry) => anyTaskDone(entry);

// Walk backward from today. If today hasn't qualified yet, it doesn't break the
// streak (the day isn't over) — counting simply starts from yesterday instead.
export const computeStreak = (history, today = new Date()) => {
  const cursor = new Date(today);
  if (!dayQualifies(history[toDateKey(cursor)])) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (dayQualifies(history[toDateKey(cursor)])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

// Sun-start month matrix for the calendar grid: array of weeks, each a 7-length
// array of { date, inMonth } cells (leading/trailing cells fill from adjacent months).
export const getMonthMatrix = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks = [];
  const cursor = new Date(gridStart);
  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      days.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
    if (cursor.getMonth() !== month && cursor > firstOfMonth) break;
  }
  return weeks;
};
