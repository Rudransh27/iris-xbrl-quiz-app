// src/components/PdfCard.jsx
import React, { useState, useEffect } from 'react';

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
    <div className="pdf-card-wrapper text-start">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          {title && <h3 className="fw-bold text-dark m-0">{title}</h3>}
          {description && <p className="text-secondary small m-0 mt-1">{description}</p>}
        </div>
        {cleanPdfUrl && (
          <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '10px' }}>
            Mode: {engineType.toUpperCase()}
          </span>
        )}
      </div>

      <div
        className="pdf-viewer-canvas-frame border rounded bg-light position-relative"
      >
        {!cleanPdfUrl ? (
          <div className="p-5 text-center text-muted font-monospace small">
            ⚠️ No valid cloud path found.
          </div>
        ) : (
          <>
            <iframe
              src={getEmbedUrl()}
              width="100%"
              height="100%"
              title={title || "PDF Viewer"}
              style={{ border: 'none' }}
              frameBorder="0"
              allowFullScreen
            ></iframe>
            
            <div className="position-absolute bottom-0 start-0 m-2 bg-white p-1 rounded border shadow-sm" style={{ zIndex: 10 }}>
              <button
                type="button"
                className="btn btn-light border-0 text-secondary fw-semibold font-monospace"
                style={{ fontSize: '10px', padding: '2px 8px' }}
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
        <div className="mt-2 text-end">
          <a 
            href={inlinePdfUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-sm btn-outline-secondary font-monospace"
            style={{ fontSize: '11px' }}
          >
            ↗ Open PDF In New Window
          </a>
        </div>
      )}
    </div>
  );
}