import React, { useState } from "react";
import MovieTicketCard from "../components/MovieTicketCard";
import Quiz from "./Quiz";
import { topics } from "../data/topics";
import "./XbrlTrail.css";

// Backgrounds for each card (cycled if more than 7)
const happyDarkBackgrounds = [
  "linear-gradient(135deg, #450000ff 70%, #ff3b3bff 100%)",
  "linear-gradient(135deg, #01451aff 70%, #4aff18ff 100%)",
  "linear-gradient(135deg, #4f025bff 70%, #b453ffff 100%)",
  "linear-gradient(135deg, #025948ff 70%, #47edffff 100%)",
  "linear-gradient(135deg, #60003bff 70%, #e300d0ff 100%)",
  "linear-gradient(135deg, #5c2104ff 70%, #ff8206ff 100%)",
  "linear-gradient(135deg, #00090cff 70%, #7ac1ffff 100%)",
];

export default function XbrlTrail() {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null); // null = no quiz open

  // Open any quiz on click
  const handleCardClick = (index) => {
    setCurrentTopicIndex(index); // Open the quiz, no lock
  };

  // Called when quiz completes or exits
  const handleQuizEnd = () => {
    setCurrentTopicIndex(null); // Return to card grid
  };

  // If quiz is currently open, render it
  if (currentTopicIndex !== null && topics[currentTopicIndex]) {
    return (
      <Quiz
        content={topics[currentTopicIndex].content}
        onComplete={handleQuizEnd}
      />
    );
  }

  // Render the card trail grid, ALL cards unlocked
  return (
    <div className="trail-row-grid">
      {topics.map((topic, index) => (
        <MovieTicketCard
          key={topic.id}
          image={topic.image}
          title={topic.title}
          // (optional: visually mark selected card or "done" cards if you wish,
          // but status is not required for unlocking)
          background={happyDarkBackgrounds[index % happyDarkBackgrounds.length]}
          onClick={() => handleCardClick(index)}
        />
      ))}
    </div>
  );
}
