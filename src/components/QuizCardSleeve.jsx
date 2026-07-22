// src/components/QuizCardSleeve.jsx
import React from 'react';
import LearningCard from "./LearningCard";
import QuizCard from "./QuizCard";
import CodeCard from "./CodeCard";
import VideoCard from "./VideoCard"; 
import PptCard from "./PptCard"; 
import PdfCard from "./PdfCard"; 
import './QuizCardSleeve.css';

export default function QuizCardSleeve({ currentCard, state, topicId, moduleId, updateFields, onVideoEnded }) {
  
  if (!currentCard) return null;

  const renderCardContent = () => {
    if (currentCard.card_type === "knowledge") {
      return (
        <LearningCard
          title={currentCard.content?.title}
          text={currentCard.content?.text}
          image={currentCard.imageUrl}
          imageSize={currentCard.content?.imageSize || "small"}
          cardId={currentCard._id}
          topicId={topicId}
          moduleId={moduleId}
        />
      );
    }

    if (currentCard.card_type === "quiz") {
      const rawCorrectIndex = currentCard.content?.correctIndex;
      const cleanCorrectIndex = rawCorrectIndex !== undefined ? Number(rawCorrectIndex) : 0;
      const cleanSelectedOption = state.selectedOption !== null ? Number(state.selectedOption) : null;

      return (
        <QuizCard
          question={currentCard.content?.question || "No question text loaded."}
          options={currentCard.content?.options || []}
          correctIndex={cleanCorrectIndex}
          selectedOption={cleanSelectedOption}
          onSelect={(index) => {
            console.log("🎯 Option clicked in layout sleeve index number:", Number(index));
            updateFields('selectedOption', Number(index)); 
          }}
          answered={state.answered}
          isCorrect={state.isCorrect}
          explanation={currentCard.content?.explanation}
          quizImage={currentCard.imageUrl}
        />
      );
    }

    if (currentCard.card_type === "code") {
      return (
        <CodeCard
          title={currentCard.content?.title}
          taxonomyCode={currentCard.content?.taxonomy}
          instanceCode={currentCard.content?.code}
          question={currentCard.content?.question}
          explanation={state.answered && state.isCorrect ? currentCard.content?.explanation : null}
          hint={currentCard.content?.hint}
          userAnswer={state.userCodeAnswer}
          onAnswer={state.answered ? () => {} : (code) => updateFields('userCodeAnswer', code)}
          validationError={state.validationError}
          isCorrect={state.isCorrect}
          cardId={currentCard._id}
          topicId={topicId}
          moduleId={moduleId}
        />
      );
    }

    if (currentCard.card_type === "video") {
      return (
        <VideoCard
          videoUrl={currentCard.content?.videoUrl}
          title={currentCard.content?.title}
          description={currentCard.content?.description}
          thumbnailUrl={currentCard.imageUrl} 
          tags={currentCard.content?.tags || []}
          onVideoEnded={onVideoEnded}
        />
      );
    }

    if (currentCard.card_type === "ppt") {
      return (
        <PptCard
          pptUrl={currentCard.content?.pptUrl}
          title={currentCard.content?.title}
          description={currentCard.content?.description}
        />
      );
    }

    if (currentCard.card_type === "pdf") {
      return (
        <PdfCard
          pdfUrl={currentCard.content?.pdfUrl || currentCard.content?.documentUrl || currentCard.content?.text}
          title={currentCard.content?.title}
          description={currentCard.content?.description}
        />
      );
    }

    /* 🚀 EMBEDDED LAUNCHPAD FOR INTERACTIVE HTML FULLSCREEN CARD TYPES */
    if (currentCard.card_type === "html_sandbox") {
      // ⚡ FIX: Added currentCard.content?.html fallback checks to guard against empty strings
      const rawHtmlPayload = currentCard.content?.htmlSource ||
                             currentCard.content?.html ||
                             currentCard.content?.text ||
                             "";

      // 🎯 REVIEW MODE (relaunch, not rehydrate): a sandbox card has no
      // built-in contract for restoring its exact prior DOM state, so
      // relaunching always opens a fresh interactive iframe (see Quiz.jsx's
      // fullscreen overlay) — this line just shows the learner their history
      // before they do, sourced from the hook's progressByCardId cache.
      const priorSubmission = state?.progressByCardId?.[currentCard._id];

      return (
        <div className="sandbox-launcher-card-housing">
          <div className="sandbox-launcher-graphics-box">
            <div className="sandbox-mascot-emoji">🚀</div>
            <h4 className="sandbox-launcher-main-title">{currentCard.content?.title || "Interactive Sandbox Workspace"}</h4>
            <p className="sandbox-launcher-explanation-text">
              This section contains an interactive, native simulation workspace assignment. Launch the fullscreen container stage below to complete your execution tasks.
            </p>
            {priorSubmission?.attempted && (
              <p className="sandbox-prior-submission-note">
                📋 Previous submission: {priorSubmission.score}/{priorSubmission.maxScore || 0}
                {priorSubmission.timesAttempted > 1 ? ` · attempted ${priorSubmission.timesAttempted}×` : ""}
                {" "}— relaunching starts a fresh attempt.
              </p>
            )}
          </div>

          <button
            type="button"
            className="sandbox-fullscreen-trigger-btn"
            onClick={() => {
              if (!rawHtmlPayload || rawHtmlPayload.trim() === "") {
                console.warn("⚠️ Cannot launch workspace: HTML source payload code string is empty.");
                return;
              }
              if (typeof updateFields === "function") {
                updateFields("activeSandboxPayload", rawHtmlPayload);
              }
            }}
          >
            Launch Fullscreen Workspace →
          </button>
        </div>
      );
    }

    return (
      <div className="quiz-unsupported-node font-monospace">
        ⚠️ [SYSTEM EXCEPTION]: Unknown card payload structure detected.
      </div>
    );
  };

  return (
    <div className="quiz-card-sleeve-container-shell">
      {renderCardContent()}
    </div>
  );
}