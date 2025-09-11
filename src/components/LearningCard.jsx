// src/components/LearningCard.jsx

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import jerryImg from "../assets/jerry-cheese.png";
import api from '../admin/services/api'; // Import the API service
import "./LearningCard.css";

const components = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const lang = match ? match[1] : null;

        return !inline && match ? (
            <SyntaxHighlighter
                style={oneDark}
                language={lang || "plaintext"}
                PreTag="div"
                showLineNumbers={false}
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

const LearningCard = ({ title, text, image, imageSize, cardId, topicId, moduleId }) => {
    
    // Use an effect hook to log the card completion
    useEffect(() => {
        const recordCompletion = async () => {
            try {
                // This API call is made as soon as the card is rendered
                await api.post('/progress/card-completed', {
                    cardId,
                    topicId,
                    moduleId,
                    isCorrect: null, // knowledge cards don't have a correct/incorrect state
                                xpEarned: 1 // Add XP earned for learning cards
                });
                console.log(`Knowledge card ${cardId} completion recorded with 2 XP.`);
            } catch (error) {
                console.error("Failed to record card completion:", error);
            }
        };

        if (cardId && topicId && moduleId) {
            recordCompletion();
        }
    }, [cardId, topicId, moduleId]); // Re-run effect if these IDs change

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