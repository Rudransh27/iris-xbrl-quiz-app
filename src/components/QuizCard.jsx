import React from "react";
import tomImg from "../assets/tom.png"; // Your existing Tom image
import "../pages/Quiz.css"; // Ensure Quiz.css styles are applied
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
  quizImage, // Add quizImage prop here
}) => (
  <div className="question-card">
    {/* Display the quizImage if provided */}
    {/* {quizImage && <img src={quizImage} alt="Quiz visual aid" className="quiz-question-image" />} */}

    {/* Your existing Tom image */}
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
            onClick={() => !answered && onSelect(idx)}
            disabled={answered}
          >
            {option}
          </button>
        );
      })}
    </div>
    {/* Feedback image after checking - commented out as in your provided code */}
    {/* {answered && (
      <div className="quiz-feedback-img-area">
        {isCorrect ? (
          <img
            src={happyJerryImg}
            alt="Jerry is happy!"
            className="feedback-img"
            style={{ marginTop: "1rem", maxHeight: 100 }}
          />
        ) : (
          <img
            src={caughtJerryImg}
            alt="Jerry was caught by Tom!"
            className="feedback-img"
            style={{ marginTop: "1rem", maxHeight: 100 }}
          />
        )}
      </div>
    )} */}
  </div>
);

export default QuizCard;