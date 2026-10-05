// src/components/OrbitDashboard/NewsCarousel.jsx
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { NewsCard, NewsEmptyCard } from "./NewsWidget";
import "./NewsCarousel.css";

const SLIDE_TRANSITION = { type: "spring", stiffness: 420, damping: 38 };

// Same block header as every other dashboard section: eyebrow + title on
// the left, actions (here the prev/next arrows) on the right.
function NewsHead({ children }) {
  return (
    <div className="orbit-section-head">
      <div className="orbit-section-head__text">
        <span className="ui-eyebrow">Announcements</span>
        <h2 className="orbit-section-head__title">News from across IRIS</h2>
      </div>
      {children && <div className="orbit-section-head__actions">{children}</div>}
    </div>
  );
}

export default function NewsCarousel({ newsFeed }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const posts = Array.isArray(newsFeed) ? newsFeed : [];

  if (posts.length === 0) {
    return (
      <section className="orbit-news-section">
        <NewsHead />
        <NewsEmptyCard />
      </section>
    );
  }

  const activeIndex = ((index % posts.length) + posts.length) % posts.length;
  const active = posts[activeIndex];

  const goTo = (nextIndex, dir) => {
    setDirection(dir);
    setIndex(nextIndex);
  };

  const goPrev = () => goTo(activeIndex - 1, -1);
  const goNext = () => goTo(activeIndex + 1, 1);

  return (
    <section className="orbit-news-section">
      <NewsHead>
        {posts.length > 1 && (
          <>
            <span className="orbit-news-carousel__count" aria-live="polite">
              <strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(posts.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              className="orbit-news-carousel__arrow orbit-news-carousel__arrow--prev ui-btn ui-btn--secondary ui-btn--sm ui-btn--icon"
              onClick={goPrev}
              aria-label="Previous announcement"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="orbit-news-carousel__arrow orbit-news-carousel__arrow--next ui-btn ui-btn--secondary ui-btn--sm ui-btn--icon"
              onClick={goNext}
              aria-label="Next announcement"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </NewsHead>

      <div className="orbit-news-carousel">
        <div className="orbit-news-carousel__viewport">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={active._id || activeIndex}
              custom={direction}
              initial={{ x: direction * 48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -48, opacity: 0 }}
              transition={SLIDE_TRANSITION}
            >
              <NewsCard news={active} />
            </motion.div>
          </AnimatePresence>
        </div>

        {posts.length > 1 && (
          <div className="orbit-news-carousel__dots">
            {posts.map((post, i) => (
              <button
                key={post._id || i}
                type="button"
                className={`orbit-news-carousel__dot ${i === activeIndex ? "orbit-news-carousel__dot--active" : ""} ${i < activeIndex ? "orbit-news-carousel__dot--seen" : ""}`}
                onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
                aria-label={`Go to announcement ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
