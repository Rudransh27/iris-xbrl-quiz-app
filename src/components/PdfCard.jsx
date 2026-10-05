// src/components/PdfCard.jsx
import React, { useState, useEffect } from 'react';
import './PdfCard.css';

export default function PdfCard({ pdfUrl, title, description }) {
  const [engineType, setEngineType] = useState('google'); // 'google' | 'microsoft' | 'native'
  const cleanPdfUrl = pdfUrl ? pdfUrl.trim().replace(/^"|"$/g, '') : "";

  // Rewrites Cloudinary paths dynamically to force an inline view stream instead of a file download
  const inlinePdfUrl = cleanPdfUrl
    ? cleanPdfUrl.replace('/upload/', '/upload/fl_inline/')
    : "";

  const getEmbedUrl = () => {
    if (!inlinePdfUrl) return "";
    if (engineType === 'google') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(inlinePdfUrl)}&embedded=true`;
    }
    if (engineType === 'microsoft') {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(inlinePdfUrl)}`;
    }
    return `${inlinePdfUrl}#toolbar=1&navpanes=0`;
  };

  useEffect(() => {
    setEngineType('google');
  }, [pdfUrl]);

  const handleEngineCycle = () => {
    if (engineType === 'google') {
      setEngineType('microsoft');
    } else if (engineType === 'microsoft') {
      setEngineType('native');
    }
  };

  return (
    <div className="pdf-card-wrapper ui-card text-start">
      <div className="pdf-card-head d-flex align-items-center justify-content-between">
        <div>
          {title && <h3 className="pdf-card-title fw-bold m-0">{title}</h3>}
          {description && <p className="pdf-card-description small m-0 mt-1">{description}</p>}
        </div>
        {cleanPdfUrl && (
          <span className="pdf-mode-badge ui-badge ui-badge--outline">
            Mode: {engineType.toUpperCase()}
          </span>
        )}
      </div>

      <div
        className="pdf-viewer-canvas-frame position-relative"
      >
        {!cleanPdfUrl ? (
          <div className="pdf-empty-state p-5 text-center">
            ⚠️ No valid cloud path found.
          </div>
        ) : (
          <>
            <iframe
              src={getEmbedUrl()}
              width="100%"
              height="100%"
              title={title || "PDF Viewer"}
              frameBorder="0"
              allowFullScreen
            ></iframe>

            <div className="pdf-engine-switch-wrap position-absolute bottom-0 start-0 m-2">
              <button
                type="button"
                className="pdf-engine-switch-btn ui-btn ui-btn--secondary ui-btn--sm"
                onClick={handleEngineCycle}
                disabled={engineType === 'native'}
              >
                {engineType === 'native' ? "✅ Browser Native Mode" : "🔄 Preview Blank? Switch Engine"}
              </button>
            </div>
          </>
        )}
      </div>

      {cleanPdfUrl && (
        <div className="pdf-card-foot text-end">
          <a
            href={inlinePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-open-link-btn ui-btn ui-btn--secondary ui-btn--sm"
          >
            ↗ Open PDF In New Window
          </a>
        </div>
      )}
    </div>
  );
}
