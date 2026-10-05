// src/components/PptCard.jsx
import React, { useState, useEffect } from 'react';
import './PptCard.css';

export default function PptCard({ pptUrl, title, description }) {
  const [engineType, setEngineType] = useState('google'); // 'google' | 'microsoft' | 'failed'
  const cleanPptUrl = pptUrl ? pptUrl.trim().replace(/^"|"$/g, '') : "";

  // Dynamic endpoint generator based on fallback state
  const getEmbedUrl = () => {
    if (!cleanPptUrl) return "";
    if (engineType === 'google') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(cleanPptUrl)}&embedded=true`;
    }
    if (engineType === 'microsoft') {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(cleanPptUrl)}`;
    }
    return "";
  };

  // Automated health check: Reset type on resource URL modification streams
  useEffect(() => {
    setEngineType('google');
  }, [pptUrl]);

  const handleEngineTimeout = () => {
    if (engineType === 'google') {
      console.warn("⚠️ Google view engine stalled. Migrating pipeline to Microsoft Core...");
      setEngineType('microsoft');
    } else if (engineType === 'microsoft') {
      console.error("❌ Both rendering clusters rejected access. Forcing client-side anchor fallback.");
      setEngineType('failed');
    }
  };

  return (
    <div className="ppt-card-wrapper ui-card text-start animate-fade-in">
      <div className="ppt-card-head d-flex align-items-center justify-content-between">
        <div>
          {title && <h3 className="ppt-card-title fw-bold m-0">{title}</h3>}
          {description && <p className="ppt-card-description small m-0 mt-1">{description}</p>}
        </div>
        {cleanPptUrl && (
          <span className="ppt-mode-badge ui-badge ui-badge--outline">
            Active View: {engineType.toUpperCase()}
          </span>
        )}
      </div>

      <div
        className="ppt-viewer-canvas-frame position-relative"
      >
        {!cleanPptUrl ? (
          <div className="ppt-empty-state p-5 text-center">
            ⚠️ No valid presentation resource path assigned.
          </div>
        ) : engineType === 'failed' ? (
          <div className="p-5 text-center d-flex flex-column align-items-center justify-content-center h-100">
            <span className="ppt-failed-emoji">📊</span>
            <h6 className="ppt-card-title fw-bold mt-2">Inline Presentation Render Stalled</h6>
            <p className="ppt-card-description ppt-failed-text small text-center">
              Your network profile or corporate proxy configurations are blocking automated inline viewers from accessing this slide layout deck.
            </p>
            <a
              href={cleanPptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ppt-download-btn ui-btn ui-btn--primary ui-btn--sm mt-1"
            >
              Download & Open Slide Deck Directly
            </a>
          </div>
        ) : (
          <>
            <iframe
              src={getEmbedUrl()}
              width="100%"
              height="100%"
              title={title || "Slide Presentation Viewer"}
              frameBorder="0"
              allowFullScreen
            ></iframe>

            {/* Fail-safe controller button layer overlapping background coordinates */}
            <div
              className="ppt-engine-switch-wrap position-absolute bottom-0 start-0 m-2 d-flex gap-1"
            >
              <button
                type="button"
                className="ppt-engine-switch-btn ui-btn ui-btn--secondary ui-btn--sm"
                onClick={handleEngineTimeout}
              >
                🔄 Refresh / Switch Viewer Engine
              </button>
            </div>
          </>
        )}
      </div>

      {cleanPptUrl && engineType !== 'failed' && (
        <div className="ppt-card-foot text-end">
          <a
            href={cleanPptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ppt-open-link-btn ui-btn ui-btn--secondary ui-btn--sm"
          >
            ↗ View Native Slide Deck Asset Source
          </a>
        </div>
      )}
    </div>
  );
}
