// src/components/QuizCard.jsx
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
}) => {
  // 🛡️ SAFETY SHIELD: Fallback to an empty array to prevent map() crashes on missing data
  const safeOptions = options || [];

  return (
    <div className="question-card">
      {quizImage && <img src={quizImage} alt="Quiz visual aid" className="quiz-question-image" />}
      <img src={tomImg} alt="Tom" className="tom-img" />

      <div className="quiz-question-text markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>
      </div>

      <div className="options-grid">
        {safeOptions.length > 0 ? (
          safeOptions.map((option, idx) => {
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
          })
        ) : (
          // ⚠️ Graceful user feedback instead of a hard application crash
          <div className="text-muted small p-3 border rounded font-monospace text-center w-100 bg-light">
            ⚠️ [DATA EXCEPTION]: No interaction options found for this quiz card.
          </div>
        )}
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
};

export default QuizCard;