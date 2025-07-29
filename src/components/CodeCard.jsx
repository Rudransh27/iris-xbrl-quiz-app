import React, { useState } from "react";
import "../pages/Quiz.css"; // Ensure your CSS is still imported
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Import AceEditor and its dependencies ---
import AceEditor from "react-ace";

// Import a mode for XML (essential for syntax highlighting)
import "ace-builds/src-noconflict/mode-xml";

// Import a theme (choose one that fits your overall design)
// For light mode:
import "ace-builds/src-noconflict/theme-github";
// For dark mode (if you want it to match oneDark from Prism):
import "ace-builds/src-noconflict/theme-monokai"; // Monokai is a popular dark theme
// You can dynamically choose themes based on your 'theme' state if needed.

// Import necessary extensions for features like autocomplete if desired
import "ace-builds/src-noconflict/ext-language_tools"; // For basic autocompletion


const CodeCard = ({
  title,
  taxonomyCode,
  instanceCode,
  question,
  explanation,
  onAnswer,
  userAnswer,
  validationError,
  isCorrect,
}) => {
  const [copySuccessTax, setCopySuccessTax] = useState(false);
  const [copySuccessInst, setCopySuccessInst] = useState(false);

  // You might want to get the current theme from a context or prop if it's dynamic
  // For now, let's assume you're managing it globally in body class
  const currentTheme = document.body.classList.contains('dark-theme') ? 'monokai' : 'github';


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

  return (
    <div className="code-card">
      <h3>{title}</h3>

      {/* Taxonomy Code Block (remains SyntaxHighlighter for display) */}
      {taxonomyCode && (
        <div
          className="code-snippet"
          style={{ position: "relative", maxHeight: 300, overflowY: "auto", marginBottom: 16 }}
        >
          <div
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              zIndex: 10,
            }}
          >
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

      {/* Instance Code Block (remains SyntaxHighlighter for display) */}
      {instanceCode && (
        <div
          className="code-snippet"
          style={{ position: "relative", maxHeight: 400, overflowY: "auto", marginBottom: 16 }}
        >
          <div
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              zIndex: 10,
            }}
          >
            <button
              className="copy-button"
              onClick={() => handleCopy(instanceCode, "instance")}
              aria-label="Copy instance code to clipboard"
              type="button"
            >
              {copySuccessInst ? "Copied!" : "Copy"}
            </button>
          </div>
          <h6>📄 Instance XML (To be Edited)</h6>
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

      {/* --- REPLACE TEXTAREA WITH ACE EDITOR --- */}
      <AceEditor
        mode="xml" // Set the language mode
        theme={currentTheme} // Use the chosen theme
        name="code_editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true, // Enable basic autocompletion
          enableLiveAutocompletion: false, // Live autocompletion (can be resource-intensive)
          enableSnippets: true, // Enable code snippets
          showLineNumbers: true, // Show line numbers
          tabSize: 2, // Set tab size
          // Add more options as needed (e.g., wrap, readOnly)
        }}
        value={userAnswer || ""}
        onChange={onAnswer} // AceEditor passes the new value directly
        width="100%" // Take full width of parent
        height="200px" // Set a default height, adjust as needed
        readOnly={isCorrect} // Make read-only when correct
        style={{
            marginTop: "10px",
            borderRadius: "8px",
            border: `1px solid ${isCorrect ? "green" : validationError ? "red" : "var(--border-color)"}`,
            // We'll manage border color via internal style based on props
            // AceEditor wraps itself in a div, so some styles like border might need !important
            // or specific targeting in CSS if you want to override Ace's defaults.
        }}
      />
      {/* End Ace Editor */}


      {validationError && (
        <p className="error-msg">
          {validationError}
        </p>
      )}

      {isCorrect && explanation && (
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