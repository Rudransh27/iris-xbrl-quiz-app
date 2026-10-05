// src/components/OrbitDashboard/NewsWidget.jsx
import React, { useState } from "react";
import { Broadcast, Building, Globe2, LightningChargeFill } from "react-bootstrap-icons";
import "./NewsWidget.css";

// Same YouTube-URL-vs-native-file heuristic already used by VideoCard.jsx —
// reused verbatim rather than inventing a second video-embedding approach.
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  return null;
}

// Publish date split for the masthead ("13" / "Jul 2026") plus a relative
// label for the meta row ("2 months ago").
function formatNewsDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const monthYear = date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const diffSec = (date.getTime() - Date.now()) / 1000;
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  let relative = "just now";
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs) {
      relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(diffSec / secs), unit);
      break;
    }
  }
  return { day, monthYear, relative, iso: date.toISOString() };
}

const LONG_TEXT = 220;

export function NewsEmptyCard() {
  return (
    <article className="orbit-news orbit-news--empty">
      <div className="orbit-news__masthead">
        <span className="orbit-news__signal" aria-hidden="true"><Broadcast size={18} /></span>
      </div>
      <div className="orbit-news__content">
        <div className="orbit-news__meta">
          <span className="orbit-news__tag ui-badge ui-badge--accent">
            <Broadcast size={11} /> BROADCAST
          </span>
        </div>
        <h3 className="orbit-news__title">No announcements right now</h3>
        <p className="orbit-news__text">Check back later for updates from your team.</p>
      </div>
      <Broadcast className="orbit-news__watermark" size={150} aria-hidden="true" />
    </article>
  );
}

// Single-post card — the piece NewsCarousel.jsx reuses per slide.
export function NewsCard({ news }) {
  const [expanded, setExpanded] = useState(false);
  if (!news) return <NewsEmptyCard />;

  const youtubeId = news.contentType === "video" ? getYouTubeEmbedUrl(news.mediaUrl) : null;
  const hasMedia = (news.contentType === "image" || news.contentType === "video") && !!news.mediaUrl;
  const when = formatNewsDate(news.createdAt);
  const isLong = (news.content || "").length > LONG_TEXT;
  const ScopeIcon = news.scope === "Global" ? Globe2 : Building;

  return (
    <article
      className={`orbit-news ${news.isBreaking ? "orbit-news--breaking" : ""} ${hasMedia ? "orbit-news--media" : ""}`}
    >
      <div className="orbit-news__masthead">
        <span className="orbit-news__signal" aria-hidden="true">
          {news.isBreaking ? <LightningChargeFill size={18} /> : <Broadcast size={18} />}
        </span>
        {when && (
          <time className="orbit-news__date" dateTime={when.iso}>
            <span className="orbit-news__day">{when.day}</span>
            <span className="orbit-news__month">{when.monthYear}</span>
          </time>
        )}
      </div>

      <div className="orbit-news__content">
        <div className="orbit-news__meta">
          {news.isBreaking ? (
            <span className="orbit-news__tag orbit-news__tag--breaking ui-badge ui-badge--danger">
              <span className="orbit-news__live-dot" aria-hidden="true" /> BREAKING NEWS
            </span>
          ) : (
            <span className="orbit-news__tag ui-badge ui-badge--accent">
              <Broadcast size={11} /> BROADCAST
            </span>
          )}
          {news.scope && (
            <span className="orbit-news__chip">
              <ScopeIcon size={11} /> {news.scope}
            </span>
          )}
          {when && <span className="orbit-news__time">{when.relative}</span>}
        </div>

        <h3 className="orbit-news__title">{news.title}</h3>
        <p className={`orbit-news__text ${expanded ? "" : "orbit-news__text--clamped"}`}>{news.content}</p>
        {isLong && (
          <button type="button" className="orbit-news__more ui-btn ui-btn--link ui-btn--sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {news.contentType === "image" && news.mediaUrl && (
        <img className="orbit-news__media" src={news.mediaUrl} alt={news.title} />
      )}

      {news.contentType === "video" && news.mediaUrl && (
        <div className="orbit-news__media orbit-news__media--video">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
              title={news.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video src={news.mediaUrl} controls />
          )}
        </div>
      )}

      {!hasMedia && <Broadcast className="orbit-news__watermark" size={150} aria-hidden="true" />}
    </article>
  );
}

// Kept as a default export for any remaining single-post usage — renders one
// post via NewsCard. The dashboard now renders NewsCarousel instead.
export default function NewsWidget({ news }) {
  return <NewsCard news={news} />;
}
