// src/components/OrbitDashboard/NewsCarousel.jsx
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { NewsCard, NewsEmptyCard } from "./NewsWidget";
import "./NewsCarousel.css";

const SLIDE_TRANSITION = { type: "spring", stiffness: 420, damping: 38 };

export default function NewsCarousel({ newsFeed }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const posts = Array.isArray(newsFeed) ? newsFeed : [];

  if (posts.length === 0) return <NewsEmptyCard />;

  const activeIndex = ((index % posts.length) + posts.length) % posts.length;
  const active = posts[activeIndex];

  const goTo = (nextIndex, dir) => {
    setDirection(dir);
    setIndex(nextIndex);
  };

  const goPrev = () => goTo(activeIndex - 1, -1);
  const goNext = () => goTo(activeIndex + 1, 1);

  return (
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
        <>
          <button
            type="button"
            className="orbit-news-carousel__arrow orbit-news-carousel__arrow--prev"
            onClick={goPrev}
            aria-label="Previous announcement"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="orbit-news-carousel__arrow orbit-news-carousel__arrow--next"
            onClick={goNext}
            aria-label="Next announcement"
          >
            <ChevronRight size={16} />
          </button>

          <div className="orbit-news-carousel__dots">
            {posts.map((post, i) => (
              <button
                key={post._id || i}
                type="button"
                className={`orbit-news-carousel__dot ${i === activeIndex ? "orbit-news-carousel__dot--active" : ""}`}
                onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
                aria-label={`Go to announcement ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
