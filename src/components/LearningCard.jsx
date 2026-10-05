// src/components/LearningCard.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

import jerryImg from "../assets/jerry-cheese.png";
import "./QuizMarkdown.css";
import "./LearningCard.css";

const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const components = {
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

    // 🔒 Rendered through innerHTML below (for Prism's markup), so text that
    // does NOT go through Prism.highlight (which escapes) is escaped here —
    // otherwise ```foo <img src=x onerror=…>``` in card text runs as script.
    let highlighted = "";
    try {
      if (Prism.languages[lang]) {
        highlighted = Prism.highlight(
          String(children).replace(/\n$/, ""),
          Prism.languages[lang],
          lang,
        );
      } else {
        highlighted = escapeHtml(String(children).replace(/\n$/, ""));
      }
    } catch (error) {
      console.error("Highlight error:", error);
      highlighted = escapeHtml(String(children).replace(/\n$/, ""));
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

const LearningCard = ({
  title,
  text,
  image,
  imageSize,
  cardId,
  topicId,
  moduleId,
}) => {
  // Completion is recorded by useQuizEngine when the learner continues past
  // this card. This component used to also POST it itself via `api.post`,
  // which the api module doesn't have — it threw on every card view and the
  // error was swallowed.

  return (
    <div className="knowledge-card">
      <div className="knowledge-text ui-card">
        {/* 🎯 Jerry is now nested inside the card, locked to the top-right */}
        <img src={jerryImg} alt="Jerry mascot" className="jerry-img-top-right" />
        
        <h3 className="knowledge-title">{title}</h3>

        {image && (
          <div className="card-image-viewport-wrapper">
            <img
              src={image}
              alt=""
              className={`card-img1 card-img-${imageSize || "small"}`}
            />
          </div>
        )}

        <div className="knowledge-content markdown-body quiz-md quiz-md--prism">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;