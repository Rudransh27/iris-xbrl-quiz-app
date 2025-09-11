// src/components/CodeCard.jsx

import React, { useState, useEffect } from "react";
import "./CodeCard.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import api from "../admin/services/api"; // Import the API service

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
  cardId, // New prop
  topicId, // New prop
  moduleId, // New prop
}) => {
  const [copySuccessTax, setCopySuccessTax] = useState(false);
  const [copySuccessInst, setCopySuccessInst] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attemptLogged, setAttemptLogged] = useState(false); // New state to prevent multiple logs

  const currentTheme = document.body.classList.contains('dark-theme') ? 'monokai' : 'github';

  // Log the code card attempt when the user answers correctly or incorrectly
  useEffect(() => {
    const recordAttempt = async () => {
      // Only log if the card is answered (correctly or incorrectly)
      if (isCorrect !== null && !attemptLogged) {
        try {
          await api.post("/progress/card-completed", {
            cardId,
            topicId,
            moduleId,
            isCorrect,
          });
          console.log(
            `Code card attempt recorded. Card ID: ${cardId}, Correct: ${isCorrect}`
          );
          setAttemptLogged(true); // Mark the attempt as logged
        } catch (error) {
          console.error("Failed to record code card completion:", error);
        }
      }
    };

    recordAttempt();
  }, [isCorrect, cardId, topicId, moduleId, attemptLogged]);

  const handleCopy = (text, which) => {
    if (!navigator.clipboard) {
      alert("Clipboard API not supported");
      return;
    }
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

  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  return (
    <div className="code-card">
      <h3 className="code-card-title">{title}</h3>
      {taxonomyCode && (
        <div className="code-snippet">
          <div className="copy-button-container">
            <button
              className="copy-button"
              onClick={() => handleCopy(taxonomyCode, "taxonomy")}
              aria-label="Copy taxonomy code to clipboard"
              type="button"
            >
              {copySuccessTax ? "Copied!" : "Copy"}
            </button>
          </div>
          <h6>📚 Taxonomy XML</h6>
          <SyntaxHighlighter language="xml" style={oneDark} showLineNumbers>
            {taxonomyCode}
          </SyntaxHighlighter>
        </div>
      )}

      {instanceCode && (
        <div className="code-snippet">
          <div className="copy-button-container">
            <button
              className="copy-button"
              onClick={() => handleCopy(instanceCode, "instance")}
              aria-label="Copy instance code to clipboard"
              type="button"
            >
              {copySuccessInst ? "Copied!" : "Copy"}
            </button>
          </div>
          <h6>📄 XML (To be Edited)</h6>
          <SyntaxHighlighter language="xml" style={oneDark} showLineNumbers>
            {instanceCode}
          </SyntaxHighlighter>
        </div>
      )}

      <div className="code-question">
        <div className="knowledge-content markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {question}
          </ReactMarkdown>
        </div>
      </div>

      <div className="hint-container">
        {hint && isCorrect === false && (
          <button className="hint-button" onClick={toggleHint}>
            <span role="img" aria-label="bulb icon">💡</span> Hint
          </button>
        )}
      </div>

      {showHint && (
        <div className="knowledge-content markdown-body code-hint">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {hint}
          </ReactMarkdown>
        </div>
      )}

      <AceEditor
        mode="xml"
        theme={currentTheme}
        name="code_editor"
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
        height="200px"
        readOnly={isCorrect !== null}
        className={`ace-editor-container ${
          isCorrect === true ? "correct" : isCorrect === false ? "error" : ""
        }`}
      />

      {validationError && (
        <p className="error-msg">
          {validationError}
        </p>
      )}

      {isCorrect === true && explanation && (
        <div className="knowledge-content markdown-body code-explanation">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
            {explanation}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CodeCard;