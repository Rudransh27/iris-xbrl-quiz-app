// src/components/IdeasAndRD.jsx
import React, { useState, useEffect, useContext } from "react";
import { Form } from "react-bootstrap";
import { ChatLeftText, Tags, Lock, Send, Eye, FileText } from "react-bootstrap-icons";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import { PageHeader } from "./ui";
import OrbitFooter from "./OrbitDashboard/OrbitFooter";
import "./IdeasAndRD.css";

export default function IdeasAndRD() {
  const { user, celebrateStreakAction } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [selectedTag, setSelectedTag] = useState("product");
  const [authorName] = useState(user?.username || user?.name || "Anonymous Member");
  const [authorEmail] = useState(user?.email || "no-email@iris.com");

  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [myIdeas, setMyIdeas] = useState([]);
  const [alertMsg, setAlertMsg] = useState({ text: "", variant: "" });

  const fetchUserIdeasHistory = async () => {
    setLoadingHistory(true);
    try {
      if (api.getUserIdeas) {
        const res = await api.getUserIdeas();
        setMyIdeas(res?.data || res || []);
      } else {
        setMyIdeas([
          {
            _id: "demo-1",
            title: "All application subscriptions require prior approval; subscriptions exceeding ₹1,0,000 must be approved by the Business Head or CTO before commitment.",
            details: "Scrutinize SaaS bills cleanly.",
            tag: "process",
            status: "Building",
            createdAt: "2026-04-25T12:00:00.000Z",
            curatorFeedback: "Thanks, this is a very good suggestion and has been approved. FYI: This process has been taken up by the internal committee. As next steps: we will document it and communicate it soon."
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load historical tracks:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUserIdeasHistory();
  }, []);

  const handleIdeaSubmission = async (e) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) {
      setAlertMsg({ text: "Please provide both a summary and details.", variant: "danger" });
      return;
    }

    setSubmitting(true);
    setAlertMsg({ text: "", variant: "" });

    const ideaPayload = {
      title: title.trim(),
      details: details.trim(),
      userName: authorName,
      userEmail: authorEmail,
      tag: selectedTag
    };

    try {
      await api.submitIdeaNode(ideaPayload);
      setAlertMsg({ text: "Innovation securely dispatched to Product Council pipeline.", variant: "success" });
      // Checklist Task 3 (Idea Submission): only checks off on a confirmed,
      // successful submission — never on click. The server (via
      // verifyDailyStreak) is the sole record of this now; the dashboard
      // picks it up on its next fetch, so there's no separate local copy to
      // keep in sync anymore. celebrateStreakAction also arms the
      // celebration overlay if this is today's first qualifying action.
      celebrateStreakAction("idea_submission");
      setTitle("");
      setDetails("");
      fetchUserIdeasHistory();
    } catch (err) {
      setAlertMsg({ text: err.message || "Failed to submit concept asset.", variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-page ui-page--narrow ideas-page">
      <PageHeader
        eyebrow="Community"
        title="Ideas & R&D"
        subtitle="Submit an idea, track its status, and see what the Product Council decided — every fortnight."
      />

      {/* ================= CREATION STUDIO ================= */}
      <div className="ui-card ideas-form-card">
        {alertMsg.text && (
          <div className={`ui-callout ui-callout--${alertMsg.variant === "success" ? "success" : "danger"}`} role="alert">
            {alertMsg.text}
          </div>
        )}

        <Form onSubmit={handleIdeaSubmission} className="ideas-form">
          <div className="ui-field">
            <label className="ui-label ideas-label" htmlFor="idea-title">
              <ChatLeftText size={14} /> Abstract Summary
            </label>
            <input
              id="idea-title"
              type="text"
              placeholder="Your innovation in one clear line..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              required
              className="ui-input"
            />
          </div>

          <div className="ui-field">
            <label className="ui-label ideas-label" htmlFor="idea-details">
              <FileText size={14} /> Full Specifications
            </label>
            <textarea
              id="idea-details"
              rows={4}
              placeholder="Elaborate on structural execution flow (what, why, for whom)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={submitting}
              required
              className="ui-textarea"
            />
          </div>

          <div className="ui-field">
            <span className="ui-label ideas-label">
              <Tags size={14} /> Classification Segment
            </span>
            <div className="ideas-tag-row">
              {["product", "process", "technology", "culture"].map((tagName) => (
                <label
                  key={tagName}
                  className={`ideas-tag ${selectedTag === tagName ? "ideas-tag--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="rdTags"
                    value={tagName}
                    checked={selectedTag === tagName}
                    onChange={() => setSelectedTag(tagName)}
                    disabled={submitting}
                  />
                  <span>{tagName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ideas-note">
            <Lock size={13} />
            <span>Encrypted Channel: Visible only to author and reviewers</span>
          </div>

          <button type="submit" disabled={submitting} className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block">
            {submitting ? <span className="ui-spinner ideas-spinner" role="status" aria-label="Submitting" /> : <><Send size={14} /> Dispatch Innovation</>}
          </button>
        </Form>
      </div>

      {/* ================= SUBMISSION DIRECTORY ================= */}
      <section className="ideas-directory">
        <div className="ideas-directory__head">
          <h2 className="ideas-directory__title">
            <Eye size={16} /> Submission Directory
          </h2>
          <span className="ui-badge ui-badge--accent">{myIdeas.length} Registered</span>
        </div>

        {loadingHistory ? (
          <div className="ui-loading">
            <span className="ui-spinner ui-spinner--lg" role="status" aria-label="Loading" />
            <span>Syncing node timeline layers...</span>
          </div>
        ) : myIdeas.length === 0 ? (
          <div className="ui-empty">
            <p className="ui-small">No checked entries found in this directory index loop.</p>
          </div>
        ) : (
          <div className="ui-list">
            {myIdeas.map((idea) => {
              const readableDate = new Date(idea.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={idea._id} className="ui-list-item ideas-row">
                  <div className="ideas-row__top">
                    <span className={`ui-badge ${ideaStatusTone(idea.status)}`}>
                      {idea.status || "Dispatched"}
                    </span>
                    <span className="ideas-row__date">{readableDate}</span>
                    <span className="ideas-row__tag">#{idea.tag}</span>
                  </div>

                  <h3 className="ideas-row__title">{idea.title}</h3>
                  <p className="ideas-row__details">{idea.details}</p>

                  {idea.curatorFeedback && (
                    <div className="ideas-row__feedback">
                      <div className="ideas-row__feedback-label">Official Evaluation</div>
                      <p className="ideas-row__feedback-text">"{idea.curatorFeedback}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      <OrbitFooter />
    </div>
  );
}

// Status → ui-badge tone (statuses come from the Idea model enum).
function ideaStatusTone(status) {
  switch ((status || "").toLowerCase()) {
    case "in review": return "ui-badge--warning";
    case "building":  return "ui-badge--info";
    case "shipped":
    case "approved":  return "ui-badge--success";
    case "rejected":  return "ui-badge--danger";
    default:          return "";
  }
}