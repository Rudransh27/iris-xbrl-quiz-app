// src/components/OrbitDashboard/dashboardStorage.js
// Pure helpers for the checklist -> calendar -> streak dependency.
//
// 🎯 UNIFIED SOURCE OF TRUTH: this used to also own a localStorage-only
// "activity history" (loadHistory/saveHistory/markDay/computeStreak) that
// was completely independent of the server's User.engagementHistory record
// — two separate write paths meant to represent the same thing, with
// nothing keeping them in sync. That's why the calendar could show
// different painted days than the account's real, cross-device streak (or
// even show painted days for an account whose server record was completely
// empty). The calendar/checklist now render directly from the server's
// engagementHistory (fetched by OrbitWorkspace, passed down as `streakData`)
// via engagementHistoryToMap below — there is no more separate client-only
// history to drift out of sync.

export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// UTC "YYYY-MM-DD" — matches the backend's Daily Read dateKey convention
// (new Date().toISOString().split("T")[0]), which is also what
// User.engagementHistory's streak entries use. Distinct from toDateKey
// above, which renders the LOCAL calendar day for the visual grid.
export const toUtcDateKey = (date) => new Date(date).toISOString().split("T")[0];

// A Daily Read's calendar day: its own dateKey if present, else derived
// from createdAt for records saved before dateKey existed.
export const dailyReadDateKey = (read) =>
  read?.dateKey || (read?.createdAt ? toUtcDateKey(read.createdAt) : null);

// Converts the server's engagementHistory shape
// ([{ date: "YYYY-MM-DD", qualifiesForStreak, actions: ['daily_read', ...] }, ...])
// into the { dateKey: { read, module, idea } } map the calendar and
// checklist render against.
export const engagementHistoryToMap = (engagementHistory) => {
  const map = {};
  (engagementHistory || []).forEach((entry) => {
    if (!entry?.date) return;
    const actions = entry.actions || [];
    map[entry.date] = {
      read: actions.includes("daily_read"),
      module: actions.includes("module_progress"),
      idea: actions.includes("idea_submission"),
    };
  });
  return map;
};

// Rule 1 (calendar highlight + streak): ANY ONE of the three daily checklist
// tasks — Today's Read, Module Completion, or Idea Submission — was done that
// day. Matches the backend's verifyDailyStreak (1-of-3) rule exactly, since
// both now read from the same underlying record.
export const anyTaskDone = (entry) => !!(entry && (entry.read || entry.module || entry.idea));

// Rule 2 (calendar dot, informational only): no platform activity (idea
// submission) was logged that day. Doesn't affect the streak.
export const thirdTaskMissing = (entry) => !(entry && entry.idea);

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
