// src/components/PptCard.jsx
import React, { useState, useEffect } from 'react';

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
    <div className="ppt-card-wrapper text-start animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          {title && <h3 className="fw-bold text-dark m-0">{title}</h3>}
          {description && <p className="text-secondary small m-0 mt-1">{description}</p>}
        </div>
        {cleanPptUrl && (
          <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
            Active View: {engineType.toUpperCase()}
          </span>
        )}
      </div>

      <div
        className="ppt-viewer-canvas-frame border rounded bg-light shadow-sm position-relative"
      >
        {!cleanPptUrl ? (
          <div className="p-5 text-center text-muted font-monospace small">
            ⚠️ No valid presentation resource path assigned.
          </div>
        ) : engineType === 'failed' ? (
          <div className="p-5 text-center d-flex flex-column align-items-center justify-content-center h-100">
            <span style={{ fontSize: '32px' }}>📊</span>
            <h6 className="fw-bold text-dark mt-2">Inline Presentation Render Stalled</h6>
            <p className="text-muted small text-center" style={{ maxWidth: '340px' }}>
              Your network profile or corporate proxy configurations are blocking automated inline viewers from accessing this slide layout deck.
            </p>
            <a 
              href={cleanPptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm px-4 fw-semibold mt-1"
              style={{ backgroundColor: 'var(--amber-glow, #ff9f1c)', borderColor: 'var(--amber-glow, #ff9f1c)', color: '#fff' }}
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
              style={{ border: 'none' }}
              frameBorder="0"
              allowFullScreen
            ></iframe>
            
            {/* Fail-safe controller button layer overlapping background coordinates */}
            <div 
              className="position-absolute bottom-0 start-0 m-2 bg-white p-1 rounded border shadow-sm d-flex gap-1"
              style={{ zIndex: 10 }}
            >
              <button
                type="button"
                className="btn btn-light border-0 text-secondary fw-semibold font-monospace"
                style={{ fontSize: '9px', padding: '2px 6px' }}
                onClick={handleEngineTimeout}
              >
                🔄 Refresh / Switch Viewer Engine
              </button>
            </div>
          </>
        )}
      </div>

      {cleanPptUrl && engineType !== 'failed' && (
        <div className="mt-2 text-end">
          <a 
            href={cleanPptUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-sm btn-outline-secondary font-monospace"
            style={{ fontSize: '11px', borderRadius: '4px' }}
          >
            ↗ View Native Slide Deck Asset Source
          </a>
        </div>
      )}
    </div>
  );
}