// src/admin/components/AdminCardForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Alert, Spinner, Row, Col, Badge } from "react-bootstrap";
import {
  LayoutTextWindow,
  PlayCircle,
  QuestionCircle,
  CodeSquare,
  Eye,
  FileEarmarkPdf,
  FileEarmarkSlides,
  WindowPlus,
} from "react-bootstrap-icons";
import api from "../services/api";

export default function AdminCardForm({
  modules = [],
  initialModuleId = "",
  initialTopicId = "",
  editData = null,
  onCardAdded,
  setActiveTab,
}) {
  const [selectedModule, setSelectedModule] = useState(initialModuleId);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId);

  // 🔀 DYNAMIC HYBRID ENGINE STATE DETECTOR
  const [moduleHasTopics, setModuleHasTopics] = useState(true);

  const [cardType, setCardType] = useState("knowledge");
  const [title, setTitle] = useState("");
  const [cardOrder, setCardOrder] = useState("1");

  // DOM Reference Nodes for explicitly clearing HTML5 file inputs
  const videoInputRef = useRef(null);
  const pptInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Video/Image Assets Handlers States
  const [videoSourceType, setVideoSourceType] = useState("file"); // file | url
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  // PPT and PDF Assets Handlers States
  const [pptSourceType, setPptSourceType] = useState("file"); // file | url
  const [pptFile, setPptFile] = useState(null);
  const [pptUrlInput, setPptUrlInput] = useState("");

  const [pdfSourceType, setPdfSourceType] = useState("file"); // file | url
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrlInput, setPdfUrlInput] = useState("");

  // 🚀 STANDALONE RAW INJECTED SANDBOX SOURCE STRINGS
  const [htmlSourceCode, setHtmlSourceCode] = useState("");

  // Type Specific Structures Form states
  const [markdownText, setMarkdownText] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState("");

  // Challenge Schema Hooks (XBRL Context Elements Matches)
  const [challengeCode, setChallengeCode] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [challengeValidator, setChallengeValidator] = useState("");
  const [challengeExplanation, setChallengeExplanation] = useState("");
  const [challengeTaxonomy, setChallengeTaxonomy] = useState("");
  const [challengeHint, setChallengeHint] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Safe Module Structural Scanner (Watches selectedModule AND modules array availability)
  useEffect(() => {
    if (selectedModule && modules && modules.length > 0) {
      const matchDoc = modules.find((m) => m._id?.toString() === selectedModule.toString());
      
      if (matchDoc) {
        const supportsTopics = matchDoc.hasTopics !== false;
        setModuleHasTopics(supportsTopics);
        
        if (!supportsTopics) {
          setTopics([]);
          setSelectedTopic("");
        }
      }
    }
  }, [selectedModule, modules]);

  // 2. Lazy Load Topics List from backend API safely
  useEffect(() => {
    const loadNestedTopics = async () => {
      if (!selectedModule || !moduleHasTopics) {
        setTopics([]);
        setSelectedTopic("");
        return;
      }
      setFetchingTopics(true);
      setError("");
      try {
        const fullModulePayload = await api.getModule(selectedModule);
        const fetchedTopics = fullModulePayload?.topics || [];
        setTopics(fetchedTopics);
      } catch (err) {
        console.error("Card Form Sync Error:", err);
        setError("Failed to fetch topics linked to this module.");
      } finally {
        setFetchingTopics(false);
      }
    };
    loadNestedTopics();
  }, [selectedModule, moduleHasTopics]);

  // 3. 🔥 BULLETPROOF HYDRATION HOOK (Handles type casting safely to protect against asynchronous racing)
  useEffect(() => {
    if (initialTopicId && topics && topics.length > 0 && !editData) {
      const matchedTopicDoc = topics.find(
        (t) => t._id?.toString() === initialTopicId.toString()
      );
      
      if (matchedTopicDoc) {
        setSelectedTopic(matchedTopicDoc._id.toString());
      }
    }
  }, [topics, initialTopicId, editData]);

  // 4. Next index order calculator loop for tracking sequence orders
  useEffect(() => {
    if (!editData && selectedModule) {
      if (moduleHasTopics && selectedTopic && topics.length > 0) {
        const targetTop = topics.find((t) => t._id?.toString() === selectedTopic.toString());
        const nextCardOrder = (targetTop?.cards?.length || 0) + 1;
        setCardOrder(nextCardOrder.toString());
      } else if (!moduleHasTopics) {
        const currentModuleDoc = modules.find((m) => m._id?.toString() === selectedModule.toString());
        const nextFlatCardOrder = (currentModuleDoc?.cards?.length || 0) + 1;
        setCardOrder(nextFlatCardOrder.toString());
      }
    }
  }, [selectedModule, selectedTopic, topics, moduleHasTopics, editData, modules]);

  // Edit hydration data stream decoder
  useEffect(() => {
    if (editData) {
      setCardType(editData.card_type || "knowledge");
      setCardOrder((editData.cardOrder || "1").toString());
      setTitle(editData.content?.title || "");

      const contentObj = editData.content || {};

      if (editData.card_type === "knowledge") {
        setMarkdownText(contentObj.text || "");
      } else if (editData.card_type === "html_sandbox") {
        setHtmlSourceCode(contentObj.htmlSource || contentObj.text || "");
      } else if (editData.card_type === "quiz") {
        try {
          const parsedQuiz = JSON.parse(contentObj.text);
          setQuizOptions(parsedQuiz.options || ["", "", "", ""]);
          setCorrectOptionIdx(parsedQuiz.correctAnswerIndex || 0);
          setQuizExplanation(parsedQuiz.explanationHint || "");
        } catch (e) {
          setMarkdownText(contentObj.text || "");
        }
      } else if (editData.card_type === "code") {
        setChallengeCode(contentObj.code || "");
        setChallengeQuestion(contentObj.question || "");
        setChallengeValidator(contentObj.validator || "");
        setChallengeExplanation(contentObj.explanation || "");
        setChallengeTaxonomy(contentObj.taxonomy || "");
        setChallengeHint(contentObj.hint || "");
      } else if (editData.card_type === "video") {
        if (contentObj.videoUrl) {
          setVideoSourceType("url");
          setVideoUrlInput(contentObj.videoUrl || "");
        } else {
          setVideoSourceType("file");
        }
      } else if (editData.card_type === "ppt") {
        if (contentObj.pptUrl) {
          setPptSourceType("url");
          setPptUrlInput(contentObj.pptUrl || "");
        } else {
          setPptSourceType("file");
        }
      } else if (editData.card_type === "pdf") {
        if (contentObj.pdfUrl) {
          setPdfSourceType("url");
          setPdfUrlInput(contentObj.pdfUrl || "");
        } else {
          setPdfSourceType("file");
        }
      }
    }
  }, [editData]);

  const handleQuizOptionChange = (idx, value) => {
    const updated = [...quizOptions];
    updated[idx] = value;
    setQuizOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!selectedModule && !editData) throw new Error("Parent scope assignment tracker target is required.");
      
      const targetTopicId = editData ? editData.topic_id : selectedTopic;
      
      if (moduleHasTopics && (!targetTopicId || targetTopicId.trim() === "")) {
        throw new Error("Target sub-topic context allocation scope is required for Standard module layouts.");
      }

      const cardDetails = {
        title,
        cardOrder: Number(cardOrder),
        description: `${cardType.toUpperCase()} polymorphic production node deployment.`
      };

      if (cardType === "video" && videoSourceType === "file") {
        if (!videoFile && !editData) throw new Error("Please upload a valid video file context.");
        setUploadingAsset(true);
        
        await api.uploadVideoCard(
          moduleHasTopics ? targetTopicId : { module_id: selectedModule },
          videoFile,
          cardDetails,
          editData?._id
        );
        setSuccess("Video streaming multipart binary configuration saved successfully!");
      } 
      else if (cardType === "ppt" && pptSourceType === "file") {
        if (!pptFile && !editData) throw new Error("Please upload a valid slide presentation file.");
        setUploadingAsset(true);

        await api.uploadPptCard(
          moduleHasTopics ? targetTopicId : { module_id: selectedModule },
          pptFile,
          cardDetails,
          editData?._id
        );
        setSuccess("Presentation slide asset integrated safely.");
      } 
      else if (cardType === "pdf" && pdfSourceType === "file") {
        if (!pdfFile && !editData) throw new Error("Please upload a valid portable document file.");
        setUploadingAsset(true);

        await api.uploadPdfCard(
          moduleHasTopics ? targetTopicId : { module_id: selectedModule },
          pdfFile,
          cardDetails,
          editData?._id
        );
        setSuccess("Portable specification layout asset deployed safely.");
      } 
      else {
        let finalImageUrl = editData?.imageUrl || "";
        if (imageFile) {
          setUploadingAsset(true);
          finalImageUrl = await api.uploadImage(imageFile);
        }

        let finalizedContentStructure = { title };

        if (cardType === "knowledge") {
          finalizedContentStructure.text = markdownText;
        } else if (cardType === "html_sandbox") {
          if (!htmlSourceCode.trim()) throw new Error("Injected HTML string payload text cannot remain empty.");
          finalizedContentStructure.htmlSource = htmlSourceCode;
          finalizedContentStructure.text = htmlSourceCode;
        } else if (cardType === "quiz") {
          finalizedContentStructure.text = JSON.stringify({
            options: quizOptions,
            correctAnswerIndex: correctOptionIdx,
            explanationHint: quizExplanation,
          });
        } else if (cardType === "code") {
          finalizedContentStructure = {
            title,
            code: challengeCode,
            question: challengeQuestion,
            validator: challengeValidator,
            explanation: challengeExplanation,
            ...(challengeTaxonomy && { taxonomy: challengeTaxonomy }),
            ...(challengeHint && { hint: challengeHint }),
          };
        } else if (cardType === "video") {
          if (!videoUrlInput) throw new Error("Streaming resource link address path domain cannot remain empty.");
          finalizedContentStructure.videoUrl = videoUrlInput;
        } else if (cardType === "ppt") {
          if (!pptUrlInput) throw new Error("Hosted cloud deck address link path parameters required.");
          finalizedContentStructure.pptUrl = pptUrlInput;
        } else if (cardType === "pdf") {
          if (!pdfUrlInput) throw new Error("Cloud target documentation storage pointer address required.");
          finalizedContentStructure.pdfUrl = pdfUrlInput;
        }

        const cardPayload = {
          card_type: cardType,
          cardOrder: Number(cardOrder),
          imageUrl: finalImageUrl,
          content: finalizedContentStructure,
          ...(moduleHasTopics ? { topic_id: targetTopicId } : { module_id: selectedModule })
        };

        const routingParamToken = moduleHasTopics ? targetTopicId : selectedModule;

        if (editData) {
          await api.updateCard(editData._id, cardPayload);
          setSuccess("Content card specifications adjusted successfully!");
        } else {
          await api.createCard(routingParamToken, cardPayload);
          setSuccess("Dynamic resource node component deployed successfully!");
        }
      }

      setTitle(""); setMarkdownText(""); setVideoUrlInput(""); setPptUrlInput(""); setPdfUrlInput(""); setHtmlSourceCode("");
      setImageFile(null); setVideoFile(null); setPptFile(null); setPdfFile(null);

      if (videoInputRef.current) videoInputRef.current.value = "";
      if (pptInputRef.current) pptInputRef.current.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";

      if (onCardAdded) onCardAdded();
      setTimeout(() => { if (setActiveTab) setActiveTab("overview"); }, 1200);
    } catch (err) {
      console.error("❌ Form transaction parsing loop crashed:", err);
      setError(err.message || "Parameters compilation rejected by infrastructure schemas loops.");
    } finally {
      setLoading(false); setUploadingAsset(false);
    }
  };

  return (
    <div className="animate-fade-in text-start" style={{ color: "var(--text-primary)" }}>
      <Row className="g-4">
        <Col lg={7} xl={8} xs={12}>
          <div style={{ background: "var(--bg-tactile-cards)", border: "2px solid var(--border-tactile)", borderBottom: "5px solid var(--border-tactile)", borderRadius: "12px", padding: "24px" }}>
            <div className="border-bottom pb-2 mb-4" style={{ borderColor: "var(--border-tactile) !important" }}>
              <h4 className="fw-bold m-0" style={{ color: "var(--text-primary)" }}>{editData ? "Modify Content Asset Node Metrics" : "Deploy Content Resource Asset Card"}</h4>
              <p className="small m-0 mt-1" style={{ color: "var(--text-secondary)" }}>Compile or rearrange dynamic items inside active repository training cells.</p>
            </div>

            {error && <Alert variant="danger" className="py-2 small" style={{ borderRadius: "8px" }}>{error}</Alert>}
            {success && <Alert variant="success" className="py-2 small" style={{ borderRadius: "8px" }}>{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row className="g-3 mb-3">
                <Col md={moduleHasTopics ? 5 : 10} xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Parent Module Target Context</Form.Label>
                    <Form.Select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      required={!editData}
                      style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px" }}
                      disabled={loading || fetchingTopics || !!editData}
                    >
                      <option value="">Select Module Context</option>
                      {modules.map((m) => (
                        <option key={m._id} value={m._id} style={{ background: "var(--bg-tactile-cards)" }}>{m.title} {!m.hasTopics && " (Express flat path)"}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {moduleHasTopics ? (
                  <Col md={5} xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Target Sub-Topic Context Scope</Form.Label>
                      <Form.Select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        required={!editData && moduleHasTopics}
                        style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px" }}
                        disabled={!selectedModule || topics.length === 0 || loading || fetchingTopics || !!editData}
                      >
                        <option value="">
                          {fetchingTopics ? "Fetching linked topic segments..." : "Select Topic Context"}
                        </option>
                        {topics.map((t) => (
                          <option key={t._id} value={t._id} style={{ background: "var(--bg-tactile-cards)" }}>{t.title}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                ) : (
                  <Col md={5} xs={12} className="d-flex align-items-end mb-1">
                    <Badge bg="info" className="py-2.5 px-3 border border-info font-monospace text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.3px', borderRadius: '6px' }}>
                      ⚡ Compact Pipeline: Topics Skipped
                    </Badge>
                  </Col>
                )}

                <Col md={2} xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Sequence Order</Form.Label>
                    <Form.Control
                      type="number" min="1" value={cardOrder}
                      onChange={(e) => setCardOrder(e.target.value)}
                      required
                      style={{ background: "var(--curriculum-hover)", color: "var(--bg-hud-banner)", borderColor: "var(--border-tactile)", borderRadius: "8px", fontWeight: "bold" }}
                      disabled={loading || fetchingTopics}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Card Structural Variant Typology Flag</Form.Label>
                <Form.Select
                  value={cardType} onChange={(e) => setCardType(e.target.value)} required
                  style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px", fontWeight: "bold" }}
                  disabled={loading || fetchingTopics || !!editData}
                >
                  <option value="knowledge" style={{ background: "var(--bg-tactile-cards)" }}>📚 Knowledge Card (Markdown Text)</option>
                  <option value="video" style={{ background: "var(--bg-tactile-cards)" }}>🎥 Video Content Asset (CDN/Streaming URL)</option>
                  <option value="quiz" style={{ background: "var(--bg-tactile-cards)" }}>🎯 Interactive Quiz Card (Selection Matrices)</option>
                  <option value="code" style={{ background: "var(--bg-tactile-cards)" }}>💻 Engineering Problem Code Card (Validation Challenges)</option>
                  <option value="html_sandbox" style={{ background: "var(--bg-tactile-cards)" }}>🌐 Inline HTML Sandbox Workspace (Custom Simulations)</option>
                  <option value="ppt" style={{ background: "var(--bg-tactile-cards)" }}>📊 PPT Presentation Deck (Binary / Cloud Embed)</option>
                  <option value="pdf" style={{ background: "var(--bg-tactile-cards)" }}>📄 PDF Document Resource (Viewer System)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Card Component Header Title</Form.Label>
                <Form.Control
                  type="text" value={title} placeholder="Enter layout headline..."
                  onChange={(e) => setTitle(e.target.value)} required
                  style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px" }}
                  disabled={loading || fetchingTopics}
                />
              </Form.Group>

              {/* Variant 1: Knowledge Card */}
              {cardType === "knowledge" && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Upload Optional Illustration Banner File</Form.Label>
                    <Form.Control
                      type="file" accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px" }}
                      disabled={loading || fetchingTopics}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold small" style={{ color: "var(--text-primary)" }}>Markdown Technical Document Body Canvas Editor</Form.Label>
                    <Form.Control
                      as="textarea" rows={6} value={markdownText}
                      onChange={(e) => setMarkdownText(e.target.value)} required
                      style={{ background: "var(--bg-global-canvas)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", borderRadius: "8px", fontFamily: "monospace", fontSize: "13px" }}
                      disabled={loading || fetchingTopics}
                    />
                  </Form.Group>
                </>
              )}

              {/* Variant 7: Inline HTML Sandbox Code Text Area */}
              {cardType === "html_sandbox" && (
                <Form.Group className="mb-4 animate-fade-in text-start">
                  <Form.Label className="fw-bold text-success font-monospace small">RAW INJECTED TEXT HTML FILE SOURCE BUFFER</Form.Label>
                  <Form.Control
                    as="textarea" rows={12}
                    style={{ background: "#111b21", color: "#4df0a6", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.6", borderRadius: "8px" }}
                    placeholder="Paste the complete text source code contents of your interactive .html module document here (e.g., <!DOCTYPE html> ...)"
                    value={htmlSourceCode} onChange={(e) => setHtmlSourceCode(e.target.value)} required
                    disabled={loading || fetchingTopics}
                  />
                </Form.Group>
              )}

              {/* Variant 2: Video Layout Asset */}
              {cardType === "video" && (
                <div className="p-3 mb-4 rounded-3 border animate-fade-in" style={{ background: "var(--bg-global-canvas)", borderColor: "var(--border-tactile)" }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small d-block" style={{ color: "var(--text-primary)" }}>Stream Asset Ingestion Source Mechanism</Form.Label>
                    <div className="d-flex gap-4 mt-1">
                      <Form.Check type="radio" id="vSourceFile" label="Upload Raw Video File Binary" name="vSourceRadioStack" checked={videoSourceType === "file"} onChange={() => setVideoSourceType("file")} disabled={loading} className="small fw-semibold" />
                      <Form.Check type="radio" id="vSourceUrl" label="Paste External Streaming URL Path" name="vSourceRadioStack" checked={videoSourceType === "url"} onChange={() => setVideoSourceType("url")} disabled={loading} className="small fw-semibold" />
                    </div>
                  </Form.Group>
                  {videoSourceType === "file" ? (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Select Target Video Binary Asset File</Form.Label>
                      <Form.Control type="file" ref={videoInputRef} accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} required={!editData} style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} disabled={loading} />
                      {uploadingAsset && <div className="mt-2 text-danger small fw-semibold animate-pulse"><Spinner animation="border" size="sm" className="me-2" /> Ingesting streaming chunks...</div>}
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Direct Cloud Resource Stream URL Input</Form.Label>
                      <Form.Control type="url" placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} required style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", fontFamily: "monospace", fontSize: "12px" }} disabled={loading} />
                    </Form.Group>
                  )}
                </div>
              )}

              {/* Variant 5: PPT Presentation Asset Ingestion */}
              {cardType === "ppt" && (
                <div className="p-3 mb-4 rounded-3 border animate-fade-in" style={{ background: "var(--bg-global-canvas)", borderColor: "var(--border-tactile)" }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small d-block" style={{ color: "var(--text-primary)" }}>Presentation File Distribution Framework</Form.Label>
                    <div className="d-flex gap-4 mt-1">
                      <Form.Check type="radio" id="pptSourceFile" label="Upload Local Slide Deck (.ppt/.pptx)" name="pptSourceRadioStack" checked={pptSourceType === "file"} onChange={() => setPptSourceType("file")} disabled={loading} className="small fw-semibold" />
                      <Form.Check type="radio" id="pptSourceUrl" label="Paste Hosted Slide Deck/Office embed Link" name="pptSourceRadioStack" checked={pptSourceType === "url"} onChange={() => setPptSourceType("url")} disabled={loading} className="small fw-semibold" />
                    </div>
                  </Form.Group>
                  {pptSourceType === "file" ? (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Select Target Presentation Binary Context</Form.Label>
                      <Form.Control type="file" ref={pptInputRef} accept=".ppt,.pptx" onChange={(e) => setPptFile(e.target.files[0])} required={!editData} style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} disabled={loading} />
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Direct Cloud Resource Slide Embed URL Input</Form.Label>
                      <Form.Control type="url" placeholder="e.g., https://view.officeapps.live.com/op/embed.aspx?src=..." value={pptUrlInput} onChange={(e) => setPptUrlInput(e.target.value)} required style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", fontFamily: "monospace", fontSize: "12px" }} disabled={loading} />
                    </Form.Group>
                  )}
                </div>
              )}

              {/* Variant 6: PDF Document Asset Ingestion */}
              {cardType === "pdf" && (
                <div className="p-3 mb-4 rounded-3 border animate-fade-in" style={{ background: "var(--bg-global-canvas)", borderColor: "var(--border-tactile)" }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small d-block" style={{ color: "var(--text-primary)" }}>PDF Configuration Pipeline</Form.Label>
                    <div className="d-flex gap-4 mt-1">
                      <Form.Check type="radio" id="pdfSourceFile" label="Upload Local PDF Document Buffer" name="pdfSourceRadioStack" checked={pdfSourceType === "file"} onChange={() => setPdfSourceType("file")} disabled={loading} className="small fw-semibold" />
                      <Form.Check type="radio" id="pdfSourceUrl" label="Direct CDN Path Pointer Address" name="pdfSourceRadioStack" checked={pdfSourceType === "url"} onChange={(e) => setPdfSourceType("url")} disabled={loading} className="small fw-semibold" />
                    </div>
                  </Form.Group>
                  {pdfSourceType === "file" ? (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Select Static PDF Document Context File</Form.Label>
                      <Form.Control type="file" ref={pdfInputRef} accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} required={!editData} style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} disabled={loading} />
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-2 animate-fade-in">
                      <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Direct Static Document URL Pointer</Form.Label>
                      <Form.Control type="url" placeholder="https://cdn.site.com/doc.pdf" value={pdfUrlInput} onChange={(e) => setPdfUrlInput(e.target.value)} required style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", fontFamily: "monospace", fontSize: "12px" }} disabled={loading} />
                    </Form.Group>
                  )}
                </div>
              )}

              {/* Variant 3: Interactive Quiz Selection */}
              {cardType === "quiz" && (
                <div className="p-3 mb-4 rounded-3 border animate-fade-in text-start" style={{ background: "var(--bg-global-canvas)", borderColor: "var(--border-tactile)" }}>
                  <h6 className="fw-bold mb-3 small text-uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Interactive Options Configuration Grid</h6>
                  {quizOptions.map((option, oIdx) => (
                    <Row className="align-items-center mb-2 g-2" key={oIdx}>
                      <Col xs={1} className="text-center">
                        <Form.Check type="radio" name="quizCorrectChoiceMappingRadio" checked={correctOptionIdx === oIdx} onChange={() => setCorrectOptionIdx(oIdx)} disabled={loading} />
                      </Col>
                      <Col xs={11}>
                        <Form.Control type="text" placeholder={`Option Choice #${oIdx + 1}`} value={option} onChange={(e) => handleQuizOptionChange(oIdx, e.target.value)} required style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} disabled={loading} />
                      </Col>
                    </Row>
                  ))}
                  <Form.Group className="mt-3">
                    <Form.Label className="fw-semibold small" style={{ color: "var(--text-secondary)" }}>Explanatory Logic Text Solution Breakdown</Form.Label>
                    <Form.Control as="textarea" rows={2} value={quizExplanation} onChange={(e) => setQuizExplanation(e.target.value)} placeholder="Explain solutions..." style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} disabled={loading} />
                  </Form.Group>
                </div>
              )}

              {/* Variant 4: Engineering Problem Code Card */}
              {cardType === "code" && (
                <div className="p-3 mb-4 rounded-3 border text-start" style={{ background: "var(--bg-global-canvas)", borderColor: "var(--border-tactile)" }}>
                  <h6 className="fw-bold mb-3 small text-uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>XBRL Sandbox Challenge Blueprint Spec Matrix</h6>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold font-monospace" style={{ color: "var(--text-secondary)" }}>Reference Taxonomy Schema Element</Form.Label>
                    <Form.Control as="textarea" rows={3} style={{ fontSize: "12px", background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", fontFamily: "monospace" }} placeholder="<xs:schema>...</xs:schema> (Optional)" value={challengeTaxonomy} onChange={(e) => setChallengeTaxonomy(e.target.value)} disabled={loading || fetchingTopics} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold font-monospace" style={{ color: "var(--text-secondary)" }}>Interactive Challenge Code Snippet</Form.Label>
                    <Form.Control as="textarea" rows={4} style={{ fontSize: "13px", background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)", fontFamily: "monospace" }} placeholder="<link:referenceLink>...</link:referenceLink>" value={challengeCode} onChange={(e) => setChallengeCode(e.target.value)} required disabled={loading || fetchingTopics} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold" style={{ color: "var(--text-secondary)" }}>Challenge Prompt Core Task Question</Form.Label>
                    <Form.Control type="text" style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} placeholder="You need to map unitRef..." value={challengeQuestion} onChange={(e) => setChallengeQuestion(e.target.value)} required disabled={loading || fetchingTopics} />
                  </Form.Group>
                  <Row className="g-3 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold font-monospace" style={{ color: "var(--bg-hud-banner)" }}>Validator Function String</Form.Label>
                        <Form.Control type="text" style={{ background: "var(--bg-tactile-cards)", color: "var(--bg-hud-banner)", borderColor: "var(--border-tactile)", fontFamily: "monospace", fontWeight: "bold" }} placeholder="validateUnitRefAnswer" value={challengeValidator} onChange={(e) => setChallengeValidator(e.target.value)} required disabled={loading || fetchingTopics} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold font-monospace" style={{ color: "var(--text-primary)" }}>Activity Hint</Form.Label>
                        <Form.Control type="text" style={{ background: "var(--bg-tactile-cards)", color: "var(--text-primary)", borderColor: "var(--border-tactile)" }} placeholder="Provide troubleshooting hints..." value={challengeHint} onChange={(e) => setChallengeHint(e.target.value)} disabled={loading || fetchingTopics} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mt-3">
                    <Form.Label className="small fw-semibold text-success">Success Explanation Statement</Form.Label>
                    <Form.Control as="textarea" rows={3} style={{ background: "var(--bg-tactile-cards)", color: "var(--badge-completed-text)", borderColor: "var(--border-tactile)" }} placeholder="✅ Perfect match solution detail..." value={challengeExplanation} onChange={(e) => setChallengeExplanation(e.target.value)} required disabled={loading || fetchingTopics} />
                  </Form.Group>
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <Button type="submit" style={{ backgroundColor: "var(--bg-hud-banner)", borderColor: "var(--bg-hud-banner)", color: "var(--text-inverse)", borderRadius: "8px", fontWeight: "800", padding: "10px 24px", borderBottom: "4px solid var(--border-hud-tactile)" }} disabled={loading || uploadingAsset || fetchingTopics}>
                  {loading ? <Spinner animation="border" size="sm" /> : editData ? "Apply Changes" : "Compile & Deploy Card"}
                </Button>
                <Button type="button" className="fw-bold btn-light border" onClick={() => setActiveTab("overview")} disabled={loading || uploadingAsset || fetchingTopics} style={{ borderRadius: "8px", padding: "10px 24px", color: "var(--text-secondary)" }}>
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Col>

        {/* Real-time Simulator Preview Sidecar Panel */}
        <Col lg={5} xl={4} xs={12} className="position-sticky" style={{ top: "24px" }}>
          <div className="cb-simulator-device-frame border border-slate bg-dark p-2" style={{ borderRadius: "24px", minHeight: "580px", boxShadow: "0 12px 24px rgba(15,37,110,0.08)" }}>
            <div className="simulator-glass-screen bg-white p-3 d-flex flex-column justify-content-between h-100" style={{ borderRadius: "18px", minHeight: "562px", position: "relative", color: "var(--text-primary)" }}>
              <div className="sim-screen-top border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between text-muted" style={{ fontSize: "11px", borderColor: "var(--border-tactile) !important" }}>
                <span className="fw-bold font-monospace" style={{ color: "var(--bg-hud-banner)" }}><Eye className="me-1" /> LIVE PREVIEW INTERFACE</span>
                <Badge bg="light" className="text-secondary border text-uppercase font-monospace">{cardType}</Badge>
              </div>

              <div className="sim-render-body flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "420px", fontSize: "13px" }}>
                <h5 className="fw-bold text-dark mb-3">{title || "👉 [Untitled Resource Asset Name]"}</h5>

                {cardType === "knowledge" && (
                  <div className="p-2 border rounded font-monospace" style={{ background: "var(--bg-global-canvas)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", fontSize: "11px", borderColor: "var(--border-tactile)" }}>
                    {markdownText || "No rich markdown manuals compiled inside editor buffer..."}
                  </div>
                )}

                {cardType === "html_sandbox" && (
                  <div className="p-3 border rounded text-center bg-light shadow-sm animate-fade-in" style={{ background: "var(--curriculum-hover)", borderColor: "var(--border-tactile)" }}>
                    <div className="mb-2" style={{ fontSize: "28px" }}>🌐</div>
                    <span className="fw-bold text-dark small d-block mb-1">Interactive Simulation Launchpad</span>
                    <p className="text-muted font-monospace m-0" style={{ fontSize: "10px" }}>
                      {htmlSourceCode.trim() ? `✓ Script content cached: (${htmlSourceCode.length} characters)` : "Empty file stream buffer layout..."}
                    </p>
                  </div>
                )}

                {cardType === "video" && (
                  <div className="sim-video-box bg-dark text-white rounded d-flex flex-column justify-content-center align-items-center p-4 text-center" style={{ minHeight: "160px" }}>
                    <PlayCircle size={40} className="text-danger mb-2" />
                    <span className="small font-monospace text-truncate w-100 px-2">{videoSourceType === "file" ? (videoFile ? `📦 Ready to stream: ${videoFile.name}` : "Awaiting binary stream...") : (videoUrlInput || "Awaiting Streaming resource CDN link...")}</span>
                  </div>
                )}

                {cardType === "quiz" && (
                  <div className="sim-quiz-stack d-flex flex-column gap-2 mt-2">
                    {quizOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="p-2.5 border rounded-3 text-start small fw-medium transition-all" style={{ backgroundColor: correctOptionIdx === oIdx ? "var(--badge-completed-bg)" : "var(--bg-global-canvas)", borderColor: correctOptionIdx === oIdx ? "var(--badge-completed-text)" : "var(--border-tactile)", color: correctOptionIdx === oIdx ? "var(--badge-completed-text)" : "var(--text-primary)" }}>
                        <span className="font-monospace me-2 text-muted">[{String.fromCharCode(65 + oIdx)}]</span> {opt || `Awaiting compilation variant choice #${oIdx + 1}...`}
                      </div>
                    ))}
                  </div>
                )}

                {cardType === "code" && (
                  <div className="sim-code-sandbox-wrapper d-flex flex-column gap-3 animate-fade-in text-start">
                    {challengeQuestion && (
                      <div className="p-2.5 border rounded-3 shadow-sm" style={{ backgroundColor: "var(--badge-progress-bg)", color: "var(--badge-progress-text)", borderColor: "var(--badge-progress-text)" }}>
                        <div style={{ fontSize: "12px", lineHeight: "1.4", fontWeight: "500" }}>{challengeQuestion}</div>
                      </div>
                    )}
                    <div className="p-2 font-monospace text-muted rounded-3" style={{ fontSize: "11px", background: "#0f172a", color: "#38bdf8", minHeight: "100px", whiteSpace: "pre-wrap" }}>
                      {challengeCode || "// Code configuration stream buffer empty."}
                    </div>
                  </div>
                )}
              </div>

              <div className="sim-screen-bottom border-top pt-2 mt-3 text-center text-muted" style={{ fontSize: "10px", letterSpacing: "0.5px", borderColor: "var(--border-tactile) !important" }}>
                🔒 END-USER INTERACTION INTERFACE SIMULATOR
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}