// src/hooks/useQuizEngine.js
import { useState, useEffect, useContext, useCallback } from "react";
import api from "../admin/services/api";
import AuthContext from "../context/AuthContext";
import * as validators from "../utils/validators";
import Swal from "sweetalert2";

export const useQuizEngine = (moduleId, topicId, navigate) => {
  const { user, updateUserXP, refreshUser } = useContext(AuthContext);

  // Normalize checking whether the layout parameters route identifies a Flat/Express Module path
  const isExpressFlatTrack =
    !topicId || topicId === "undefined" || topicId.toString().trim() === "";

  // Dynamic Landing Redirection Resolver Hook Mapping Path Bounds
  // Must land inside the persistent Orbit shell (Learn page), not the legacy
  // chrome-less /modules route.
  const getExitRedirectPath = () => {
    return isExpressFlatTrack ? "/orbit/modules" : `/orbit/modules/${moduleId}/topics`;
  };

  const [state, setState] = useState({
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
    topicXP: 0,
    moduleType: 'standard',
  });

  // ⚡ LOCK INGESTION: Load content AND previous progress on mount adaptively
  useEffect(() => {
    const fetchContentAndProgress = async () => {
      if (!moduleId) return;

      setState((prev) => ({ ...prev, loading: true }));
      try {
        let cardsPayload = [];
        let historicalXP = 0;

        // 1. Fetch user progress vectors first to check across historical lookups
        const userProgressInApp = await api.getUserProgress();

        // 2. Fetch the entire robust layout map from the pre-packaged module data object
        const moduleData = await api.getModule(moduleId);

        if (isExpressFlatTrack) {
          console.log(
            `⏳ Express Flat Pipeline active: Hydrating direct cards payload from Module ID: ${moduleId}`,
          );
          cardsPayload = moduleData?.cards || [];

          if (userProgressInApp && userProgressInApp.moduleXpMap) {
            historicalXP =
              userProgressInApp.moduleXpMap[moduleId.toString()] || 0;
          }
        } else {
          console.log(
            `⏳ Standard Track active: Extracting cards from mapped Topic ID: ${topicId}`,
          );

          // 🚀 CRITICAL RESILIENT FIX: Safely check both '_id' and 'id' string equivalents
          const targetTopicDoc = moduleData?.topics?.find((t) => {
            const matchId = t._id
              ? t._id.toString()
              : t.id
                ? t.id.toString()
                : "";
            return matchId === topicId.toString();
          });

          cardsPayload = targetTopicDoc?.cards || [];

          if (userProgressInApp && userProgressInApp.topicXpMap) {
            historicalXP =
              userProgressInApp.topicXpMap[topicId.toString()] || 0;
          }
        }

        if (cardsPayload && cardsPayload.length > 0) {
          setState((prev) => ({
            ...prev,
            content: cardsPayload,
            loading: false,
            topicXP: historicalXP,
            moduleType: moduleData?.moduleType || 'standard',
          }));
        } else {
          console.warn(
            "⚠️ Targeted curriculum track contains zero compiled card data nodes or matched ID validation checks.",
          );
          navigate(getExitRedirectPath());
        }
      } catch (err) {
        console.error(
          "❌ Error loading streaming data layout inside custom hook engine:",
          err,
        );
        navigate(getExitRedirectPath());
      }
    };

    fetchContentAndProgress();
  }, [topicId, moduleId, isExpressFlatTrack]);

  const getResetCardState = () => ({
    selectedOption: null,
    userCodeAnswer: "",
    answered: false,
    isCorrect: null,
    validationError: null,
  });

  // 🚀 REFACTORED: Now accepts an optional telemetryPayload sent up from custom cards (like HTML Sandboxes)
  const handleAction = async (telemetryPayload = null) => {
    const currentCard = state.content[state.currentIndex];

    // =========================================================================
    // CASE A: User clicked "Continue" after completing a card task
    // =========================================================================
    if (
      state.answered ||
      currentCard.card_type === "knowledge" ||
      currentCard.card_type === "html_sandbox"
    ) {
      let nextIndex = state.currentIndex + 1;
      let serverXpChange = 0;

      // 📡 IN-LINE ENGINE DISPATCHER FOR PASSIVE AND EXTERNAL RUNTIMES
      if (
        currentCard.card_type === "knowledge" ||
        currentCard.card_type === "html_sandbox"
      ) {
        try {
          let backendResponse;

          if (currentCard.card_type === "html_sandbox" && telemetryPayload) {
            console.log(
              "📡 Shipping custom simulation score weights to backend progress channels...",
              telemetryPayload,
            );
            // We pass the structured payload dictionary containing feedback text rows into the submission layer
            backendResponse = await api.recordCardCompletion(
              currentCard._id,
              isExpressFlatTrack ? "" : topicId,
              moduleId,
              true, // Marked true since submission requires complete execution path
              telemetryPayload, // Pass extra text feedback object matrices safely down the wire
            );
          } else {
            // Standard passive knowledge card completion route
            backendResponse = await api.recordCardCompletion(
              currentCard._id,
              isExpressFlatTrack ? "" : topicId,
              moduleId,
              true,
            );
          }

          serverXpChange =
            backendResponse?.xpChange ?? backendResponse?.data?.xpChange ?? 0;
          console.log(
            `📥 Server interaction synchronization result: +${serverXpChange} XP`,
          );

          if (serverXpChange > 0 && user) {
            updateUserXP((user.xp || 0) + serverXpChange);
          }
        } catch (e) {
          console.error("Failed to commit sandbox tracker card async pass:", e);
        }
      }

      if (state.currentIndex >= state.content.length - 1) {
        console.log(
          "🏁 Final deck reached. Syncing full authentication parameters...",
        );
        try {
          await refreshUser();
        } catch (e) {}
        setState((prev) => ({
          ...prev,
          quizFinished: true,
          topicXP: prev.topicXP + serverXpChange,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          currentIndex: nextIndex,
          ...getResetCardState(),
          topicXP: prev.topicXP + serverXpChange,
        }));
      }
      return;
    }

    // =========================================================================
    // CASE B: Standard Check Verification Code Rails (Quizzes / Coding Sandbox Cards)
    // =========================================================================
    let isCurrentCorrect = false;
    let errorLog = null;

    if (currentCard.card_type === "quiz") {
      isCurrentCorrect =
        state.selectedOption === currentCard.content.correctIndex;
    } else if (currentCard.card_type === "code") {
      try {
        const validatorFn = validators[currentCard.content.validator];
        if (validatorFn) {
          const res = validatorFn(state.userCodeAnswer);
          isCurrentCorrect = res.isCorrect;
          errorLog = res.error;
        }
      } catch (err) {
        errorLog = "Validation script failure.";
      }
    }

    try {
      const backendResponse = await api.recordCardCompletion(
        currentCard._id,
        isExpressFlatTrack ? null : topicId,
        moduleId,
        isCurrentCorrect,
      );

      const verifiedXpChange =
        backendResponse?.xpChange ?? backendResponse?.data?.xpChange ?? 0;

      if (verifiedXpChange !== 0 && user) {
        updateUserXP((user.xp || 0) + verifiedXpChange);
      }

      setState((prev) => {
        let updatedContent = [...prev.content];
        let nextChances = prev.chances;
        let nextScore = prev.score;
        let nextFinishedState = prev.quizFinished;

        if (!isCurrentCorrect) {
          nextChances = Math.max(prev.chances - 1, 0);
          updatedContent.push(currentCard); // Shuffled loop retry queue vector

          if (nextChances === 0) {
            Swal.fire({
              title: "Game Over! 💔",
              text: "Aapki saari hearts khatm ho gayi hain bhai. Trail dubara shuru karein!",
              icon: "error",
              confirmButtonText: isExpressFlatTrack
                ? "Return to Dashboard"
                : "Return to Topics",
            }).then(() => {
              navigate(getExitRedirectPath());
            });
            nextFinishedState = true;
          }
        } else {
          nextScore++;
        }

        return {
          ...prev,
          isCorrect: isCurrentCorrect,
          answered: true,
          validationError: errorLog,
          score: nextScore,
          chances: nextChances,
          content: updatedContent,
          quizFinished: nextFinishedState,
          topicXP: prev.topicXP + verifiedXpChange,
        };
      });
    } catch (err) {
      console.error("Progression synchronization failure:", err);
    }
  };

  const handlePrev = () => {
    if (state.currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        ...getResetCardState(),
      }));
    }
  };
  // ✅ Fixed
  const updateFields = useCallback((field, value) => {
    setState((prev) => ({ ...prev, [field]: value }));
  }, []); // empty deps — setState setter is stable

  return { state, handleAction, handlePrev, updateFields };
};
