// src/components/LearningCard.jsx
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

import jerryImg from "../assets/jerry-cheese.png";
import api from "../admin/services/api";
import "./LearningCard.css";

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

const LearningCard = ({
  title,
  text,
  image,
  imageSize,
  cardId,
  topicId,
  moduleId,
}) => {
  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    setHasRecorded(false);
  }, [cardId]);

  useEffect(() => {
    if (!cardId || !topicId || !moduleId || hasRecorded) return;

    const recordCompletion = async () => {
      try {
        await api.post("/progress/card-completed", {
          cardId,
          topicId,
          moduleId,
          isCorrect: null,
          xpEarned: 1,
        });
        setHasRecorded(true);
      } catch (error) {
        console.error("Failed to record progress:", error);
      }
    };

    recordCompletion();
  }, [cardId, topicId, moduleId]);

  return (
    <div className="knowledge-card">
      <div className="knowledge-text">
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

        <div className="knowledge-content markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;