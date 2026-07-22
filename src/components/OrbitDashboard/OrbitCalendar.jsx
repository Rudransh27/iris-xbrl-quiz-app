// src/components/OrbitDashboard/OrbitCalendar.jsx
// Merged Activity + Daily Reads calendar: one compact widget that shows the
// streak/qualified-day history (from ActivityCalendar) AND lets the learner
// click through to that day's Daily Read when one was published (from
// DailyReadsCalendar) — replaces both components 1:1, same underlying rules,
// same props' data sources, just unified into a single card.
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RocketTakeoffFill, CheckLg } from "react-bootstrap-icons";
import { toDateKey, anyTaskDone, dailyReadDateKey, getMonthMatrix } from "./dashboardStorage";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Rotating pastel-rainbow fill per qualified day — purely decorative variety,
// not tied to which task(s) were done that day.
const ACCENTS = ["rose", "pink", "mint", "teal", "sky", "lavender", "lilac"];

export default function OrbitCalendar({ history, streak, reads, onSelectRead }) {
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

  const readsByDate = useMemo(() => {
    const map = {};
    (reads || []).forEach((read) => {
      const key = dailyReadDateKey(read);
      if (key) map[key] = read;
    });
    return map;
  }, [reads]);

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta) => {
    setMonthCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  return (
    <div className="orbit-card orbit-card--compact orbit-calendar-card">
      <h3 className="orbit-card__title orbit-card__title--tight">Activity Calendar</h3>

      <div className="orbit-calendar__streak">
        <RocketTakeoffFill size={20} color="var(--orbit-pink-text)" />
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
          const isToday = key === todayKey;
          const read = inMonth ? readsByDate[key] : null;
          const readId = read?._id || read?.id;
          const accent = ACCENTS[date.getDate() % ACCENTS.length];

          return (
            <div
              key={key}
              className={[
                "orbit-calendar__cell",
                !inMonth ? "orbit-calendar__cell--out" : "",
                qualified ? `orbit-calendar__cell--qualified orbit-calendar__cell--${accent}` : "",
                read ? "orbit-calendar__cell--has-read" : "",
                isToday ? "orbit-calendar__cell--today" : "",
              ].join(" ").trim()}
              role={read ? "button" : undefined}
              tabIndex={read ? 0 : undefined}
              title={read ? read.title : undefined}
              onClick={() => readId && onSelectRead && onSelectRead(readId)}
              onKeyDown={(e) => {
                if (read && (e.key === "Enter" || e.key === " ")) onSelectRead && onSelectRead(readId);
              }}
            >
              <span className="orbit-calendar__cell-daynum">{date.getDate()}</span>
              {qualified && <CheckLg className="orbit-calendar__cell-check" size={8} strokeWidth={1} aria-label="Streak criteria met" />}
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
          <span className="orbit-calendar__legend-swatch orbit-calendar__legend-swatch--read" />
          Read published — click to open
        </span>
      </div>
    </div>
  );
}
