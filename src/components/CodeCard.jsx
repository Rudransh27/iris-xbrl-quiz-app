// src/components/CodeCard.jsx
import React, { useState, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AceEditor from "react-ace";
import {
  Lightbulb,
  Check2Circle,
  ExclamationTriangle,
  Files,
} from "react-bootstrap-icons";
import api from "../admin/services/api";
import "./CodeCard.css";

import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

const CodeCard = ({
  title,
  taxonomyCode,
  instanceCode,
  question,
  explanation,
  hint,
  onAnswer,
  userAnswer,
  validationError,
  isCorrect,
  cardId,
  topicId,
  moduleId,
}) => {
  const [copySuccessTax, setCopySuccessTax] = useState(false);
  const [copySuccessInst, setCopySuccessInst] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attemptLogged, setAttemptLogged] = useState(false);
  const [editorTheme, setEditorTheme] = useState("github");

  // Live active system dark/light tracker — the app's theme toggle
  // (src/context/ThemeContext.jsx) sets a `data-theme` ATTRIBUTE on
  // <html>, not a `dark-theme` CLASS on <body>; watching the wrong node/
  // attribute meant this never actually fired, so the Ace editor always
  // rendered in "github" (light) regardless of the app's real theme.
  useEffect(() => {
    const checkActiveTheme = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      setEditorTheme(isDark ? "monokai" : "github");
    };

    checkActiveTheme();

    const observer = new MutationObserver(checkActiveTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    // Reset guard when card changes
    setHasRecorded(false);
  }, [cardId]);

  useEffect(() => {
    if (isCorrect === null || hasRecorded) return;

    const recordAttempt = async () => {
      try {
        await api.post("/progress/card-completed", {
          cardId,
          topicId,
          moduleId,
          isCorrect,
        });
        setHasRecorded(true);
      } catch (error) {
        console.error("Failed to record code card completion:", error);
      }
    };

    recordAttempt();
  }, [isCorrect, cardId, topicId, moduleId]); // hasRecorded NOT in deps
  const handleCopy = (text, which) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      if (which === "taxonomy") {
        setCopySuccessTax(true);
        setTimeout(() => setCopySuccessTax(false), 2000);
      } else if (which === "instance") {
        setCopySuccessInst(true);
        setTimeout(() => setCopySuccessInst(false), 2000);
      }
    });
  };

  // Markdown custom elements code highlighters
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "xml";

      let highlighted = children;
      try {
        if (Prism.languages[lang]) {
          highlighted = Prism.highlight(
            String(children).replace(/\n$/, ""),
            Prism.languages[lang],
            lang,
          );
        } else {
          highlighted = String(children).replace(/\n$/, "");
        }
      } catch (error) {
        console.error("Highlight error:", error);
        highlighted = String(children).replace(/\n$/, "");
      }

      return (
        <pre {...props}>
          <code
            className={className}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      );
    },
  };

  return (
    <div className="compiler-code-card-shell">
      <h3 className="compiler-card-main-title">{title}</h3>

      {/* 📚 TAXONOMY SCHEMAS REFERENCE CODE BLOCKS */}
      {taxonomyCode && (
        <div className="compiler-code-snippet-box">
          <div className="compiler-snippet-header font-monospace">
            <span>📚 TAXONOMY RULES METADATA (.XML)</span>
            <button
              className="compiler-copy-btn"
              onClick={() => handleCopy(taxonomyCode, "taxonomy")}
              type="button"
            >
              <Files size={12} className="me-1" />
              <span>{copySuccessTax ? "Copied!" : "Copy XML"}</span>
            </button>
          </div>
          <div className="compiler-prism-scroller">
            <pre>
              <code
                className="language-xml"
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    taxonomyCode,
                    Prism.languages.xml,
                    "xml",
                  ),
                }}
              />
            </pre>
          </div>
        </div>
      )}

      {/* 📄 UNVALIDATED EXECUTABLE CODE BLOCKS */}
      {instanceCode && (
        <div className="compiler-code-snippet-box">
          <div className="compiler-snippet-header font-monospace">
            <span>📄 REPORTING INSTANCE TEMPLATE</span>
            <button
              className="compiler-copy-btn"
              onClick={() => handleCopy(instanceCode, "instance")}
              type="button"
            >
              <Files size={12} className="me-1" />
              <span>{copySuccessInst ? "Copied!" : "Copy Template"}</span>
            </button>
          </div>
          <div className="compiler-prism-scroller">
            <pre>
              <code
                className="language-xml"
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    instanceCode,
                    Prism.languages.xml,
                    "xml",
                  ),
                }}
              />
            </pre>
          </div>
        </div>
      )}

      {/* 🎯 QUESTION CONTENT DESCRIPTIVE PANELS */}
      <div className="compiler-question-prompt-viewport">
        <div className="compiler-markdown-body markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {question}
          </ReactMarkdown>
        </div>
      </div>

      {/* 💡 ANALYTICS MICRO HINTS VIEWPORTS */}
      <div className="compiler-hint-action-row">
        {hint && isCorrect === false && (
          <button
            className="compiler-hint-toggle-trigger font-monospace"
            onClick={() => setShowHint(!showHint)}
          >
            <Lightbulb size={13} className="bulb-vector" />
            <span>
              {showHint ? "HIDE SOLUTION HINT" : "REQUEST ENGINE HINT"}
            </span>
          </button>
        )}
      </div>

      {showHint && (
        <div className="compiler-hint-floating-drawer animate-fade-up">
          <div className="compiler-markdown-body markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
              {hint}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 💻 EMBEDDED REALTIME CODE EDITOR INTERACTIVE ENGINE */}
      <div
        className={`compiler-editor-container-hull ${isCorrect === true ? "hull-success" : isCorrect === false ? "hull-error" : ""}`}
      >
        <div className="editor-console-header font-monospace">
          <span className="live-pulse-dot"></span>
          <span>LIVE TESTING CONSOLE // ACE LAYER RUNNING</span>
        </div>
        <AceEditor
          mode="xml"
          theme={editorTheme}
          name="compiler_core_editor"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: false,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
          value={userAnswer || ""}
          onChange={onAnswer}
          width="100%"
          height="220px"
          readOnly={isCorrect !== null}
        />
      </div>

      {/* ❌ VALIDATION ERROR EXCEPTIONS RESPONSES */}
      {validationError && (
        <div className="compiler-exception-alert font-monospace animate-fade-up">
          <ExclamationTriangle size={14} className="flex-shrink-0" />
          <div className="exception-text-string">{validationError}</div>
        </div>
      )}

      {/* 🟢 SUCCESS COMPILATION FEEDBACK SHEETS */}
      {isCorrect === true && explanation && (
        <div className="compiler-success-feedback-drawer animate-fade-up">
          <div className="success-feedback-header-title font-monospace">
            <Check2Circle size={15} />
            <span>COMPILATION EXECUTED SUCCESSFUL // EXPLANATION LOG</span>
          </div>
          <div className="compiler-markdown-body markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
              {explanation}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeCard;
