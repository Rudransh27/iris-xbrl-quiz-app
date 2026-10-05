// src/pages/Quiz.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { buildTagSuffix, buildLearnBackPath } from "../utils/tagReturnPath";
import { withOrbitBridge } from "../utils/sandboxBridge";
import "./Quiz.css";
import { safeId, safeIdOrToken } from "../utils/safeNav";

// 🔒 HTML module iframe sandbox. With allow-same-origin a module's script
// runs with Orbit's own origin (it could read the session token and call the
// API as whoever is viewing it), so modules run WITHOUT it by default.
// Sandbox flags also apply to frames nested inside the module, so an
// embedded SharePoint video would lose its Microsoft sign-in — a superadmin
// can mark such a module "trusted" (card content.sandboxTrusted; cleared
// automatically if anyone else edits the HTML) to keep allow-same-origin.
// VITE_STRICT_HTML_SANDBOX=true forces strict mode even for trusted modules.
const STRICT_HTML_SANDBOX = "allow-scripts allow-popups allow-forms";
const TRUSTED_HTML_SANDBOX = "allow-scripts allow-popups allow-forms allow-same-origin";
const sandboxFor = (card) => (card?.content?.sandboxTrusted === true && import.meta.env.VITE_STRICT_HTML_SANDBOX !== "true"
  ? TRUSTED_HTML_SANDBOX : STRICT_HTML_SANDBOX);

const Quiz = () => {
  const params = useParams();
  const moduleId = safeId(params.moduleId);
  // Flat (express) modules open at /quiz/:moduleId/undefined.
  const topicId = safeIdOrToken(params.topicId, "undefined");
  const navigate = useNavigate();
  const location = useLocation();

  // 🔀 ARCHITECTURE DETECTION DETECTOR
  const isExpressFlatModule = !topicId || topicId.trim() === "" || topicId === "undefined";

  // Which tag (and region, if any) this session started from — carried as
  // ?tag=&region= all the way from the Learn page. Exiting/finishing must
  // return to that exact journey path, not always the flat all-modules list
  // (or, missing the region, the region-picker one level up from it).
  const tagId = new URLSearchParams(location.search).get("tag");
  const regionParam = new URLSearchParams(location.search).get("region");
  const pathParam = new URLSearchParams(location.search).get("path");

  // Must land inside the persistent Orbit shell (Learn page), not the legacy
  // chrome-less /modules route.
  const getExitRedirectPath = () => {
    const tagSuffix = buildTagSuffix(tagId, regionParam, pathParam);
    return isExpressFlatModule
      ? buildLearnBackPath(tagId, regionParam, pathParam)
      : `/orbit/modules/${moduleId}/topics${tagSuffix}`;
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
  } = useQuizEngine(moduleId, topicId, navigate, tagId, regionParam, pathParam);
  
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
    // The module's HTML is loaded unchanged, plus Orbit's small bridge script
    // (first-answer capture + exit containment — see utils/sandboxBridge.js).
    const blob = new Blob([withOrbitBridge(state.activeSandboxPayload)], { type: "text/html" });
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

  // 🔒 SERVER-SIDE GRADING: answers captured by the bridge are forwarded one
  // by one, strictly in order; the module's final submission waits for all
  // of them, so the server always sees each question's first answer before
  // the submission that ends the attempt.
  const sandboxQueueRef = useRef(Promise.resolve());
  const sandboxOpenedAtRef = useRef(Date.now());
  useEffect(() => {
    if (state.activeSandboxPayload) sandboxOpenedAtRef.current = Date.now();
  }, [state.activeSandboxPayload]);

  // 🚀 CROSS-FRAME MESSAGE LISTENER PIPELINE
  useEffect(() => {
    const enqueue = (task) => {
      sandboxQueueRef.current = sandboxQueueRef.current.then(task, task);
      return sandboxQueueRef.current;
    };

    const handleIframeMessageInterceptor = (event) => {
      // 🔒 Sandbox iframes are Blob URLs, so event.origin is literally the string "null" —
      // meaningless as an allowlist. Instead, trust only messages whose source window is
      // exactly the iframe we mounted, plus a shape-check on the payload.
      if (event.source !== sandboxIframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || !currentCard?._id) return;
      const cardId = currentCard._id;

      // A "server feedback" module asks whether an answer is right: record +
      // grade it on the server, then reply to the module with the result.
      if (data.fromOrbitBridge && data.type === "ORBIT_CHECK") {
        if (typeof data.qid !== "string" || typeof data.chosen !== "string" || typeof data.id !== "string") return;
        const reply = (result) => {
          try { event.source.postMessage({ type: "ORBIT_CHECK_RESULT", id: data.id, result }, "*"); } catch { /* iframe gone */ }
        };
        enqueue(() => api.recordSandboxAnswer(cardId, data.qid, data.chosen)
          .then((res) => {
            if (res?.xpChange) applyAutoSaveXp(res.xpChange);
            reply({ ok: true, isCorrect: !!res?.isCorrect, pending: !!res?.pending, correct: res?.correct || null });
          })
          .catch(() => reply({ ok: false })));
        return;
      }

      // One answer captured in-page by Orbit's bridge.
      if (data.fromOrbitBridge && data.type === "ORBIT_ANSWER") {
        if (typeof data.qid !== "string" || typeof data.chosen !== "string") return;
        enqueue(() => api.recordSandboxAnswer(cardId, data.qid, data.chosen)
          .then((res) => { if (res?.xpChange) applyAutoSaveXp(res.xpChange); })
          .catch((e) => console.warn("Sandbox answer not recorded:", e)));
        return;
      }

      if (data.fromSandboxEngine && data.type === "HTML_SIMULATION_SUBMIT") {
        // Only the per-question answers are used — the module's own
        // score / isCorrect / points are ignored; the server grades.
        const questions = Array.isArray(data.textResponses?.questions)
          ? data.textResponses.questions
          : (Array.isArray(data.textResponses) ? data.textResponses : []);
        const captured = { score: null, maxScore: null, rawTelemetryAnswers: { questions }, saved: false };
        setSandboxAnswers(captured);

        // ✅ RELEASE SUBMIT CONSTRAINTS: Force update fields flag to open up navigation gates
        updateFields('answered', true);

        // 🔒 AUTO-SAVE: grade + persist immediately so the attempt survives even if the
        // learner exits before clicking "Finish Track".
        const timeSpentDelta = Math.round((Date.now() - sandboxOpenedAtRef.current) / 1000);
        enqueue(() => api.submitSandbox(cardId, questions, timeSpentDelta)
          .then((backendResponse) => {
            setSandboxAnswers({ ...captured, score: backendResponse.score, maxScore: backendResponse.maxScore, saved: true });
            applyAutoSaveXp(backendResponse?.xpChange || 0);
            verifyModuleProgressIfComplete(backendResponse);
            const pending = backendResponse?.pendingManual
              ? ` · ${backendResponse.pendingManual} answer(s) awaiting admin review`
              : "";
            // Non-blocking (Sweetalert2 toasts render outside React's tree).
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Module submitted!',
              text: `Score: ${backendResponse.score}/${backendResponse.maxScore}${pending}`,
              showConfirmButton: false,
              timer: 2600,
            });
          })
          .catch((e) => {
            console.warn('Sandbox submission failed:', e);
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'warning',
              title: 'Submission not saved yet',
              text: 'We will retry when you click Finish.',
              showConfirmButton: false,
              timer: 2600,
            });
          }));

        // 🎯 AUTO-EXIT: the module's own "Finish" click IS the learner's intent to
        // leave. Close the overlay quickly (before the module's own about:blank
        // fallback ~700ms later); whole-module sandboxes land on the results screen.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?._id, updateFields, isWholeModuleSandbox, applyAutoSaveXp, verifyModuleProgressIfComplete]);

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
        });
      } catch (e) {
        console.error('Module reset failed:', e);
        Swal.fire({
          icon: 'error',
          title: 'Reset failed',
          text: 'Something went wrong — please try again.',
        });
      }
    });
  };

  if (state.loading) {
    return (
      <div className="cyber-loading-container">
        <div className="cyber-spinner"></div>
        <span>COMPILING PAYLOAD NODES...</span>
      </div>
    );
  }

  if (!state.content || state.content.length === 0) {
    return (
      <div className="no-modules-placeholder">
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
        });
        return;
      }

      // Compile answers telemetry object straight out of cached local hook states
      const telemetryProgressPayload = {
        cardId: currentCard._id,
        textResponses: sandboxAnswers.rawTelemetryAnswers,
        saved: sandboxAnswers.saved,
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
      <div className="html-sandbox-fullscreen-overlay position-fixed top-0 start-0 w-100 vh-100">
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
                  className="eject-modal-btn eject-modal-btn--stay ui-btn ui-btn--secondary ui-btn--lg"
                  onClick={() => setShowEjectModal(false)}
                >
                  Hold Position! 🧑‍🚀
                </button>
                <button
                  type="button"
                  className="eject-modal-btn eject-modal-btn--go ui-btn ui-btn--primary ui-btn--lg"
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
            sandbox={sandboxFor(currentCard)}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // Standard UI Rendering Architecture (Unmodified Backward-Compatible Pipeline)
  // =========================================================================
  return (
    <div className="quiz-simulation-player custom-dashboard-layout-root global-viewport-lock">
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
          className={`iris-drawer-toggle-trigger ui-btn ui-btn--secondary ui-btn--icon ui-btn--sm ${isSidebarOpen ? 'trigger-aside' : 'trigger-flush'}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ListNested size={16} /> : <List size={16} />}
        </button>

        <div className={`quiz-dynamic-sidebar-rails ${isSidebarOpen ? 'drawer-expanded' : 'drawer-collapsed'}`}>
          <div className="sidebar-rails-header text-start">
            <span className="sidebar-rails-header-label ui-eyebrow ui-eyebrow--caps">Course Syllabus</span>
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
              <button className="dock-nav-btn prev-action-trigger ui-btn ui-btn--secondary ui-btn--lg" onClick={handlePrev}>
                <ChevronLeft size={16} /> <span>Previous</span>
              </button>
            )}
          </div>
          <div className="dock-right-wing">
            <button
              className={`dock-nav-btn submit-action-trigger ui-btn ui-btn--primary ui-btn--lg ${isHtmlSandboxCard ? 'submit-action-trigger--wide' : ''} ${(state.answered || isPassiveNavCard || isCurrentCardReached) ? 'action-node-pulsing' : ''}`}
              onClick={handleDockClick}
              disabled={isButtonDisabled}
            >
              <span>{buttonText}</span> <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;