// src/hooks/useQuizEngine.js
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import api from "../admin/services/api";
import AuthContext from "../context/AuthContext";
import * as validators from "../utils/validators";
import Swal from "sweetalert2";

export const useQuizEngine = (moduleId, topicId, navigate) => {
  const { addUserXP, refreshUser } = useContext(AuthContext);

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

  // ⏱️ Tracks how long the current card has been open so recordCardCompletion
  // can report real elapsed time to the admin Progress Dashboard. Reset on
  // every card change (forward or back) — read at each submission site below.
  const cardStartTimeRef = useRef(Date.now());
  useEffect(() => {
    cardStartTimeRef.current = Date.now();
  }, [state.currentIndex]);

  // 🎯 Applies a server-computed xpChange that arrived OUTSIDE handleAction's
  // own flow — currently only the whole-module HTML sandbox's auto-save
  // (Quiz.jsx) — updating both this session's local topicXP (functional
  // setState, safe even from a stale closure) and the global AuthContext
  // total. This is why the HTML module page never showed earned XP before:
  // the auto-save call updated the database but never called anything like
  // this, so neither piece of UI state ever knew XP had been awarded.
  // handleAction's own flow below does NOT use this — it already folds its
  // own topicXP bump into a broader setState call and calls addUserXP
  // directly, so calling this too would double-apply the same amount.
  const applyAutoSaveXp = useCallback((amount) => {
    if (!amount) return;
    setState((prev) => ({ ...prev, topicXP: prev.topicXP + amount }));
    addUserXP(amount);
  }, [addUserXP]);

  // 🎯 BUG FIX (Module Completion checklist/streak never updating): the
  // dashboard used to be the ONLY place that decided "is a module/topic done"
  // (via OrbitWorkspace's moduleTaskDone), so nothing ever recorded the
  // completion until the user happened to navigate back to the dashboard's
  // index route — which the post-quiz flow doesn't do automatically (it lands
  // on the module/topic list instead). Today's Read and Idea Submission both
  // call verifyDailyStreak right at the moment they complete; Module
  // Completion is the odd one out that didn't. recordCardCompletion's
  // response already carries `cardsCovered`/`totalCards` for BOTH module
  // formats (whole-module count for EXPRESS_FLAT, topic count for STANDARD),
  // so completion can be detected uniformly right here, at the source.
  const verifyModuleProgressIfComplete = useCallback((backendResponse) => {
    const covered = backendResponse?.cardsCovered ?? backendResponse?.data?.cardsCovered;
    const total = backendResponse?.totalCards ?? backendResponse?.data?.totalCards;
    if (total > 0 && covered === total && typeof api.verifyDailyStreak === "function") {
      api.verifyDailyStreak("module_progress").catch(() => {});
    }
  }, []);

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
          const timeSpentDelta = Math.round((Date.now() - cardStartTimeRef.current) / 1000);

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
              timeSpentDelta,
            );
          } else {
            // Standard passive knowledge card completion route
            backendResponse = await api.recordCardCompletion(
              currentCard._id,
              isExpressFlatTrack ? "" : topicId,
              moduleId,
              true,
              null,
              timeSpentDelta,
            );
          }

          serverXpChange =
            backendResponse?.xpChange ?? backendResponse?.data?.xpChange ?? 0;
          console.log(
            `📥 Server interaction synchronization result: +${serverXpChange} XP`,
          );

          addUserXP(serverXpChange);
          verifyModuleProgressIfComplete(backendResponse);
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
      const timeSpentDelta = Math.round((Date.now() - cardStartTimeRef.current) / 1000);
      const backendResponse = await api.recordCardCompletion(
        currentCard._id,
        isExpressFlatTrack ? null : topicId,
        moduleId,
        isCurrentCorrect,
        null,
        timeSpentDelta,
      );

      const verifiedXpChange =
        backendResponse?.xpChange ?? backendResponse?.data?.xpChange ?? 0;

      addUserXP(verifiedXpChange);
      verifyModuleProgressIfComplete(backendResponse);

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

  return { state, handleAction, handlePrev, updateFields, applyAutoSaveXp, verifyModuleProgressIfComplete };
};
