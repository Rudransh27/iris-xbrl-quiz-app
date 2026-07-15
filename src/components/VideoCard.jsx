// src/components/VideoCard.jsx
import React, { useRef, useEffect } from "react";
import "./VideoCard.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InfoCircleFill, TagFill, PlayCircleFill } from "react-bootstrap-icons";

export default function VideoCard({ videoUrl, title, description, thumbnailUrl, tags = [], onVideoEnded }) {
  const videoRef = useRef(null);
  // Accumulated "actually watched" seconds (native path only) — only counts
  // small, contiguous timeupdate deltas while the tab is visible, so seeking
  // ahead or letting it play in a background tab doesn't count toward 100%.
  const watchedSecondsRef = useRef(0);
  const lastTimeRef = useRef(0);
  const hasReportedCompletionRef = useRef(false);

  // 🎯 Extract YouTube Video ID and convert to Embed format safely
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  const youtubeId = getYouTubeEmbedUrl(videoUrl);

  const reportCompletionOnce = () => {
    if (hasReportedCompletionRef.current) return;
    hasReportedCompletionRef.current = true;
    if (onVideoEnded) onVideoEnded();
  };

  // 🚀 Handle YouTube Iframe Message Stream for completion state tracking.
  // The raw postMessage embed here can't expose granular timeupdate progress
  // (that requires the full YT.Player JS API, not just message-sniffing), so
  // completion stays tied to the "ended" state — but gated on tab visibility
  // as a cheap integrity backstop, since a backgrounded tab can't legitimately
  // reach a real "ended" event anyway.
  useEffect(() => {
    if (!youtubeId || !onVideoEnded) return;

    const handleYoutubeMessage = (event) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        // data.info === 0 implies YT.PlayerState.ENDED
        if (data.event === "infoDelivery" && data.info && data.info.playerState === 0) {
          if (document.visibilityState === "visible") {
            console.log("🎥 [YouTube Engine] Video stream reached end boundaries.");
            reportCompletionOnce();
          }
        }
      } catch (err) {
        // Safe fail suppression
      }
    };

    window.addEventListener("message", handleYoutubeMessage);
    return () => window.removeEventListener("message", handleYoutubeMessage);
  }, [youtubeId, onVideoEnded]);

  // 🎯 Native <video> engagement tracker: timeupdate accumulates watched time
  // (filtering out seek/scrub jumps and background-tab time), marking the
  // card complete once ~fully watched — no per-tick network write, just a
  // single ref-guarded callback fire on the completion transition.
  const handleNativeTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || hasReportedCompletionRef.current) return;

    const currentTime = video.currentTime;
    const delta = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Only count small, forward, contiguous deltas made while the tab is
    // actually visible — this is what filters out seeking ahead and
    // background-tab "watching".
    if (delta > 0 && delta < 2 && document.visibilityState === "visible") {
      watchedSecondsRef.current += delta;
    }

    if (video.duration > 0 && watchedSecondsRef.current / video.duration >= 0.99) {
      console.log("🎥 [Native Engine] Watched-percentage threshold reached (~100%).");
      reportCompletionOnce();
    }
  };

  const handleNativeSeeked = () => {
    // A seek breaks delta-continuity — resync the reference point so the
    // next timeupdate doesn't register a huge (and thus filtered-out) jump
    // as a legitimate watched delta, without double-counting either.
    if (videoRef.current) lastTimeRef.current = videoRef.current.currentTime;
  };

  return (
    <div className="video-training-card animate-fade-in">
      
      {/* =========================================================================
         🎬 PREMIUM GLASSMORPHIC FILM CONTAINER VIEWPORT
         ========================================================================= */}
      <div className="video-player-viewport-wrapper shadow-inner">
        {videoUrl ? (
          <div className="video-player-container-box">
            
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
                title={title || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="frontend-iframe-video-node"
              ></iframe>
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                controls
                className="frontend-native-video-node"
                controlsList="nodownload"
                playsInline
                onTimeUpdate={handleNativeTimeUpdate}
                onSeeked={handleNativeSeeked}
                onEnded={() => {
                  console.log("🎥 [Native Engine] MP4 baseline buffered stream ended safely.");
                  reportCompletionOnce();
                }}
              >
                Your browser does not support the video tag infrastructure tracking.
              </video>
            )}

          </div>
        ) : (
          <div className="video-error-placeholder-box d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <PlayCircleFill size={48} className="text-muted opacity-50 mb-3" />
            <span className="font-monospace text-secondary small">
              [STREAM RUNTIME ERROR]: Video stream address context path missing or unresolved.
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
         📝 ELITE INFO CONTAINER FLOOR 
         ========================================================================= */}
      <div className="video-metadata-details-floor">
        <h3 className="video-component-headline fw-bold">
          {title || "👉 Untitled Streaming Session Block"}
        </h3>

        {tags && tags.length > 0 && (
          <div className="video-tags-stack-ribbon d-flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag, tIdx) => (
              <span key={tIdx} className="video-custom-badge-pill font-monospace">
                <TagFill size={9} className="me-1" /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="video-session-notes-box rounded-3 border">
          <div className="notes-header-indicator border-bottom bg-white px-3 py-2 d-flex align-items-center gap-1.5 fw-bold font-monospace">
            <InfoCircleFill size={12} style={{ color: 'var(--amber-glow-dark, #e08600)' }} />
            <span>SESSION CORE NOTES MATRIX</span>
          </div>
          
          <div className="video-markdown-body markdown-body p-3 text-start">
            {description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
            ) : (
              <p className="text-muted italic small font-monospace m-0">
                No supplemental documentation metrics compiled inside this learning asset.
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}