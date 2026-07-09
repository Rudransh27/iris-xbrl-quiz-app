// src/components/OrbitDashboard/TodaysReadBanner.jsx
import React from "react";
import { Journals, ArrowRight } from "react-bootstrap-icons";

export default function TodaysReadBanner({ todaysRead, onRead }) {
  if (!todaysRead) {
    return (
      <div className="orbit-read-banner">
        <div className="orbit-read-banner__ring" style={{ width: 260, height: 260, right: -80, top: -80 }} />
        <div className="orbit-read-banner__body">
          <span className="orbit-read-banner__tag">TODAY'S READ</span>
          <h3 className="orbit-read-banner__title">Nothing queued up yet</h3>
          <p className="orbit-read-banner__excerpt">Check back shortly — a new read for today is on its way.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orbit-read-banner">
      <div className="orbit-read-banner__ring" style={{ width: 300, height: 300, right: -100, top: -100 }} />
      <div className="orbit-read-banner__ring" style={{ width: 160, height: 160, right: 40, bottom: -80 }} />
      <div className="orbit-read-banner__body">
        <span className="orbit-read-banner__tag">
          <Journals size={11} /> TODAY'S READ
        </span>
        <h3 className="orbit-read-banner__title">{todaysRead.title}</h3>
        {todaysRead.content && (
          <p className="orbit-read-banner__excerpt">{todaysRead.content.substring(0, 160)}…</p>
        )}
      </div>
      <button className="orbit-read-banner__cta" onClick={onRead}>
        Read Now <ArrowRight size={14} />
      </button>
    </div>
  );
}
