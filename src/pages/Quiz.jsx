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

  const { state, handleAction, handlePrev, updateFields, applyAutoSaveXp, verifyModuleProgressIfComplete } = useQuizEngine(moduleId, topicId, navigate);
  
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

        // Throw a beautiful user notification so the trainee knows their score hit the cluster boundaries
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Simulation Results Captured!',
          text: `Score: ${event.data.score}/${event.data.maxPossibleScore}. Click Continue to save progress.`,
          showConfirmButton: false,
          timer: 2800,
          background: '#e8f7f2',
          color: '#0f6e56'
        });
      }
    };

    window.addEventListener("message", handleIframeMessageInterceptor);
    return () => {
      window.removeEventListener("message", handleIframeMessageInterceptor);
    };
  }, [currentCard?._id, updateFields, isExpressFlatModule, topicId, moduleId]);

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
      confirmButtonColor: '#ff9f1c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, exit track',
      cancelButtonText: 'Cancel'
    }).then((res) => { 
      if (res.isConfirmed) navigate(getExitRedirectPath()); 
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

  const completedCardIdsInApp = state.completedCardIds || [];

  const isInputProvided = (currentCard?.card_type === "quiz" && state.selectedOption !== null) ||
                          (currentCard?.card_type === "code" && state.userCodeAnswer && state.userCodeAnswer.trim() !== "");

  // 🚀 CONTROL DOCK STATE LOGIC FIXES
  const isButtonDisabled = isHtmlSandboxCard ? !state.answered : (!state.answered && !isPassiveNavCard && !isInputProvided);

  // Dynamic button string resolution text labels
  let buttonText = "Check";
  if (isHtmlSandboxCard) {
    buttonText = state.answered ? (state.currentIndex === state.content.length - 1 ? "Finish Track" : "Continue") : "Complete Assignment inside Workspace";
  } else if (state.answered || isPassiveNavCard || completedCardIdsInApp.includes(currentCard?._id?.toString())) {
    buttonText = state.currentIndex === state.content.length - 1 ? "Finish" : "Continue";
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
          confirmButtonColor: '#ff9f1c'
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

  const handleSidebarNodeJump = (targetIndex) => {
    if (targetIndex === state.currentIndex) return;
    
    let canJump = true;
    for (let i = 0; i < targetIndex; i++) {
      const cardBefore = state.content[i];
      const isCardBeforePassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(cardBefore.card_type);
      
      if (!completedCardIdsInApp.includes(cardBefore._id?.toString()) && !isCardBeforePassive) {
        canJump = false;
        break;
      }
    }

    if (canJump) {
      updateFields('currentIndex', targetIndex);
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Node Locked!',
        text: 'Please solve the prerequisite interactive challenges first.',
        showConfirmButton: false,
        timer: 1800,
        background: '#fff5f5',
        color: '#991b1b'
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
    const isWholeModuleSandbox = state.moduleType === 'html_sandbox';
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
      />

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
            {state.content.map((card, idx) => {
              const isActive = idx === state.currentIndex;
              const isCardPassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(card.card_type);
              const isDone = completedCardIdsInApp.includes(card._id?.toString()) || isCardPassive;
              
              let isSequenceSelectable = true;
              for (let k = 0; k < idx; k++) {
                const prevCard = state.content[k];
                const isPrevCardPassive = ["knowledge", "video", "pdf", "ppt", "html_sandbox"].includes(prevCard.card_type);
                if (!completedCardIdsInApp.includes(prevCard._id?.toString()) && !isPrevCardPassive) {
                  isSequenceSelectable = false;
                }
              }

              const isNodeAccessible = isDone || isSequenceSelectable;

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
                    {isDone ? (
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
              className={`dock-nav-btn submit-action-trigger ${(state.answered || isPassiveNavCard || completedCardIdsInApp.includes(currentCard?._id?.toString())) ? 'action-node-pulsing' : ''}`} 
              onClick={handleProcessDockAction} 
              disabled={isButtonDisabled}
              style={{
                backgroundColor: isButtonDisabled ? '#cbd5e1' : 'var(--amber-glow, #ff9f1c)',
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