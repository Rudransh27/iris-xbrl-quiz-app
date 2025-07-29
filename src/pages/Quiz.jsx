// src/pages/Quiz.jsx
import React, { useState, useEffect } from "react";
import "./Quiz.css";
import LearningCard from "../components/LearningCard";
import QuizCard from "../components/QuizCard";
import CodeCard from "../components/CodeCard";
import TopBar from "../components/TopBar";
import * as validators from "../utils/validators";
import { Progress } from 'antd';
import QuizResults from "../components/QuizResults";

const TEMP_QUIZ_IMAGE = "https://via.placeholder.com/600x200/3949ab/ffffff?text=Quiz+Question+Image";

const Quiz = ({ content, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userCodeAnswer, setUserCodeAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [chances, setChances] = useState(5);

  const current = content[currentIndex];
  // Calculate total number of *gradable* questions (quiz or code)
  const totalQuizQuestions = content.filter(item => item.type === 'quiz' || item.type === 'code').length;

  // Calculate the progress based on ALL content items for the progress bar
  const progressPercent = ((currentIndex + 1) / content.length) * 100;

  const showPrev = currentIndex > 0;

  const resetCardState = () => {
    setAnswered(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setUserCodeAnswer("");
    setValidationError(null);
  };

  const handleAction = () => {
    if (current["type"] === "knowledge") {
      if (currentIndex < content.length - 1) {
        setCurrentIndex((idx) => idx + 1);
        resetCardState();
      } else {
        // If it's the last knowledge card, and there are no quiz/code cards after it,
        // then the quiz is finished. Otherwise, it will continue to the next item.
        const remainingGradable = content.slice(currentIndex + 1).filter(item => item.type === 'quiz' || item.type === 'code').length;
        if (remainingGradable === 0) {
            setQuizFinished(true);
        } else {
            setCurrentIndex((idx) => idx + 1);
            resetCardState();
        }
      }
      return;
    }

    // Handle quiz and code questions
    if (!answered) {
      let correct = false;

      if (current["type"] === "quiz") {
        correct = selectedOption === current["correctIndex"];
      } else if (current["type"] === "code") {
        if (current["validator"] && validators[current["validator"]]) {
          const validation = validators[current["validator"]](userCodeAnswer);
          correct = validation.isCorrect;
          if (!correct) setValidationError(validation.error);
          else setValidationError(null);
        } else if (current["correctAnswer"]) {
          correct = userCodeAnswer
            .toLowerCase()
            .includes(current["correctAnswer"].toLowerCase());
        }
      }

      setIsCorrect(correct);
      setAnswered(true);

      if (correct) {
        setScore((prev) => prev + 1);
      } else {
        setChances((prev) => Math.max(prev - 1, 0));
      }
    } else { // If already answered, move to next or finish
      if (currentIndex < content.length - 1) {
        setCurrentIndex((idx) => idx + 1);
        resetCardState();
      } else {
        // If it's the last quiz/code card, set quizFinished to true
        setQuizFinished(true);
      }
    }
  };

  const handlePrev = () => {
    if (!showPrev) return;
    setCurrentIndex((idx) => idx - 1);
    resetCardState();
  };

  const handleExit = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to leave the quest? Your progress will not be counted."
    );
    if (confirmExit) {
      onComplete(false);
    }
  };

  // Render QuizResults component if quiz is finished
  if (quizFinished) {
    return (
      <QuizResults
        score={score}
        totalQuestions={totalQuizQuestions} // Pass the filtered total here
        onReturn={() => onComplete(true)}
      />
    );
  }

  // Render the quiz content if not finished
  return (
    <div className="quiz-container">
      <div className="top-fixed-elements">
        <div className="quiz-status-bar1">
          <button className="exit-button" onClick={handleExit} title="Exit">
            ×
          </button>

          <div className="quiz-progress-container">
            <Progress
              percent={Math.round(progressPercent)}
              strokeColor="linear-gradient(90deg, var(--primary-blue-gradient-start) 0%, var(--primary-blue-gradient-end) 100%)"
              strokeWidth={19}
              showInfo={false}
            />
          </div>

          <div
            className="chances-container"
            aria-label={`You have ${chances} chances left`}
          >
            <span className="heart-icon">❤️</span>
            <span className="chances-count">{chances}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      {current["type"] === "knowledge" && (
        <LearningCard
          title={current["title"]}
          text={current["text"]}
          image={current["image"]}
          imageSize={current["imageSize"] || "small"}
        />
      )}

      {current["type"] === "quiz" && (
        <QuizCard
          question={current["question"]}
          options={current["options"]}
          correctIndex={current["correctIndex"]}
          selectedOption={selectedOption}
          onSelect={setSelectedOption}
          answered={answered}
          isCorrect={isCorrect}
          quizImage={TEMP_QUIZ_IMAGE}
        />
      )}

      {current["type"] === "code" && (
        <CodeCard
          title={current["title"]}
          taxonomyCode={current["taxonomy"]}
          instanceCode={current["code"]}
          question={current["question"]}
          explanation={answered && isCorrect ? current["explanation"] : null}
          userAnswer={userCodeAnswer}
          onAnswer={answered ? () => {} : setUserCodeAnswer}
          validationError={validationError}
          isCorrect={isCorrect}
        />
      )}

      <div className="nav-buttons">
        {showPrev && (
          <button className="nav-button" onClick={handlePrev}>
            Back
          </button>
        )}

        {/* Conditional rendering for the main action button */}
        {(
          (current["type"] === "quiz" && selectedOption !== null) ||
          (current["type"] === "code" && userCodeAnswer.trim()) ||
          (current["type"] === "knowledge" && currentIndex < content.length - 1) // Only show continue for knowledge if not the last item
        ) && (
          <button className="nav-button" onClick={handleAction}>
            {current["type"] === "knowledge"
              ? "Continue"
              : answered
              ? "Continue"
              : "Check"}
          </button>
        )}

        {/* 'Finish' button for the last knowledge card IF no gradable questions follow it */}
        {current["type"] === "knowledge" && currentIndex === content.length - 1 && totalQuizQuestions === 0 && (
            <button className="nav-button" onClick={() => setQuizFinished(true)}>
                Finish
            </button>
        )}

        {/* This condition ensures the last gradable question (quiz/code) gets a "Finish" or "Continue" button
            after being answered, even if it's the very last item in content. */}
        {current["type"] !== "knowledge" && answered && currentIndex === content.length - 1 && (
             <button className="nav-button" onClick={() => setQuizFinished(true)}>
                Finish
            </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;