// src/components/DynamicCardRenderer.jsx
import React, { useState } from 'react';
import { ShieldCheck, Table, BoxArrowUpRight, ClipboardData, ArrowRightCircle } from 'react-bootstrap-icons';
import './DynamicCardRenderer.css';

// 🧱 WELCOME HERO SPLASH LAYOUT
const WelcomeSplash = ({ payload, onStart }) => (
  <div className="surface-hero-splash animate-fade-up">
    <div className="splash-banner-gradient">
      <span className="splash-badge-tag">{payload.badgeTag || "IRIS ATELIER LEARNING"}</span>
      <h1 className="splash-title-text">{payload.title}</h1>
      <p className="splash-subtitle-text">{payload.subtitle}</p>
      {onStart && (
        <button className="splash-action-btn" onClick={onStart}>
          {payload.buttonText || "Let's Begin →"}
        </button>
      )}
    </div>
    <div className="splash-bullets-card">
      <h3 className="bullets-heading">🗺️ Curriculum Trajectory Tracks</h3>
      <ul className="splash-bullets-list">
        {payload.metaBullets?.map((bullet, idx) => (
          <li key={idx} className="splash-bullet-item">
            <span className="bullet-icon-marker">📄</span>
            <span className="bullet-text-string">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// 🧱 INTERACTIVE GRID / COLUMNS / ACCORDION LAYOUT
const InteractiveGrid = ({ payload }) => {
  const [activeTileIndex, setActiveTileIndex] = useState(null);

  return (
    <div className="surface-interactive-grid animate-fade-up">
      <div className="section-header-block">
        <h2 className="template-main-title">{payload.title}</h2>
        <p className="template-subtitle-text">{payload.subtitle}</p>
      </div>

      {payload.layoutStyle === "accordion_list" ? (
        <div className="accordion-layout-stack">
          {payload.tiles?.map((tile, idx) => (
            <div key={idx} className="accordion-item-wrapper">
              <div 
                className={`accordion-trigger-row theme-${tile.colorTheme || 'teal'} ${activeTileIndex === idx ? 'open' : ''}`}
                onClick={() => setActiveTileIndex(activeTileIndex === idx ? null : idx)}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="accordion-badge">{tile.tag}</span>
                  <strong className="accordion-name">{tile.name}</strong>
                </div>
                <span className="accordion-arrow-indicator">{activeTileIndex === idx ? '▲' : '▼'}</span>
              </div>
              {activeTileIndex === idx && (
                <div className="accordion-expanded-body animate-fade-down">
                  <p>{tile.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid-layout-deck">
            {payload.tiles?.map((tile, idx) => (
              <div 
                key={idx} 
                className={`grid-tile-card theme-${tile.colorTheme || 'teal'} ${activeTileIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveTileIndex(activeTileIndex === idx ? null : idx)}
              >
                <div className="tile-tag-header">{tile.tag}</div>
                <h4 className="tile-main-name">{tile.name}</h4>
                <p className="tile-desc-text">{tile.description}</p>
              </div>
            ))}
          </div>
          {activeTileIndex !== null && payload.tiles[activeTileIndex] && (
            <div className={`grid-detail-display-box theme-${payload.tiles[activeTileIndex].colorTheme} animate-fade-down`}>
              <div dangerouslySetInnerHTML={{ __html: payload.tiles[activeTileIndex].expandedContent || payload.tiles[activeTileIndex].description }} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 🧱 TASK TIMELINE SEQUENTIAL LAYOUT
const TaskTimeline = ({ payload }) => (
  <div className="surface-task-timeline animate-fade-up">
    <div className="section-header-block">
      <h2 className="template-main-title">{payload.title}</h2>
      <p className="template-subtitle-text">{payload.subtitle}</p>
    </div>
    <div className="timeline-vertical-track">
      {payload.steps?.map((step, idx) => (
        <div key={idx} className="timeline-step-row">
          <div className="timeline-numeric-node">{step.stepNumber || idx + 1}</div>
          <div className="timeline-content-card">
            <h4 className="step-card-title">{step.title}</h4>
            <p className="step-card-text">{step.text}</p>
            {step.codeSnippetMock && (
              <pre className="step-terminal-mock">
                <code>{step.codeSnippetMock}</code>
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 🧱 RESEARCH TASK / SCAVENGER HUNT INTERACTIVE FORM
const ResearchTask = ({ payload }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (fieldIndex, val) => {
    setAnswers(prev => ({ ...prev, [fieldIndex]: val }));
  };

  const evaluateScavengerHunt = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="surface-research-task animate-fade-up">
      <div className="research-action-banner-frame">
        <h3 className="research-banner-title">{payload.title}</h3>
        <p className="research-banner-subtitle">{payload.subtitle || payload.taskInstructions}</p>
        {payload.externalLinkUrl && (
          <a href={payload.externalLinkUrl} target="_blank" rel="noreferrer" className="research-hyperlink-btn">
            <BoxArrowUpRight size={13} className="me-2" /> {payload.linkButtonText || "Launch External Registry ↗"}
          </a>
        )}
      </div>

      {payload.isScavengerHunt && (
        <form onSubmit={evaluateScavengerHunt} className="scavenger-hunt-form-wrapper">
          <h4 className="scavenger-form-heading"><ClipboardData className="me-2 text-primary" /> Verify Registry Diagnostics Data</h4>
          {payload.scavengerQuestions?.map((q, idx) => {
            const cleanUserAns = (answers[idx] || "").trim().toLowerCase().replace(/[-\s]/g, "");
            const cleanTargetAns = q.expectedAnswer?.trim().toLowerCase().replace(/[-\s]/g, "");
            const isCorrect = cleanUserAns === cleanTargetAns;

            return (
              <div key={idx} className="scavenger-input-group">
                <label className="scavenger-input-label">{q.fieldLabel}</label>
                <input 
                  type="text" 
                  className="scavenger-form-input"
                  placeholder="Type resolved parameter string..."
                  value={answers[idx] || ""}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  disabled={submitted}
                  required
                />
                {submitted && (
                  <div className={`scavenger-feedback-row ${isCorrect ? 'correct-status' : 'wrong-status'}`}>
                    {isCorrect ? `✅ Verified: ${q.expectedAnswer}` : `❌ Flagged: Expected "${q.expectedAnswer}". Hint: ${q.explanationHint}`}
                  </div>
                )}
              </div>
            );
          })}
          {!submitted ? (
            <button type="submit" className="scavenger-submit-btn">Validate Answers</button>
          ) : (
            <button type="button" className="scavenger-retry-btn" onClick={() => setSubmitted(false)}>Reset Diagnostic Deck ↺</button>
          )}
        </form>
      )}
    </div>
  );
};

// 🛡️ CENTRAL TEMPLATE ROUTER SWITCHBOARD
export default function DynamicCardRenderer({ card, onNextScreen }) {
  if (!card) return null;

  switch (card.templateType) {
    case "welcome_splash":
      return <WelcomeSplash payload={card.payload} onStart={onNextScreen} />;
    case "interactive_grid":
      return <InteractiveGrid payload={card.payload} />;
    case "task_timeline":
      return <TaskTimeline payload={card.payload} />;
    case "research_task":
      return <ResearchTask payload={card.payload} />;
    default:
      return (
        <div className="standard-text-fallback">
          <h2>{card.payload?.title || "Knowledge Screen"}</h2>
          <p>{card.payload?.subtitle || "Review layout content documents."}</p>
        </div>
      );
  }
}