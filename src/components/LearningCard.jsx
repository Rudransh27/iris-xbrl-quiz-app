import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"; // Import Prism
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Make sure to import from 'styles/prism'
import jerryImg from "../assets/jerry-cheese.png";
import "../pages/Quiz.css";

const LearningCard = ({ title, text, image, imageSize }) => {
  // Custom renderer for fenced code blocks with syntax highlighting
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : null; // Extract the language from the className

      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={lang || "plaintext"} // <--- FIX IS HERE: Use the detected language or a fallback
          PreTag="div"
          showLineNumbers={false} // Set true if you want line numbers
          wrapLines={true}
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
    <div className="knowledge-card">
      <img src={jerryImg} alt="Jerry mascot" className="jerry-img" />
      <div className="knowledge-text">
        <h3 className="knowledge-title">{title}</h3>

        {image && (
          <img
            src={image}
            alt=""
            className={`card-img1 card-img-${imageSize || "small"}`}
          />
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