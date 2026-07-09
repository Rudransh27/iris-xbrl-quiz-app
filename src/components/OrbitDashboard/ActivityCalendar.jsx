// src/components/OrbitDashboard/ActivityCalendar.jsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Fire, CheckLg } from "react-bootstrap-icons";
import { toDateKey, anyTaskDone, thirdTaskMissing, getMonthMatrix } from "./dashboardStorage";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ActivityCalendar({ history, streak }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const today = new Date();
  const todayKey = toDateKey(today);

  const weeks = useMemo(
    () => getMonthMatrix(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor]
  );

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta) => {
    setMonthCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  return (
    <div className="orbit-card orbit-card--compact">
      <h3 className="orbit-card__title orbit-card__title--tight">Activity Calendar</h3>

      <div className="orbit-calendar__streak">
        <Fire size={22} color="var(--amber-glow)" />
        <div>
          <div className="orbit-calendar__streak-num">{streak}</div>
          <div className="orbit-calendar__streak-label">Day Consistency Streak</div>
        </div>
      </div>

      <div className="orbit-calendar__nav">
        <button className="orbit-calendar__nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={12} />
        </button>
        <span className="orbit-calendar__month-label">{monthLabel}</span>
        <button className="orbit-calendar__nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="orbit-calendar__grid">
        {WEEKDAYS.map((w, i) => (
          <div key={`wd-${i}`} className="orbit-calendar__weekday">{w}</div>
        ))}
        {weeks.flat().map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const entry = history[key];
          const qualified = anyTaskDone(entry);
          const missedActivity = date <= today && thirdTaskMissing(entry);
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={[
                "orbit-calendar__cell",
                !inMonth ? "orbit-calendar__cell--out" : "",
                qualified ? "orbit-calendar__cell--qualified" : "",
                isToday ? "orbit-calendar__cell--today" : "",
              ].join(" ").trim()}
            >
              {qualified ? (
                <>
                  <span className="orbit-calendar__cell-daynum">{date.getDate()}</span>
                  <CheckLg size={12} strokeWidth={1} aria-label="Streak criteria met" />
                </>
              ) : (
                date.getDate()
              )}
              {missedActivity && inMonth && <span className="orbit-calendar__cell-dot" />}
            </div>
          );
        })}
      </div>

      <div className="orbit-calendar__legend">
        <span className="orbit-calendar__legend-item">
          <span className="orbit-calendar__legend-swatch orbit-calendar__legend-swatch--check">
            <CheckLg size={7} />
          </span>
          Any daily task done
        </span>
        <span className="orbit-calendar__legend-item">
          <span className="orbit-calendar__legend-swatch" style={{ background: "var(--honey-bronze)" }} />
          No platform activity logged
        </span>
      </div>
    </div>
  );
}
