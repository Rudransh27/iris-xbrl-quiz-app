// src/components/DocumentationPage.jsx
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../admin/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DocumentationPage.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Function to remove emojis from a string
const removeEmojis = (str) => {
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

// Custom component to render code blocks with syntax highlighting
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

const DocumentationPage = () => {
    const { moduleId, topicId, cardId } = useParams();
    const navigate = useNavigate();

    const [moduleData, setModuleData] = useState(null);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    

    // Effect to control body overflow for mobile sidebar
    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);


    // Effect to fetch documentation data from the API
    useEffect(() => {
        const fetchDocumentationData = async () => {
            setLoading(true);
            setError(null);
            setCurrentCard(null);
            setCurrentTopic(null);

            try {
                if (!moduleId) {
                    setError("Module ID is missing.");
                    setLoading(false);
                    return;
                }

                const fetchedModule = await api.getModule(moduleId);
                if (!fetchedModule) {
                    setError("Module not found.");
                    setLoading(false);
                    return;
                }
                setModuleData(fetchedModule);

                const foundTopic = fetchedModule.topics.find(t => t._id === topicId);
                if (!foundTopic) {
                    setError("Topic not found.");
                    setLoading(false);
                    return;
                }
                setCurrentTopic(foundTopic);

                const foundCard = foundTopic.cards.find(card => card._id === cardId && card.card_type === 'knowledge');
                if (!foundCard) {
                    setError("Card not found or is not a knowledge card.");
                    setLoading(false);
                    return;
                }
                setCurrentCard(foundCard);
                setLoading(false);

            } catch (err) {
                console.error("Failed to fetch documentation:", err);
                setError("Failed to load documentation. Please check the URL and network.");
                setLoading(false);
            }
        };
        fetchDocumentationData();
    }, [moduleId, topicId, cardId]);

    useEffect(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, [currentCard]);

    const handleBackClick = () => {
        navigate(`/modules/${moduleId}`);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prevState => !prevState);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const renderCardContent = (card) => {
        if (!card || !card.content || card.card_type !== 'knowledge') {
            return <p>No knowledge content available for this card.</p>;
        }

        const { title, text } = card.content;
        const imageUrl=card.imageUrl;
        return (
            <div className="doc-card-content">
                {imageUrl && (
                    <div className="doc-card-image-container">
                        <img src={imageUrl} alt="" className="doc-card-image" />
                    </div>
                )}
                <div className="doc-markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {text}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="doc-page-container doc-loading-state">Loading documentation...</div>;
    }

    if (error) {
        return <div className="doc-page-container doc-error-state">{error}</div>;
    }

    if (!currentCard || !moduleData || !currentTopic) {
        return <div className="doc-page-container doc-not-found-state">Card or module not found.</div>;
    }

    const allKnowledgeCardsInTopic = currentTopic.cards.filter(card => card.card_type === 'knowledge');
    const currentCardIndex = allKnowledgeCardsInTopic.findIndex(card => card._id === cardId);
    const prevCard = currentCardIndex > 0 ? allKnowledgeCardsInTopic[currentCardIndex - 1] : null;
    const nextCard = currentCardIndex < allKnowledgeCardsInTopic.length - 1 ? allKnowledgeCardsInTopic[currentCardIndex + 1] : null;

    return (
        <div className="doc-page-container">
            <aside className={`doc-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="doc-sidebar-header">
                    <h2 className="doc-sidebar-title">
                        {removeEmojis(currentTopic.title)}
                    </h2>
                    <button className="doc-close-sidebar-btn" onClick={closeSidebar}>
                        &times;
                    </button>
                </div>
                <nav className="doc-sidebar-nav">
                    <ul className="list-nested">
                        {allKnowledgeCardsInTopic.map((card) => (
                            <li key={card._id}>
                                <Link 
                                    to={`/modules/${moduleId}/topics/${topicId}/cards/${card._id}/documentation`} 
                                    className={`doc-card-link ${card._id === cardId ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    {removeEmojis(card.content.title)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            
            {isSidebarOpen && (
                <div className="doc-sidebar-overlay" onClick={closeSidebar}></div>
            )}
            
            <main className="doc-main-content">
                <div className="doc-mobile-header">
                    <button className="doc-back-to-module-btn-mobile" onClick={handleBackClick}>
                        &larr; Back
                    </button>
                    <button 
                        className={`doc-sidebar-toggle-btn ${isSidebarOpen ? 'open' : ''}`} 
                        onClick={toggleSidebar} 
                        aria-label="Toggle Sidebar"
                    >
                        <div className="doc-toggle-icon"></div>
                    </button>
                </div>
                
                <div className="doc-documentation-container">
                    <button className="doc-back-to-module-btn-desktop" onClick={handleBackClick}>
                        &larr; Back to Module Details
                    </button>
                    <h1 className="doc-documentation-title">{currentCard.content.title}</h1>
                    <p className="doc-documentation-subtitle">Topic: {currentTopic.title}</p>
                    {renderCardContent(currentCard)}
                    <div className="doc-navigation-buttons">
                        {prevCard && (
                            <Link to={`/modules/${moduleId}/topics/${topicId}/cards/${prevCard._id}/documentation`} className="doc-nav-btn doc-prev-btn">
                                <span>&larr; Previous Card</span>
                            </Link>
                        )}
                        {nextCard && (
                            <Link to={`/modules/${moduleId}/topics/${topicId}/cards/${nextCard._id}/documentation`} className="doc-nav-btn doc-next-btn">
                                <span>Next Card &rarr;</span>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocumentationPage;   