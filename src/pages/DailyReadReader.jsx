// src/pages/DailyReadReader.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar3, Person, Bookmark } from "react-bootstrap-icons";
import api from "../admin/services/api";
import AuthContext from "../context/AuthContext";
import "./DailyReadReader.css";

const READ_THRESHOLD_MS = 30000;

export default function DailyReadReader() {
  const { readId } = useParams();
  const navigate = useNavigate();
  const { celebrateStreakAction } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleDetails = async () => {
      try {
        const res = await api.getAllDailyReads();
        const allArticles = res?.data || res || [];
        // Match the target item id securely out of the history array
        const targetArticle = allArticles.find(item => (item._id || item.id) === readId);
        setArticle(targetArticle);
      } catch (err) {
        console.error("Reader Core: Failed to fetch historical document stream", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticleDetails();
  }, [readId]);

  // Checklist Task 1 (Today's Read): only checks off once the user has spent
  // at least 30 REAL seconds actively on this page. "Actively" means the tab
  // is visible — time spent backgrounded/minimized doesn't accumulate, so a
  // user can't satisfy this by opening the tab and walking away.
  const accumulatedMsRef = useRef(0);
  const lastTickRef = useRef(0);
  useEffect(() => {
    if (!article) return;
    let marked = false;
    lastTickRef.current = Date.now();

    const intervalId = setInterval(() => {
      if (marked) return;
      const now = Date.now();
      if (document.visibilityState === "visible") {
        accumulatedMsRef.current += now - lastTickRef.current;
      }
      lastTickRef.current = now;

      if (accumulatedMsRef.current >= READ_THRESHOLD_MS) {
        marked = true;
        // 🎯 The server (User.engagementHistory, via verifyDailyStreak) is
        // now the ONLY record of "did the read happen today" — the old
        // separate localStorage markDay() call here was a second,
        // independent copy of the same fact that could silently drift out
        // of sync with the server (see the dashboard calendar bug this
        // fixed). OrbitWorkspace's dashboard picks this up on its next
        // mount/fetch, since it always re-fetches fresh streak data.
        // celebrateStreakAction (AuthContext) both syncs xp/streak here and
        // arms the celebration overlay if this is today's first qualifying action.
        celebrateStreakAction("daily_read");
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [article]);

  if (loading) {
    return (
      <div className="daily-reader-loader">
        <div className="daily-reader-spinner"></div>
        <span>Parsing article stream array...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="daily-reader-shell layout-error-padding">
        <button type="button" onClick={() => navigate("/orbit")} className="daily-reader-back-btn">
          <ArrowLeft size={14} /> Back to Orbit
        </button>
        <div className="daily-reader-error-card">
          <h4>Article Node Disconnected</h4>
          <p>The requested newsletter could not be pulled from your department tenant records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-reader-shell">
      {/* Return Navigation Anchor */}
      <button type="button" onClick={() => navigate("/orbit")} className="daily-reader-back-btn">
        <ArrowLeft size={14} /> Back to Orbit Workspace
      </button>

      {/* Main Content Article Panel */}
      <div className="daily-reader-article-card">

        {/* Banner Image */}
        {article.imageUrl && (
          <div className="daily-reader-banner-wrap">
            <img src={article.imageUrl} alt={article.title} className="daily-reader-banner-img" />
          </div>
        )}

        {/* Tags Stack Ribbon */}
        {article.tags && article.tags.length > 0 && (
          <div className="daily-reader-tags-ribbon">
            {article.tags.map((tag, i) => (
              <span key={i} className="daily-reader-tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="daily-reader-headline">
          {article.title}
        </h1>

        {/* Metadata Floor Line */}
        <div className="daily-reader-meta-row">
          <span className="meta-item"><Person size={14} /> Published by System Authority</span>
          <span className="meta-item"><Calendar3 size={14} /> {new Date(article.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="meta-item"><Bookmark size={14} /> Departmental Feed</span>
        </div>

        {/* Content Body Display Arena — rendered as Markdown for proper
            headings/emphasis/lists/links instead of one plain-text blob. */}
        <div className="daily-reader-body-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* External References Foot Block */}
        {article.referenceLink && (
          <div className="daily-reader-reference-box">
            <div className="reference-title-lbl">External Reference Materials</div>
            <a href={article.referenceLink} target="_blank" rel="noreferrer" className="reference-anchor-link">
              {article.referenceLink}
            </a>
          </div>
        )}
        
      </div>
    </div>
  );
}