// src/components/OrbitDashboard/NewsWidget.jsx
import React from "react";
import { Broadcast, ExclamationTriangleFill } from "react-bootstrap-icons";
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

export function NewsEmptyCard() {
  return (
    <div className="orbit-news-widget">
      <div className="orbit-news-widget__body">
        <span className="orbit-news-widget__tag">
          <Broadcast size={11} /> BROADCAST
        </span>
        <h3 className="orbit-news-widget__title">No announcements right now</h3>
        <p className="orbit-news-widget__text">Check back later for updates from your team.</p>
      </div>
    </div>
  );
}

// Single-post card — the piece NewsCarousel.jsx reuses per slide.
export function NewsCard({ news }) {
  if (!news) return <NewsEmptyCard />;

  const youtubeId = news.contentType === "video" ? getYouTubeEmbedUrl(news.mediaUrl) : null;

  return (
    <div className={`orbit-news-widget ${news.isBreaking ? "orbit-news-widget--breaking" : ""}`}>
      <div className="orbit-news-widget__body">
        {news.isBreaking ? (
          <span className="orbit-news-widget__tag orbit-news-widget__tag--breaking">
            <ExclamationTriangleFill size={11} /> BREAKING NEWS
          </span>
        ) : (
          <span className="orbit-news-widget__tag">
            <Broadcast size={11} /> BROADCAST
          </span>
        )}

        {news.isBreaking ? (
          <div className="orbit-news-widget__marquee">
            <div className="orbit-news-widget__marquee-track">
              <span>{news.title} — {news.content}</span>
              <span aria-hidden="true">{news.title} — {news.content}</span>
            </div>
          </div>
        ) : (
          <>
            <h3 className="orbit-news-widget__title">{news.title}</h3>
            <p className="orbit-news-widget__text">{news.content}</p>
          </>
        )}

        {news.contentType === "image" && news.mediaUrl && (
          <img className="orbit-news-widget__media-image" src={news.mediaUrl} alt={news.title} />
        )}

        {news.contentType === "video" && news.mediaUrl && (
          <div className="orbit-news-widget__media-video">
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
      </div>
    </div>
  );
}

// Kept as a default export for any remaining single-post usage — renders one
// post via NewsCard. The dashboard now renders NewsCarousel instead.
export default function NewsWidget({ news }) {
  return <NewsCard news={news} />;
}
