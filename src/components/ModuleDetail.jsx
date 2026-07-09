// src/pages/ModuleDetail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import ModuleCardEach from './ModuleCardEach';
import api from '../admin/services/api';
import { ArrowLeft, ChevronDown, JournalText, Book, CodeSquare, PlayCircle, FileEarmarkPdf, FileEarmarkPpt, CheckCircle } from 'react-bootstrap-icons'; // 🌟 Imported icons for card formatting types
import './ModuleDetail.css';
import AuthContext from '../context/AuthContext';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopicIndex, setExpandedTopicIndex] = useState(null);

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
    navigate(`/orbit/modules/${moduleId}/topics/${topicId}/cards/${cardId}/documentation`);
  };

  const handleStartTrail = (event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    const isSessionActive = user && (user._id || user.id);

    if (isSessionActive) {
      navigate(`/orbit/modules/${moduleId}/topics`);
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

  const getDeptCode = () => {
    if (!module.department) return "global";
    return typeof module.department === "object" ? module.department.code || "global" : module.department;
  };

  const getDeptName = () => {
    if (!module.department) return "GLOBAL";
    return typeof module.department === "object" ? module.department.name || "GLOBAL" : module.department;
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
        
        <button className="detail-back-btn" onClick={() => navigate('/orbit/modules')}>
          <ArrowLeft size={14} /> <span>Back to Trails</span>
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
                department={module.department}
                isButtonVisible={true}
                buttonText="Start Learning Trail"
                onButtonClick={(e) => handleStartTrail(e)} 
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}