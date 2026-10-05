// src/components/DocumentationPage.jsx
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../admin/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DocumentationPage.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { safeId } from "../utils/safeNav";
import { buildTagSuffix } from "../utils/tagReturnPath";

// Function to remove emojis safely from a string string layout parameters
const removeEmojis = (str) => {
    if (!str) return '';
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

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
    const params = useParams();
  const moduleId = safeId(params.moduleId);
  const topicId = safeId(params.topicId);
  const cardId = safeId(params.cardId);
    const navigate = useNavigate();
    const location = useLocation();
    // Only validated tag/region/path ids are carried through (see tagReturnPath.js).
    const returnQuery = new URLSearchParams(location.search);
    const returnSuffix = buildTagSuffix(returnQuery.get("tag"), returnQuery.get("region"), returnQuery.get("path"));

    const [moduleData, setModuleData] = useState(null);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dynamic scroll tracking: Instantly focus top axis when active knowledge card mutates
    useLayoutEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [cardId]);

    // Effect to control layout viewport locking for active mobile sidebar drawers
    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    // Effect to fetch complete data metrics from backend service modules
    useEffect(() => {
        const fetchDocumentationData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!moduleId) {
                    setError("Workspace context error: Module ID is missing.");
                    setLoading(false);
                    return;
                }

                const fetchedModule = await api.getModule(moduleId);
                if (!fetchedModule) {
                    setError("The requested learning module could not be found.");
                    setLoading(false);
                    return;
                }
                setModuleData(fetchedModule);

                const foundTopic = fetchedModule.topics.find(t => t._id === topicId);
                if (!foundTopic) {
                    setError("The specified technical topic path does not exist.");
                    setLoading(false);
                    return;
                }
                setCurrentTopic(foundTopic);

                const foundCard = foundTopic.cards.find(card => card._id === cardId && card.card_type === 'knowledge');
                if (!foundCard) {
                    setError("Documentation node missing or current asset is not a knowledge card.");
                    setLoading(false);
                    return;
                }
                setCurrentCard(foundCard);
                setLoading(false);

            } catch (err) {
                console.error("Failed to fetch documentation data structures:", err);
                setError("Network error: Failed to pull documentation data streams.");
                setLoading(false);
            }
        };
        fetchDocumentationData();
    }, [moduleId, topicId, cardId]);

    const handleBackClick = () => {
        navigate(`/orbit/modules/${moduleId}${returnSuffix}`);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prevState => !prevState);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const renderCardContent = (card) => {
        if (!card || !card.content || card.card_type !== 'knowledge') {
            return <p className="ui-text doc-empty-note">No documentation content payload mapped for this tracking cell.</p>;
        }

        const { text } = card.content;
        const imageUrl = card.imageUrl;
        return (
            <div className="doc-card-content-body">
                {imageUrl && (
                    <div className="doc-card-media-wrapper">
                        <img src={imageUrl} alt="Documentation Illustrative Graph" className="doc-card-fluid-img" />
                    </div>
                )}
                <div className="doc-markdown-render-canvas">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {text}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="ui-loading doc-loading-overlay-screen">
                <span className="ui-spinner ui-spinner--lg" role="status"></span>
                <div>Synchronizing Workspace Documentation Nodes...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="doc-error-fallback-container">
                <div className="ui-card ui-card--roomy doc-error-card" role="alert">
                    <h5 className="ui-h3">System Resolution Error</h5>
                    <p className="ui-text">{error}</p>
                    <button className="ui-btn ui-btn--danger-soft ui-btn--sm doc-error-card__btn" onClick={handleBackClick}>
                        &larr; Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!currentCard || !moduleData || !currentTopic) {
        return <div className="doc-error-fallback-container ui-text">Core structure state tracking context mismatch.</div>;
    }

    const allKnowledgeCardsInTopic = currentTopic.cards.filter(card => card.card_type === 'knowledge');
    const currentCardIndex = allKnowledgeCardsInTopic.findIndex(card => card._id === cardId);
    const prevCard = currentCardIndex > 0 ? allKnowledgeCardsInTopic[currentCardIndex - 1] : null;
    const nextCard = currentCardIndex < allKnowledgeCardsInTopic.length - 1 ? allKnowledgeCardsInTopic[currentCardIndex + 1] : null;

    return (
        <div className="doc-master-page-layout">
            
            {/* 📁 LEFT SIDEBAR HUB: Strictly left-aligned dynamic lists tracking nodes */}
            <aside className={`doc-navigation-sidebar ${isSidebarOpen ? 'sidebar-drawer-active' : ''}`}>
                <div className="doc-sidebar-top-branding">
                    <div className="doc-sidebar-topic-meta-box">
                        <span className="ui-eyebrow ui-eyebrow--caps doc-sidebar-topic-tag">Active Topic</span>
                        <h2 className="doc-sidebar-topic-heading-title" title={currentTopic.title}>
                            {removeEmojis(currentTopic.title)}
                        </h2>
                    </div>
                    <button className="doc-sidebar-close-trigger-icon" onClick={closeSidebar} aria-label="Close Navigation Menu">
                        &times;
                    </button>
                </div>
                
                <nav className="doc-sidebar-links-nav-scroller">
                    <ul className="doc-sidebar-ul-list-root">
                        {allKnowledgeCardsInTopic.map((card) => (
                            <li key={card._id} className="doc-sidebar-li-node">
                                <Link 
                                    to={`/orbit/modules/${moduleId}/topics/${topicId}/cards/${card._id}/documentation${returnSuffix}`} 
                                    className={`doc-sidebar-anchor-link ${card._id === cardId ? 'link-node-active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <div className="active-dot-marker"></div>
                                    <span className="doc-sidebar-link-text-truncate">{removeEmojis(card.content.title)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            
            {/* Dark Mobile Drawer Canvas Backdrop Blur */}
            {isSidebarOpen && (
                <div className="doc-sidebar-dimmer-overlay" onClick={closeSidebar}></div>
            )}
            
            {/* 📦 RIGHT CORE WORKING DOCUMENTATION CANVAS VIEWPORT */}
            <main className="doc-viewport-main-content-canvas">
                
                {/* Mobile Floating Action Control Header HUD */}
                <div className="doc-mobile-sticky-action-bar">
                    <button className="ui-btn ui-btn--ghost ui-btn--sm doc-mobile-back-btn" onClick={handleBackClick}>
                        &larr; Exit
                    </button>
                    <div className="doc-mobile-center-title-truncate">{removeEmojis(currentCard.content.title)}</div>
                    <button 
                        className={`doc-mobile-hamburger-trigger-btn ${isSidebarOpen ? 'trigger-rotated' : ''}`} 
                        onClick={toggleSidebar} 
                        aria-label="Toggle Document Navigation Menu"
                    >
                        <span className="hamburger-line-span"></span>
                        <span className="hamburger-line-span"></span>
                        <span className="hamburger-line-span"></span>
                    </button>
                </div>
                
                {/* Dynamic Content Canvas Surface Housing */}
                <div className="ui-page ui-page--narrow doc-article-surface-card">
                    <button className="ui-btn ui-btn--ghost ui-btn--sm doc-desktop-back-anchor-btn" onClick={handleBackClick}>
                        &larr; Back to Module Curriculum
                    </button>
                    
                    <header className="doc-article-header-group">
                        <div className="ui-eyebrow doc-breadcrumb-badge-pill">documentation view</div>
                        <h1 className="ui-h1 doc-main-article-title-text">{currentCard.content.title}</h1>
                        <p className="doc-main-article-topic-sublabel">
                            Module Context: <span className="doc-meta-strong">{moduleData.title}</span> &bull; Topic: <span className="doc-meta-muted">{currentTopic.title}</span>
                        </p>
                    </header>
                    
                    <hr className="ui-divider doc-separator-line-divider" />
                    
                    {/* Render dynamically evaluated markdown layouts logs content */}
                    {renderCardContent(currentCard)}
                    
                    {/* 🔄 BOTTOM FOOTER PAGINATION NAVIGATION MATRIX */}
                    <footer className="doc-bottom-pagination-footer-nav">
                        {prevCard ? (
                            <Link to={`/orbit/modules/${moduleId}/topics/${topicId}/cards/${prevCard._id}/documentation${returnSuffix}`} className="ui-card ui-card--interactive doc-pagi-link pagi-left-align">
                                <div className="pagi-meta-sub">Previous Node</div>
                                <div className="pagi-title-text-truncate">{removeEmojis(prevCard.content.title)}</div>
                            </Link>
                        ) : <div className="pagi-spacer-box"></div>}
                        
                        {nextCard ? (
                            <Link to={`/orbit/modules/${moduleId}/topics/${topicId}/cards/${nextCard._id}/documentation${returnSuffix}`} className="ui-card ui-card--interactive doc-pagi-link pagi-right-align">
                                <div className="pagi-meta-sub">Next Node &rarr;</div>
                                <div className="pagi-title-text-truncate">{removeEmojis(nextCard.content.title)}</div>
                            </Link>
                        ) : <div className="pagi-spacer-box"></div>}
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default DocumentationPage;