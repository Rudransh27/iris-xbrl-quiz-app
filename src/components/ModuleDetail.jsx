// src/pages/ModuleDetail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ModuleCardEach from './ModuleCardEach';
import ModuleReviews from './ModuleReviews';
import api from '../admin/services/api';
import { ArrowLeft, ChevronDown, JournalText, Book, CodeSquare, PlayCircle, FileEarmarkPdf, FileEarmarkPpt, CheckCircle } from 'react-bootstrap-icons'; // 🌟 Imported icons for card formatting types
import './ModuleDetail.css';
import AuthContext from '../context/AuthContext';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Which tag this module was opened from (if any) — carried as ?tag= so
  // "Back to Trails" and every deeper navigation (topics, documentation)
  // returns to that filtered tag view instead of the flat all-modules list.
  const tagId = new URLSearchParams(location.search).get("tag");
  const tagSuffix = tagId ? `?tag=${tagId}` : "";
  const [tagName, setTagName] = useState(null);

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopicIndex, setExpandedTopicIndex] = useState(null);

  useEffect(() => {
    if (!tagId) { setTagName(null); return; }
    api.getCategory(tagId).then((res) => setTagName(res?.data?.name || null)).catch(() => setTagName(null));
  }, [tagId]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const data = await api.getModule(moduleId);
        setModule(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch module dataset:", error);
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const handleTopicClick = (index) => {
    setExpandedTopicIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleNavigateToCardDocumentation = (topicId, cardId, cardType, event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    // Route to the appropriate viewer based on card type mapping rules
    navigate(`/orbit/modules/${moduleId}/topics/${topicId}/cards/${cardId}/documentation${tagSuffix}`);
  };

  const handleStartTrail = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    const isSessionActive = user && (user._id || user.id);

    if (isSessionActive) {
      navigate(`/orbit/modules/${moduleId}/topics${tagSuffix}`);
    } else {
      navigate('/login');
    }
  };

  // 🛠️ HELPER: Dynamic Format Icon Render Engine
  const getCardIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'quiz': return <CheckCircle size={13} className="text-success" />;
      case 'code': return <CodeSquare size={13} className="text-danger" />;
      case 'video': return <PlayCircle size={13} className="text-primary" />;
      case 'pdf': return <FileEarmarkPdf size={13} className="text-warning" />;
      case 'ppt':
      case 'pptx': return <FileEarmarkPpt size={13} className="text-info" />;
      default: return <Book size={13} className="doc-icon-tint" />;
    }
  };

  if (loading) {
    return (
      <div className="cyber-loading-container font-monospace">
        <div className="cyber-spinner"></div>
        <span>LOADING PARAMETERS...</span>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="no-modules-placeholder font-monospace text-center m-5">
        System Error: Module cluster data not resolved.
      </div>
    );
  }

  // 🏢 A module can now belong to several departments — prefer the one
  // matching this learner's own department (so the badge/theming reflects
  // their own context), else fall back to the first target department.
  const getOwnDept = () => {
    const depts = Array.isArray(module.departments) ? module.departments : [];
    if (depts.length === 0) return null;
    const ownDeptId = (user?.department?._id || user?.department || "").toString();
    const match = depts.find(d => (d?._id || d)?.toString() === ownDeptId);
    return match || depts[0];
  };

  const getDeptCode = () => {
    const dept = getOwnDept();
    if (!dept) return "global";
    return typeof dept === "object" ? dept.code || "global" : dept;
  };

  const getDeptName = () => {
    const dept = getOwnDept();
    if (!dept) return "GLOBAL";
    return typeof dept === "object" ? dept.name || "GLOBAL" : dept;
  };

  const currentTopics = module.topics || [];
  
  // 👥 UPDATED: Extract all valid structural card entries instead of hardblocking to 'knowledge'
  const activeTopic = expandedTopicIndex !== null ? currentTopics[expandedTopicIndex] : null;
  const topicCardsList = activeTopic && activeTopic.cards ? activeTopic.cards : [];

  const deptClass = getDeptCode().toLowerCase();

  return (
    <div className={`module-detail-page dept-context-${deptClass}`}>
      <div className="detail-ambient-grid"></div>
      
      <div className="module-detail-wrapper">
        
        <button
          className="detail-back-btn"
          onClick={() => navigate(tagId ? `/orbit/tags/${tagId}` : '/orbit/modules')}
        >
          <ArrowLeft size={14} /> <span>{tagId ? `Back to ${tagName || "Category"}` : "Back to Trails"}</span>
        </button>
        
        <div className="module-detail-layout-split">
          
          <div className="module-detail-left-panel animate-fade-up">
            <span className="detail-pill-tag font-monospace">
              {module.visibility === "Global" ? "GLOBAL TRACK" : `${getDeptName().toUpperCase()} TRACK`}
            </span>
            <h1 className="detail-main-title">{module.title}</h1>
            <p className="detail-main-desc">{module.description}</p>
            
            <div className="curriculum-header-bar">
              <JournalText size={16} className="text-muted" />
              <h3 className="curriculum-heading">Topics Covered in this Module</h3>
            </div>

            <div className="topics-accordion-group">
              {currentTopics.map((topic, index) => {
                const currentTopicId = topic._id || topic.id;
                const isExpanded = expandedTopicIndex === index;
                
                return (
                  <div key={currentTopicId || index} className={`accordion-node-item ${isExpanded ? 'active-node' : ''}`}>
                    <div
                      className="accordion-trigger-row"
                      onClick={() => handleTopicClick(index)}
                    >
                      <div className="trigger-title-stack">
                        <span className="topic-index-badge font-monospace">{(index + 1).toString().padStart(2, '0')}</span>
                        <span className="accordion-title-text">{topic.title}</span>
                      </div>
                      <ChevronDown size={14} className={`accordion-arrow-vector ${isExpanded ? 'rotated' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="accordion-collapsible-drawer">
                        {topicCardsList.length > 0 ? (
                          <div className="chapters-links-stack">
                            {topicCardsList.map((card) => {
                              const currentCardId = card._id || card.id;
                              return (
                                <div 
                                  key={currentCardId} 
                                  className="chapter-document-anchor-row d-flex align-items-center gap-2"
                                  onClick={(e) => handleNavigateToCardDocumentation(currentTopicId, currentCardId, card.card_type, e)}
                                >
                                  {/* 🛠️ Dynamic Icon applied directly based on card media type mapping */}
                                  {getCardIcon(card.card_type)}
                                  <span className="doc-title-string">
                                    {card.content?.title || 'Untitled Curriculum Element'} 
                                    <span className="text-muted font-monospace ms-2 small" style={{ fontSize: '10px' }}>
                                      ({card.card_type?.toUpperCase()})
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="no-chapters-notice font-monospace">
                            No step components registered inside this topic layer node.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="module-detail-right-panel animate-fade-up">
            <div className="sticky-sidebar-card-holder">
              <ModuleCardEach
                title={module.title}
                description={module.description}
                department={getOwnDept()}
                isButtonVisible={true}
                buttonText="Start Learning Trail"
                onButtonClick={(e) => handleStartTrail(e)} 
              />
            </div>
          </div>

        </div>

        <ModuleReviews moduleId={module._id || module.id} />

      </div>
    </div>
  );
}