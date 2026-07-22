// src/pages/Quiz.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuizEngine } from "../hooks/useQuizEngine";
import api from "../admin/services/api";
import QuizPlayerHeader from "../components/QuizPlayerHeader";
import QuizCardSleeve from "../components/QuizCardSleeve";
import QuizResults from "../components/QuizResults";
import { 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  QuestionCircle, 
  CodeSquare, 
  LayoutTextWindow, 
  LockFill,
  CheckCircleFill,
  List,
  ListNested,
  FileEarmarkPdfFill,
  FileEarmarkEaselFill,
  RocketTakeoffFill
} from "react-bootstrap-icons";
import Swal from 'sweetalert2';
import "./Quiz.css";

const Quiz = () => {
  const { moduleId, topicId } = useParams();
  const navigate = useNavigate();

  // 🔀 ARCHITECTURE DETECTION DETECTOR
  const isExpressFlatModule = !topicId || topicId.trim() === "" || topicId === "undefined";

  // Must land inside the persistent Orbit shell (Learn page), not the legacy
  // chrome-less /modules route.
  const getExitRedirectPath = () => {
    return isExpressFlatModule
      ? `/orbit/modules`
      : `/orbit/modules/${moduleId}/topics`;
  };

  const {
    state,
    handleAction,
    handlePrev,
    updateFields,
    applyAutoSaveXp,
    verifyModuleProgressIfComplete,
    jumpToIndex,
    goToNextOrFinish,
    resetModule,
    isCardReached,
    isCardCorrect,
  } = useQuizEngine(moduleId, topicId, navigate);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 🚀 TELEMETRY CACHE STORAGE: Holds scores and raw string logs received from iframe postMessages
  const [sandboxAnswers, setSandboxAnswers] = useState(null);

  // 🖥️ FULLSCREEN SANDBOX OVERLAY: a ref to the mounted sandbox iframe so
  // incoming postMessages can be checked against event.source.
  const sandboxIframeRef = useRef(null);

  // 🎯 ROOT-CAUSE FIX: the blob URL used to be recreated inline on every
  // render, so ANY unrelated re-render (e.g. the old hover-HUD state toggle)
  // reassigned the iframe's src to a brand-new blob URL — which reloads the
  // iframe from scratch and wipes whatever page/state the learner was on
  // inside the sandbox. Memoizing it to only regenerate when the actual
  // payload changes keeps the iframe mounted (and its internal state intact)
  // across unrelated re-renders.
  const sandboxBlobUrl = useMemo(() => {
    if (!state.activeSandboxPayload) return null;
    const blob = new Blob([state.activeSandboxPayload], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [state.activeSandboxPayload]);

  useEffect(() => {
    return () => {
      if (sandboxBlobUrl) URL.revokeObjectURL(sandboxBlobUrl);
    };
  }, [sandboxBlobUrl]);

  // 🚀 "Abort Mission" cosmic exit flow: click the rocket → confirm modal →
  // liftoff micro-animation plays → navigate away once it's done.
  const [showEjectModal, setShowEjectModal] = useState(false);
  const [isEjecting, setIsEjecting] = useState(false);

  useEffect(() => {
    if (!showEjectModal) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowEjectModal(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showEjectModal]);

  const currentCard = state.content ? state.content[state.currentIndex] : null;

  // 🚀 REFACTORED: 'html_sandbox' is an interactive asset, NOT a passive reading card!
  const isPassiveNavCard = currentCard && ["knowledge", "video", "pdf", "ppt"].includes(currentCard.card_type);
  const isHtmlSandboxCard = currentCard && currentCard.card_type === "html_sandbox";
  // A whole-module sandbox is the entire module's content, IS the single card
  // shown (nothing left to browse to afterward) — as opposed to a legacy
  // sandbox embedded as one card among several in a standard multi-card module.
  const isWholeModuleSandbox = state.moduleType === "html_sandbox";

  // 🚀 CROSS-FRAME MESSAGE LISTENER PIPELINE
  useEffect(() => {
    const handleIframeMessageInterceptor = (event) => {
      // 🔒 Sandbox iframes are Blob URLs, so event.origin is literally the string "null" —
      // meaningless as an allowlist. Instead, trust only messages whose source window is
      // exactly the iframe we mounted, plus a shape-check on the payload.
      if (event.source !== sandboxIframeRef.current?.contentWindow) return;
      if (!event.data || !event.data.fromSandboxEngine) return;
      if (typeof event.data.score !== "number" || typeof event.data.maxPossibleScore !== "number") return;

      if (event.data.type === "HTML_SIMULATION_SUBMIT") {
        console.log("📥 Captured telemetry metrics from Sandbox Canvas frame:", event.data);

        const captured = {
          score: event.data.score,
          maxScore: event.data.maxPossibleScore,
          rawTelemetryAnswers: event.data.textResponses
        };

        // Cache data attributes inside local component state safely
        setSandboxAnswers(captured);

        // ✅ RELEASE SUBMIT CONSTRAINTS: Force update fields flag to open up navigation gates
        updateFields('answered', true);

        // 🔒 AUTO-SAVE: Persist to backend immediately so data survives even if the user exits
        // before clicking "Finish Track". The manual "Finish Track" click will upsert again (harmless).
        //
        // 🎯 BUG FIX (HTML module XP not visible): this used to be a bare
        // fire-and-forget call that never read the response at all — the
        // database was correctly updated (that's why global XP looked right
        // on the NEXT page), but nothing in this session's local state ever
        // learned an award happened, so there was no XP to show even if a
        // results screen had been reached. Capturing xpChange here and
        // applying it via applyAutoSaveXp fixes that at the source.
        if (currentCard?._id) {
          const payload = {
            cardId: currentCard._id,
            answeredScore: captured.score,
            totalPossibleWeight: captured.maxScore,
            textResponses: captured.rawTelemetryAnswers
          };
          api.recordCardCompletion(
            currentCard._id,
            isExpressFlatModule ? '' : topicId,
            moduleId,
            true,
            payload
          ).then(backendResponse => {
            const serverXpChange = backendResponse?.xpChange ?? backendResponse?.data?.xpChange ?? 0;
            applyAutoSaveXp(serverXpChange);
            verifyModuleProgressIfComplete(backendResponse);
          }).catch(e => console.warn('Auto-save sandbox progress failed:', e));
        }

        // Throw a beautiful user notification so the trainee knows their score hit the cluster boundaries.
        // Non-blocking (Sweetalert2 toasts render outside React's tree), so it
        // keeps showing over whatever comes next without holding up the exit below.
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Simulation Results Captured!',
          text: `Score: ${event.data.score}/${event.data.maxPossibleScore}`,
          showConfirmButton: false,
          timer: 2200,
          background: '#e3faf5',
          color: '#0f6e56'
        });

        // 🎯 AUTO-EXIT ("must exit automatically, no rocket click needed",
        // "fast, no white page"): the embedded HTML module's own
        // "Complete & Finish Module" button already fires this exact
        // message — that click IS the learner's intent to leave. It also
        // separately (and independently of this app) tries its own
        // self-navigation ~700ms later (window.location.replace("about:
        // blank")) as a fallback for when it's opened with no parent at
        // all — if OUR exit is slower than that, the learner briefly sees
        // that blank white iframe before this overlay finally closes. A
        // short, fixed 300ms here (not tied to the toast's own timer, which
        // used to be 2800ms) safely wins that race every time, while still
        // giving the rocket's liftoff animation a moment to register instead
        // of vanishing with zero transition. Always closes the fullscreen
        // overlay; whole-module sandboxes additionally land on the results
        // screen (same quizFinished transition the manual eject already
        // used, so earned XP/score still shows) — a sandbox embedded as one
        // card among several in a bigger module just returns to the standard
        // flow instead, since there may be more cards ahead.
        setIsEjecting(true);
        setTimeout(() => {
          updateFields("activeSandboxPayload", null);
          if (isWholeModuleSandbox) {
            updateFields("quizFinished", true);
          }
        }, 300);
      }
    };

    window.addEventListener("message", handleIframeMessageInterceptor);
    return () => {
      window.removeEventListener("message", handleIframeMessageInterceptor);
    };
  }, [currentCard?._id, updateFields, isExpressFlatModule, topicId, moduleId, isWholeModuleSandbox]);

  // 🎯 BUG FIX ("second attempt has no exit/rocket button"): on a fresh
  // attempt the learner sees a briefing card with a manual "Launch Fullscreen
  // Workspace" button, which is what opens the overlay (and its rocket exit
  // control) the first time. On a REVISIT of an already-completed
  // whole-module sandbox, isModuleReviewOnly is true and the card never gets
  // manually launched — the learner instead sees a plain "Finish Track" dock
  // button with no fullscreen overlay at all, so the rocket never appears.
  // Auto-launching the same fullscreen workspace on revisit keeps both
  // attempts consistent and guarantees the rocket/exit control is always
  // reachable, not just on a first attempt.
  useEffect(() => {
    if (
      isWholeModuleSandbox &&
      state.isModuleReviewOnly &&
      isHtmlSandboxCard &&
      !state.activeSandboxPayload
    ) {
      const rawHtmlPayload =
        currentCard.content?.htmlSource ||
        currentCard.content?.html ||
        currentCard.content?.text ||
        "";
      if (rawHtmlPayload.trim() !== "") {
        updateFields("activeSandboxPayload", rawHtmlPayload);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWholeModuleSandbox, state.isModuleReviewOnly, isHtmlSandboxCard, currentCard?._id]);

  // 🎯 BUG FIX ("rocket flies up and vanishes immediately on reattempt"):
  // isEjecting only ever gets set to true (by the eject/auto-exit flow
  // above) and was never reset back to false anywhere. If the overlay is
  // reopened later in the same component lifetime (e.g. auto-relaunched on a
  // revisit, right after the previous attempt's eject), the rocket button
  // mounts with the leftover eject-liftoff CSS class already applied — so it
  // plays its fly-away animation instantly instead of sitting still until
  // actually clicked. Resetting isEjecting the moment the overlay opens
  // guarantees a fresh rocket every time, regardless of what closed it before.
  useEffect(() => {
    if (state.activeSandboxPayload) setIsEjecting(false);
  }, [state.activeSandboxPayload]);

  // Flush temporary score buffers whenever the active index shifts
  useEffect(() => {
    setSandboxAnswers(null);
  }, [state.currentIndex]);

  // 🚀 INSTANT LOCK RELEASE TRACKER FOR STATIC AND STREAMING ASSETS
 useEffect(() => {
    if (!currentCard) return;
    const passive = ["knowledge", "video", "pdf", "ppt"].includes(currentCard.card_type);
    if (passive) {
      updateFields('answered', true);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [state.currentIndex, currentCard?._id]); 

  const handleExit = () => {
    Swal.fire({
      title: 'Are you sure you want to exit?',
      text: 'Any unsaved progress in this current learning track will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c8557c',
      cancelButtonColor: '#8b8399',
      confirmButtonText: 'Yes, exit track',
      cancelButtonText: 'Cancel'
    }).then((res) => {
      if (res.isConfirmed) navigate(getExitRedirectPath());
    });
  };

  // 🎯 REATTEMPT: a STANDARD module's reset only ever scopes to the current
  // topic (that's all this session has moduleId+topicId for) — sibling
  // topics of the same module are untouched, hence the dynamic wording.
  const resetScopeLabel = isExpressFlatModule ? 'Module' : 'Topic';

  const handleResetModule = () => {
    Swal.fire({
      title: `Reset this ${resetScopeLabel}?`,
      text: `All progress, submitted answers, and XP earned in this ${resetScopeLabel.toLowerCase()} will be permanently erased, and you'll start over from Card 1. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c8557c',
      cancelButtonColor: '#8b8399',
      confirmButtonText: `Yes, reset ${resetScopeLabel.toLowerCase()}`,
      cancelButtonText: 'Cancel'
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await resetModule();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Reset complete — starting fresh!',
          showConfirmButton: false,
          timer: 2200,
          background: '#e3faf5',
          color: '#0f6e56'
        });
      } catch (e) {
        console.error('Module reset failed:', e);
        Swal.fire({
          icon: 'error',
          title: 'Reset failed',
          text: 'Something went wrong — please try again.',
          confirmButtonColor: '#c8557c'
        });
      }
    });
  };

  if (state.loading) {
    return (
      <div className="cyber-loading-container font-monospace">
        <div className="cyber-spinner"></div>
        <span>COMPILING PAYLOAD NODES...</span>
      </div>
    );
  }

  if (!state.content || state.content.length === 0) {
    return (
      <div className="no-modules-placeholder font-monospace text-center m-5">
        ⚠️ [SYSTEM EXCEPTION]: Empty cluster tracks resolved.
      </div>
    );
  }

  const totalQuizQuestions = state.content.filter(item => item && (item.card_type === "quiz" || item.card_type === "code")).length;

  if (state.quizFinished) {
    return (
      <QuizResults
        score={state.score}
        totalQuestions={totalQuizQuestions}
        onReturn={() => navigate(getExitRedirectPath())}
        xp={state.topicXP}
        sandboxScore={sandboxAnswers?.score ?? null}
        sandboxMaxScore={sandboxAnswers?.maxScore ?? null}
      />
    );
  }

  // 🎯 LINEAR LOCKING + REVIEW MODE: "reached" (a submission already exists,
  // right or wrong) is what makes a card revisitable/skippable-past without
  // re-submitting — this replaces the old `state.completedCardIds` reference
  // that Quiz.jsx read but the hook never actually populated, so locking
  // silently never worked before.
  const isCurrentCardReached = currentCard ? isCardReached(currentCard) : false;

  const isInputProvided = (currentCard?.card_type === "quiz" && state.selectedOption !== null) ||
                          (currentCard?.card_type === "code" && state.userCodeAnswer && state.userCodeAnswer.trim() !== "");

  // 🚀 CONTROL DOCK STATE LOGIC FIXES
  const isButtonDisabled = isHtmlSandboxCard ? !state.answered : (!state.answered && !isPassiveNavCard && !isInputProvided);

  const isLastCard = state.currentIndex === state.content.length - 1;

  // Dynamic button string resolution text labels
  let buttonText = "Check";
  if (isHtmlSandboxCard) {
    buttonText = state.answered ? (isLastCard ? "Finish Track" : "Continue") : "Complete Assignment inside Workspace";
  } else if (state.isModuleReviewOnly && isLastCard) {
    buttonText = "Finish Review";
  } else if (state.answered || isPassiveNavCard || isCurrentCardReached) {
    buttonText = isLastCard ? "Finish" : "Continue";
  }

  const handleOnVideoPlaybackCompletion = () => {
    if (!currentCard?._id) return;
    handleAction();
  };

  // 🚀 CORE TELEMETRY INTERCEPTION MANAGER
  const handleProcessDockAction = () => {
    if (isHtmlSandboxCard) {
      if (!state.answered || !sandboxAnswers) {
        // Guard checking: block execution if the trainee clicks it early
        Swal.fire({
          icon: 'warning',
          title: 'Challenge Pending!',
          text: 'Please navigate through the workspace, complete the final challenge step, and hit "Submit for AI Feedback" inside the simulation card first.',
          confirmButtonColor: '#6f5fc0'
        });
        return;
      }

      // Compile answers telemetry object straight out of cached local hook states
      const telemetryProgressPayload = {
        cardId: currentCard._id,
        answeredScore: sandboxAnswers.score,
        totalPossibleWeight: sandboxAnswers.maxScore,
        textResponses: sandboxAnswers.rawTelemetryAnswers
      };
      
      console.log("📡 [Network Handshake] Passing packaged simulation values to hook executor:", telemetryProgressPayload);
      handleAction(telemetryProgressPayload);
    } else {
      handleAction();
    }
  };

  // 🎯 REVIEW MODE: the current card already has a stored answer — whether
  // it was just submitted this same click (Case B already ran and marked it
  // reached) or it's being revisited from history — so the dock's job here
  // is purely "advance to the next card", never re-submit/re-score. Routing
  // through goToNextOrFinish (not handleAction) is also what fixes the
  // pre-existing "next card renders blank even though it's already answered"
  // gap: goToNextOrFinish rehydrates the target index from progressByCardId,
  // where handleAction's own advance path used to unconditionally blank it.
  const handleDockClick = () => {
    if (currentCard && isCurrentCardReached) {
      if (state.isModuleReviewOnly && isLastCard) {
        navigate(getExitRedirectPath());
      } else {
        goToNextOrFinish();
      }
    } else {
      handleProcessDockAction();
    }
  };

  // 🎯 LINEAR LOCKING: a card is accessible if it's already reached (any
  // submission exists, right or wrong — matches the life system already
  // letting a learner continue forward past a wrong quiz answer) or every
  // card ahead of it in sequence is reached/passive. Jumps always rehydrate
  // via the hook's jumpToIndex, not a raw currentIndex write.
  const handleSidebarNodeJump = (targetIndex) => {
    if (targetIndex === state.currentIndex) return;

    let canJump = true;
    for (let i = 0; i < targetIndex; i++) {
      const cardBefore = state.content[i];
      const isCardBeforePassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(cardBefore.card_type);

      if (!isCardReached(cardBefore) && !isCardBeforePassive) {
        canJump = false;
        break;
      }
    }

    if (canJump) {
      jumpToIndex(targetIndex);
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Node Locked!',
        text: 'Please solve the prerequisite interactive challenges first.',
        showConfirmButton: false,
        timer: 1800,
        background: '#ffeef2',
        color: '#c8557c'
      });
    }
  };

  // =========================================================================
  // ⚡ DYNAMIC FULLSCREEN MODAL OVERLAY INTERCEPTOR FOR INLINE WORKSPACES
  // =========================================================================
  if (state.activeSandboxPayload) {
    // 🎯 Whole-module sandboxes (moduleType 'html_sandbox') have nothing left to "return to" —
    // exiting must land the learner back on the Learn page. Card-embedded sandboxes (legacy,
    // multi-card modules) keep the old "close overlay, return to flow" behavior.
    // (isWholeModuleSandbox is computed once, higher up, and reused here.)
    const handleExitSandbox = () => {
      if (isWholeModuleSandbox) {
        // 🎯 BUG FIX (HTML module XP not visible): this used to navigate
        // away immediately, so the learner never saw ANY completion screen —
        // even though XP had already been correctly awarded server-side
        // (see the auto-save fix above). Falling through to the standard
        // QuizResults screen instead (its `quizFinished` check runs before
        // the `activeSandboxPayload` check further down this component, so
        // setting both here in the same batch is enough to swap views) shows
        // the earned XP and sandbox score before the learner actually leaves
        // — clicking "Continue" on that screen is what navigates away now.
        updateFields("activeSandboxPayload", null);
        updateFields("quizFinished", true);
      } else {
        updateFields("activeSandboxPayload", null);
      }
    };

    // Confirmed "Eject!" — close the modal, let the rocket play its liftoff
    // animation, then actually navigate away once it's had time to finish.
    const handleConfirmEject = () => {
      setShowEjectModal(false);
      setIsEjecting(true);
      setTimeout(handleExitSandbox, 550);
    };

    return (
      <div className="html-sandbox-fullscreen-overlay bg-light position-fixed top-0 start-0 w-100 vh-100" style={{ zIndex: 9999, fontFamily: 'Plus Jakarta Sans' }}>
        {/* Permanent top-right "Abort Mission" control — no hover tracking,
            no slide animation, always on screen and always clickable. */}
        <button
          type="button"
          className={`sandbox-exit-icon-btn ${isEjecting ? 'eject-liftoff' : ''}`}
          onClick={() => setShowEjectModal(true)}
          aria-label="Eject / Abort Mission"
          title="Eject / Abort Mission"
        >
          <RocketTakeoffFill size={19} />
        </button>

        {showEjectModal && (
          <div className="eject-modal-backdrop" onClick={() => setShowEjectModal(false)}>
            <div className="eject-modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="eject-modal-title">💥 ABORT MISSION?</h3>
              <p className="eject-modal-body">
                Leaving now will pause your progress and return you straight to the Learn dashboard. Are you sure you want to exit?
              </p>
              <div className="eject-modal-actions">
                <button
                  type="button"
                  className="eject-modal-btn eject-modal-btn--stay"
                  onClick={() => setShowEjectModal(false)}
                >
                  Hold Position! 🧑‍🚀
                </button>
                <button
                  type="button"
                  className="eject-modal-btn eject-modal-btn--go"
                  onClick={handleConfirmEject}
                >
                  Eject! 🪂
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Borderless Client Window Frame Viewport Area */}
        <div className="w-100 h-100 bg-white">
          <iframe
            ref={sandboxIframeRef}
            src={sandboxBlobUrl}
            title="Fullscreen Native Sandbox Execution Terminal"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // Standard UI Rendering Architecture (Unmodified Backward-Compatible Pipeline)
  // =========================================================================
  return (
    <div className="quiz-simulation-player custom-dashboard-layout-root global-viewport-lock" style={{ fontFamily: 'Plus Jakarta Sans' }}>
      <div className="quiz-ambient-mesh-grid"></div>

      <QuizPlayerHeader
        currentIndex={state.currentIndex}
        totalLength={state.content.length}
        topicXP={state.topicXP}
        chances={state.chances}
        onExit={handleExit}
        reviewMode={state.isModuleReviewOnly}
        onReset={handleResetModule}
        resetScopeLabel={resetScopeLabel}
      />

      {state.isModuleReviewOnly && (
        <div className="quiz-review-mode-banner">
          📖 Review Mode — you've already completed this {resetScopeLabel.toLowerCase()}. Browse freely; nothing here is re-scored.
        </div>
      )}

      <div className="main-flexible-workspace-deck d-flex position-relative">
        
        <button 
          className={`iris-drawer-toggle-trigger ${isSidebarOpen ? 'trigger-aside' : 'trigger-flush'}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ListNested size={16} /> : <List size={16} />}
        </button>

        <div className={`quiz-dynamic-sidebar-rails font-monospace ${isSidebarOpen ? 'drawer-expanded' : 'drawer-collapsed'}`}>
          <div className="sidebar-rails-header text-start">
            <span className="sidebar-rails-header-label">Course Syllabus</span>
          </div>
          <div className="sidebar-scrollable-menu-nodes cb-sidebar-scroll-track">
            {(() => {
              // 🎯 SIDEBAR DEDUP: a wrong quiz/code answer re-appends the same
              // card object onto state.content for another attempt (see the
              // hook's retry-loop). Rendering one row per raw array index
              // would show the same card twice, both flipping "done" in
              // lockstep the instant either occurrence is solved — instead,
              // render only each card's first-occurrence index; jumping there
              // shows identical rehydrated data regardless of which index the
              // live session is actually sitting on.
              const seenCardIds = new Set();
              const sidebarRows = [];
              state.content.forEach((card, idx) => {
                const cid = card._id?.toString();
                if (seenCardIds.has(cid)) return;
                seenCardIds.add(cid);
                sidebarRows.push({ card, idx });
              });
              return sidebarRows;
            })().map(({ card, idx }) => {
              const isActive = idx === state.currentIndex;
              const isCardPassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(card.card_type);
              const reached = isCardReached(card) || isCardPassive;
              const correct = isCardCorrect(card) || isCardPassive;

              let isSequenceSelectable = true;
              for (let k = 0; k < idx; k++) {
                const prevCard = state.content[k];
                const isPrevCardPassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(prevCard.card_type);
                if (!isCardReached(prevCard) && !isPrevCardPassive) {
                  isSequenceSelectable = false;
                }
              }

              const isNodeAccessible = reached || isSequenceSelectable;

              return (
                <div
                  key={card._id || idx}
                  className={`sidebar-nav-item-row text-start d-flex align-items-center justify-content-between ${isActive ? 'active-row-node' : ''} ${!isNodeAccessible ? 'hard-locked-row' : 'clickable-row'}`}
                  onClick={() => isNodeAccessible && handleSidebarNodeJump(idx)}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate w-80">
                    <div className="row-icon-indicator flex-shrink-0 d-flex align-items-center">
                      {card.card_type === 'knowledge' && <LayoutTextWindow />}
                      {card.card_type === 'video' && <PlayCircle />}
                      {card.card_type === 'quiz' && <QuestionCircle />}
                      {card.card_type === 'code' && <CodeSquare />}
                      {card.card_type === 'pdf' && <FileEarmarkPdfFill />}
                      {card.card_type === 'ppt' && <FileEarmarkEaselFill />}
                      {card.card_type === 'html_sandbox' && <PlayCircle />}
                    </div>
                    <span className="sidebar-node-title text-truncate">
                      {card.content?.title || "Untitled Component Node"}
                    </span>
                  </div>

                  <div className="row-status-lock-marker flex-shrink-0 ms-2">
                    {correct ? (
                      <CheckCircleFill className="sidebar-status-done" size={13} />
                    ) : (
                      !isNodeAccessible ? <LockFill className="sidebar-status-locked" size={11} /> : <div className="pending-dot-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="quiz-sleeve-viewport-wrapper flex-grow-1 workspace-scroll-track">
          <div className="central-stage-box-bounds mx-auto">
            <QuizCardSleeve 
              currentCard={currentCard} 
              state={state} 
              topicId={topicId} 
              moduleId={moduleId} 
              updateFields={updateFields}
              onVideoEnded={handleOnVideoPlaybackCompletion}
            />
          </div>
        </div>

      </div>

      <div className="quiz-action-control-dock">
        <div className="dock-content-alignment">
          <div className="dock-left-wing">
            {state.currentIndex > 0 && (
              <button className="dock-nav-btn prev-action-trigger" onClick={handlePrev}>
                <ChevronLeft size={14} /> <span>Previous</span>
              </button>
            )}
          </div>
          <div className="dock-right-wing">
            <button
              className={`dock-nav-btn submit-action-trigger ${(state.answered || isPassiveNavCard || isCurrentCardReached) ? 'action-node-pulsing' : ''}`}
              onClick={handleDockClick}
              disabled={isButtonDisabled}
              style={{
                background: isButtonDisabled ? '#cbd5e1' : 'linear-gradient(135deg, var(--orbit-lavender), var(--orbit-sky))',
                cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                minWidth: isHtmlSandboxCard ? '280px' : 'auto'
              }}
            >
              <span>{buttonText}</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;