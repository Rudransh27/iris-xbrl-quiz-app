// src/components/QuizCard.jsx
// (no changes needed)

import React from "react";
import tomImg from "../assets/tom.png";
import "./QuizCard.css"; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const QuizCard = ({
  question,
  options,
  correctIndex,
  selectedOption,
  onSelect,
  answered,
  isCorrect,
  quizImage,
  explanation,
}) => (
  <div className="question-card">
    {quizImage && <img src={quizImage} alt="Quiz visual aid" className="quiz-question-image" />}
    <img src={tomImg} alt="Tom" className="tom-img" />

    <div className="quiz-question-text markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>
    </div>

    <div className="options-grid">
      {options.map((option, idx) => {
        let className = "option-button";
        if (answered) {
          if (idx === correctIndex) className += " correct";
          if (selectedOption === idx && idx !== correctIndex)
            className += " incorrect";
        } else if (selectedOption === idx) {
          className += " selected";
        }
        return (
          <button
            key={idx}
            className={className}
            onClick={() => onSelect(idx)}
            disabled={answered}
          >
            {option}
          </button>
        );
      })}
    </div>

    {answered && explanation && (
      <div className="quiz-explanation">
        <h4>Explanation:</h4>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      </div>
    )}
  </div>
);

export default QuizCard;