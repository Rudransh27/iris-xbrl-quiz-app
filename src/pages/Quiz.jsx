// src/pages/Quiz.jsx

import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Quiz.css";
import LearningCard from "../components/LearningCard";
import QuizCard from "../components/QuizCard";
import CodeCard from "../components/CodeCard";
import QuizResults from "../components/QuizResults";
import { Progress } from "antd";
import api from "../admin/services/api";
import AuthContext from "../context/AuthContext";
import * as validators from "../utils/validators";
import Swal from 'sweetalert2'; // Import SweetAlert2

const Quiz = () => {
  const { moduleId, topicId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserXP, refreshUser } = useContext(AuthContext);

  const [quizState, setQuizState] = useState({
    content: null,
    loading: true,
    currentIndex: 0,
    selectedOption: null,
    userCodeAnswer: "",
    answered: false,
    isCorrect: null,
    validationError: null,
    score: 0,
    chances: 5,
    quizFinished: false,
    topicXP: 0, // XP earned in this topic
  });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchTopicContent = async () => {
      try {
        const topicData = await api.getTopic(topicId);
        if (topicData?.cards) {
          setQuizState((prev) => ({
            ...prev,
            content: topicData.cards,
            loading: false,
          }));
        } else {
          console.error("No cards found in topic data.");
          setQuizState((prev) => ({ ...prev, loading: false }));
          navigate(`/modules/${moduleId}/topics`);
        }
      } catch (error) {
        console.error("Failed to fetch topic content:", error);
        setQuizState((prev) => ({ ...prev, loading: false }));
        navigate(`/modules/${moduleId}/topics`);
      }
    };

    if (topicId) {
      fetchTopicContent();
    }
  }, [topicId, moduleId, navigate]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [quizState.currentIndex]);

  const getResetCardState = () => ({
    selectedOption: null,
    userCodeAnswer: "",
    answered: false,
    isCorrect: null,
    validationError: null,
  });

  const handleTopicCompletion = async (earnedXP) => {
    try {
      // Call backend API to mark topic completed and award XP
      const res = await api.topicCompleted(topicId, moduleId, earnedXP);

      // Update global XP immediately
      if (res.xpAdded) {
        updateUserXP(user.xp + res.xpAdded);
      }

      // Refresh user progress to unlock next topic
      await refreshUser();

    } catch (err) {
      console.error("Failed to mark topic as completed:", err);
    }
  };

  const handleAction = async () => {
    const currentCard = quizState.content[quizState.currentIndex];
    let xpAwarded = 0;
    const isLastCard = quizState.currentIndex === quizState.content.length - 1;

    // Knowledge card gives 1 XP automatically
    if (quizState.answered || currentCard.card_type === "knowledge") {
      if (currentCard.card_type === "knowledge") {
        xpAwarded = 1;
      }

      try {
        await api.recordCardCompletion(
          currentCard._id,
          topicId,
          moduleId,
          true,
          xpAwarded
        );

        let newTopicXP = quizState.topicXP + xpAwarded;

        if (isLastCard) {
          // Topic finished, update backend & global XP
          await handleTopicCompletion(newTopicXP);

          setQuizState((prev) => ({
            ...prev,
            quizFinished: true,
            topicXP: newTopicXP,
          }));
        } else {
          setQuizState((prev) => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            ...getResetCardState(),
            topicXP: newTopicXP,
          }));
        }
      } catch (err) {
        console.error("Failed to record card completion:", err);
      }

      return;
    }

    // Handle quiz and code card logic
    let correct = false;
    let error = null;

    if (currentCard.card_type === "quiz") {
      correct = quizState.selectedOption === currentCard.content.correctIndex;
      if (correct) xpAwarded = 5;
    } else if (currentCard.card_type === "code") {
      try {
        const validatorFunction = validators[currentCard.content.validator];
        if (validatorFunction) {
          const validationResult = validatorFunction(quizState.userCodeAnswer);
          correct = validationResult.isCorrect;
          error = validationResult.error;
          if (correct) xpAwarded = 10;
        } else {
          error = `Validator function '${currentCard.content.validator}' not found.`;
        }
      } catch (err) {
        console.error("Validation error:", err);
        error = "An error occurred during validation.";
      }
    }

    // Record card completion
    try {
      await api.recordCardCompletion(
        currentCard._id,
        topicId,
        moduleId,
        correct,
        xpAwarded
      );
    } catch (err) {
      console.error("Failed to record progress:", err);
    }

    setQuizState((prev) => {
      let newContent = [...prev.content];
      let newChances = prev.chances;
      let newScore = prev.score;
      let newTopicXP = prev.topicXP;

      if (!correct) {
        newChances = Math.max(prev.chances - 1, 0);
        newContent.push(currentCard); // retry
      } else {
        newScore++;
        newTopicXP += xpAwarded;
      }

      const topicFinished = isLastCard;

      if (topicFinished) {
        // Topic completed
        handleTopicCompletion(newTopicXP);
        return {
          ...prev,
          isCorrect: correct,
          answered: true,
          validationError: error,
          score: newScore,
          chances: newChances,
          topicXP: newTopicXP,
          quizFinished: true,
        };
      }

      return {
        ...prev,
        isCorrect: correct,
        answered: true,
        validationError: error,
        score: newScore,
        chances: newChances,
        topicXP: newTopicXP,
        content: newContent,
      };
    });
  };

  const handlePrev = () => {
    if (quizState.currentIndex > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        ...getResetCardState(),
      }));
    }
  };

   const handleExit = () => {
        Swal.fire({ // Use Swal.fire for confirmation
            title: 'Are you sure you want to leave?',
            text: "Your progress will not be counted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, leave!'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate(`/modules/${moduleId}/topics`);
            }
        });
    };


  const handleReturnFromResults = () => {
    navigate(`/modules/${moduleId}/topics`);
  };

  if (quizState.loading) {
    return <div className="loading-state">Loading topic content...</div>;
  }

  if (!quizState.content || quizState.content.length === 0) {
    return (
      <div className="text-white text-center">
        No content found for this topic.
        <button
          onClick={() => navigate(`/modules/${moduleId}/topics`)}
          className="btn btn-secondary mt-3"
        >
          Return to Topic Trail
        </button>
      </div>
    );
  }

  const current = quizState.content[quizState.currentIndex];
  const totalQuizQuestions = quizState.content.filter(
    (item) => item.card_type === "quiz" || item.card_type === "code"
  ).length;
  const progressPercent =
    ((quizState.currentIndex + 1) / quizState.content.length) * 100;

  if (quizState.quizFinished) {
    return (
      <QuizResults
        score={quizState.score}
        totalQuestions={totalQuizQuestions}
        onReturn={handleReturnFromResults}
        xp={quizState.topicXP}
      />
    );
  }

  const isInputProvided =
    (current.card_type === "quiz" && quizState.selectedOption !== null) ||
    (current.card_type === "code" && quizState.userCodeAnswer.trim() !== "");

  const isButtonDisabled =
    !quizState.answered &&
    current.card_type !== "knowledge" &&
    !isInputProvided;

  const buttonText =
    quizState.answered || current.card_type === "knowledge"
      ? quizState.currentIndex === quizState.content.length - 1
        ? "Finish"
        : "Continue"
      : "Check";

  return (
    <div className="quiz-container">
      <div className="bg-shape-1"></div>
      <div className="bg-shape-2"></div>

      <div className="top-fixed-elements">
        <div className="quiz-status-bar1">
          <button className="exit-button" onClick={handleExit} title="Exit">
            ×
          </button>
          <div className="quiz-progress-container">
            <Progress
              percent={Math.round(progressPercent)}
              strokeColor={{
                from: "var(--primary-blue-gradient-start)",
                to: "var(--primary-blue-gradient-end)",
              }}
              strokeWidth={19}
              showInfo={false}
            />
          </div>
          <div
            className="xp-container"
            aria-label={`You have ${quizState.topicXP} XP`}
          >
            <span className="xp-icon">💫</span>
            <span className="xp-count">{quizState.topicXP}</span>
          </div>
          <div
            className="chances-container"
            aria-label={`You have ${quizState.chances} chances left`}
          >
            <span className="heart-icon">❤️</span>
            <span className="chances-count">{quizState.chances}</span>
          </div>
        </div>
      </div>

      {current.card_type === "knowledge" && (
        <LearningCard
          title={current.content.title}
          text={current.content.text}
          image={current.imageUrl}
          imageSize={current.content.imageSize || "small"}
          cardId={current._id}
          topicId={topicId}
          moduleId={moduleId}
        />
      )}

      {current.card_type === "quiz" && (
        <QuizCard
          question={current.content.question}
          options={current.content.options}
          correctIndex={current.content.correctIndex}
          selectedOption={quizState.selectedOption}
          onSelect={(index) =>
            setQuizState((prev) => ({ ...prev, selectedOption: index }))
          }
          answered={quizState.answered}
          isCorrect={quizState.isCorrect}
          explanation={current.content.explanation}
          quizImage={current.imageUrl}
        />
      )}

      {current.card_type === "code" && (
        <CodeCard
          title={current.content.title}
          taxonomyCode={current.content.taxonomy}
          instanceCode={current.content.code}
          question={current.content.question}
          explanation={
            quizState.answered && quizState.isCorrect
              ? current.content.explanation
              : null
          }
          hint={current.content.hint}
          userAnswer={quizState.userCodeAnswer}
          onAnswer={
            quizState.answered
              ? () => {}
              : (code) =>
                  setQuizState((prev) => ({ ...prev, userCodeAnswer: code }))
          }
          validationError={quizState.validationError}
          isCorrect={quizState.isCorrect}
          cardId={current._id}
          topicId={topicId}
          moduleId={moduleId}
        />
      )}

      <div className="nav-buttons">
        {quizState.currentIndex > 0 && (
          <button className="nav-button prev-button" onClick={handlePrev}>
            Previous
          </button>
        )}
        <button
          className="nav-button continue-button"
          onClick={handleAction}
          disabled={isButtonDisabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
