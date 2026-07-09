// src/components/IdeasAndRD.jsx
import React, { useState, useEffect, useContext } from "react";
import { Form, Alert, Spinner } from "react-bootstrap";
import { Lightbulb, ChatLeftText, Tags, Lock, Send, Eye, FileText } from "react-bootstrap-icons";
import AuthContext from "../context/AuthContext";
import api from "../admin/services/api";
import { toDateKey, loadHistory, markDay } from "./OrbitDashboard/dashboardStorage";
import "./IdeasAndRD.css";

export default function IdeasAndRD() {
  const { user } = useContext(AuthContext);

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
      // successful submission — never on click.
      const userId = user?._id || "guest";
      const todayKey = toDateKey(new Date());
      markDay(userId, loadHistory(userId), todayKey, { idea: true });
      if (typeof api.verifyDailyStreak === "function") {
        api.verifyDailyStreak("idea_submission").catch(() => {});
      }
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
    <div className="premium-workspace-shell">
      <div className="workspace-grid-row">
        
        {/* ================= LEFT CREATION STUDIO ================= */}
        <div className="workspace-column-left">
          <div className="studio-card">
            <div className="studio-header">
              <div className="header-icon-box">
                <Lightbulb size={20} />
              </div>
              <div>
                <h4 className="studio-title">Ideas & R&D Studio</h4>
                <p className="studio-subtitle">Fortnightly review track by Product Council</p>
              </div>
            </div>

            {alertMsg.text && (
              <Alert variant={alertMsg.variant} className="studio-alert-banner">
                {alertMsg.text}
              </Alert>
            )}

            <Form onSubmit={handleIdeaSubmission} className="studio-form">
              <Form.Group className="mb-3">
                <Form.Label className="studio-field-lbl">
                  <ChatLeftText size={13} /> Abstract Summary
                </Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Your innovation in one clear line..." 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  disabled={submitting} 
                  required 
                  className="studio-input"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="studio-field-lbl">
                  <FileText size={13} /> Full Specifications
                </Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  placeholder="Elaborate on structural execution flow (what, why, for whom)..." 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  disabled={submitting} 
                  required 
                  className="studio-input text-area-fix"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="studio-field-lbl">
                  <Tags size={13} /> Classification Segment
                </Form.Label>
                <div className="chiclet-matrix">
                  {["product", "market", "process", "publish"].map((tagName) => (
                    <label 
                      key={tagName} 
                      className={`chiclet-pill-target ${selectedTag === tagName ? "chiclet-active" : ""}`}
                    >
                      <input 
                        type="radio" 
                        name="rdTags" 
                        value={tagName} 
                        checked={selectedTag === tagName} 
                        onChange={() => setSelectedTag(tagName)}
                        disabled={submitting}
                      />
                      <span className="text-uppercase">{tagName}</span>
                    </label>
                  ))}
                </div>
              </Form.Group>

              <div className="studio-compliance-banner">
                <Lock size={12} />
                <span>Encrypted Channel: Visible only to author and reviewers</span>
              </div>

              <button type="submit" disabled={submitting} className="studio-action-submit">
                {submitting ? <Spinner animation="border" size="sm" /> : <><Send size={13} /> Dispatch Innovation</>}
              </button>
            </Form>
          </div>
        </div>

        {/* ================= RIGHT METRICS FEED ================= */}
        <div className="workspace-column-right">
          <div className="feed-meta-row">
            <h5 className="feed-meta-title">
              <Eye size={16} /> Submission Directory
            </h5>
            <span className="feed-counter-pill">{myIdeas.length} Registered</span>
          </div>

          {loadingHistory ? (
            <div className="feed-loading-portal">
              <Spinner animation="border" variant="primary" />
              <p>Syncing node timeline layers...</p>
            </div>
          ) : myIdeas.length === 0 ? (
            <div className="feed-empty-placeholder">
              No checked entries found in this directory index loop.
            </div>
          ) : (
            <div className="feed-scrollable-stack">
              {myIdeas.map((idea) => {
                const readableDate = new Date(idea.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={idea._id} className="feed-item-card">
                    <div className="feed-card-top-header">
                      <div className="meta-left-group">
                        <span className={`feed-status-pill badge-tint-${idea.status?.toLowerCase()}`}>
                          {idea.status || "Dispatched"}
                        </span>
                        <span className="feed-timestamp">{readableDate}</span>
                      </div>
                      <span className="feed-segment-marker">#{idea.tag}</span>
                    </div>

                    <h4 className="feed-idea-title">{idea.title}</h4>
                    <p className="feed-idea-details">{idea.details}</p>

                    {idea.curatorFeedback && (
                      <div className="feed-response-container">
                        <div className="response-badge">Official Evaluation</div>
                        <p className="response-text">"{idea.curatorFeedback}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}