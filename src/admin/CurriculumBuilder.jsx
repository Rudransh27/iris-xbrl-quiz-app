// src/admin/CurriculumBuilder.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Accordion, ListGroup, Card, Badge, Dropdown, Spinner, Button } from 'react-bootstrap';
import { FolderPlus, PlusCircle, LayoutTextWindow, PlayCircle, QuestionCircle, CodeSquare, ThreeDotsVertical, PencilSquare, Trash, ArrowUp, ArrowDown, FileEarmarkPdf, FileEarmarkPpt, Globe2, Building, Microsoft, LightningChargeFill, WindowPlus, Fire, Star, StarFill } from 'react-bootstrap-icons';
import api from './services/api'; 
import ConfirmationModal from '../components/ConfirmationModal'; 
import './CurriculumBuilder.css';

export default function CurriculumBuilder({ initialModulesList = [], onRefresh, onNavigate }) {
  const [modules, setModules] = useState(initialModulesList);
  
  const [activeModuleId, setActiveModuleId] = useState(() => localStorage.getItem('iris_active_module_id') || ''); 
  const [currentModuleData, setCurrentModuleData] = useState(null); 
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const saved = localStorage.getItem('iris_selected_topic');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [fetchingTree, setFetchingTree] = useState(false);
  const [processingAction, setProcessingAction] = useState(false); 

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmButtonText: "",
    variant: "primary",
    requireTextVerification: false,
    verificationText: "DELETE", 
    onConfirmHandler: () => {}
  });

  // Sync state selectors triggers to localStorage
  useEffect(() => {
    if (activeModuleId) localStorage.setItem('iris_active_module_id', activeModuleId);
    else localStorage.removeItem('iris_active_module_id');
  }, [activeModuleId]);

  useEffect(() => {
    if (selectedTopic) localStorage.setItem('iris_selected_topic', JSON.stringify(selectedTopic));
    else localStorage.removeItem('iris_selected_topic');
  }, [selectedTopic]);

  // Synchronize dynamic updates structures loops 
  useEffect(() => {
    setModules(initialModulesList);
    if (activeModuleId && initialModulesList.length > 0) {
      const match = initialModulesList.find(m => m._id === activeModuleId);
      if (match) {
        api.getModule(activeModuleId)
          .then(freshData => {
            // 🚀 CLEANUP BACKWARD LOGIC: Fallback safeguard if a legacy record has old module-level strings attached
            if (freshData && freshData.engineStrategy === 'HTML_SANDBOX') {
              freshData.engineStrategy = 'EXPRESS_FLAT';
              freshData.hasTopics = false;
            }
            setCurrentModuleData(freshData);
            
            // HYBRID SYNC: Only hydrate saved sub-topics if the layout architecture supports it
            if (freshData && freshData.hasTopics !== false) {
              const savedTopicId = localStorage.getItem('iris_selected_topic_id');
              const targetId = savedTopicId || selectedTopic?._id;
              if (targetId && freshData.topics) {
                const freshTopic = freshData.topics.find(t => t._id === targetId);
                if (freshTopic) setSelectedTopic(freshTopic);
              }
            } else {
              setSelectedTopic(null); // Explicitly flush sub-topic structures if flat path active
            }
          })
          .catch(err => console.error("Sync error:", err));
      }
    }
  }, [initialModulesList, activeModuleId]);

  const handleLoadModuleTree = async (moduleId) => {
    if (!moduleId || moduleId === activeModuleId) {
      setActiveModuleId(''); setCurrentModuleData(null); setSelectedTopic(null);
      localStorage.removeItem('iris_active_module_id'); localStorage.removeItem('iris_selected_topic'); localStorage.removeItem('iris_selected_topic_id');
      return;
    }
    setActiveModuleId(moduleId); setFetchingTree(true); setSelectedTopic(null); setCurrentModuleData(null);
    localStorage.removeItem('iris_selected_topic'); localStorage.removeItem('iris_selected_topic_id');

    try {
      const fullData = await api.getModule(moduleId);
      // 🚀 CLEANUP BACKWARD LOGIC: Re-route on load if old format matches
      if (fullData && fullData.engineStrategy === 'HTML_SANDBOX') {
        fullData.engineStrategy = 'EXPRESS_FLAT';
        fullData.hasTopics = false;
      }
      setCurrentModuleData(fullData);
      
      // HYBRID ROUTING MATRIX
      if (fullData?.hasTopics !== false && fullData?.topics && fullData.topics.length > 0) {
        setSelectedTopic(fullData.topics[0]);
        localStorage.setItem('iris_selected_topic_id', fullData.topics[0]._id);
      }
    } catch (err) { console.error(err); } finally { setFetchingTree(false); }
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const openDeleteModuleModal = (moduleId, e) => {
    e.stopPropagation();
    
    const targetModule = modules.find(m => m._id === moduleId);
    const verificationKeyword = targetModule?.title || "DELETE";

    setModalConfig({
      isOpen: true,
      title: "⚠️ CRITICAL WARNING: Permanent Module Excision",
      message: `Danger Zone! You are deleting this primary module stream. To confirm, please type out the module title exact match string sequence: "${verificationKeyword}"`,
      confirmButtonText: "Permanently Wipe Module Data",
      variant: "danger",
      requireTextVerification: true, 
      verificationText: verificationKeyword, 
      onConfirmHandler: async () => {
        try {
          await api.deleteModule(moduleId);
          localStorage.removeItem('iris_active_module_id');
          localStorage.removeItem('iris_selected_topic');
          localStorage.removeItem('iris_selected_topic_id');
          closeModal();
          onRefresh();
        } catch (err) { alert(err.message); }
      }
    });
  };

  const handleToggleHotModule = async (mod, e) => {
    e.stopPropagation();
    try {
      await api.setHotModule(mod._id, !mod.isHotModule);
      onRefresh();
    } catch (err) { alert(err.message); }
  };

  const handleTogglePopular = async (mod, e) => {
    e.stopPropagation();
    try {
      await api.setPopularModule(mod._id, !mod.isPopular);
      onRefresh();
    } catch (err) { alert(err.message); }
  };

  const openDeleteTopicModal = (topicId, e) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      title: "❌ Confirm Sub-Topic Tree Purge",
      message: "Are you sure you want to remove this topic node from the live database track? Type 'DELETE' to acknowledge that this action will drop all its associated content blocks.",
      confirmButtonText: "Confirm Purge Node",
      variant: "danger",
      requireTextVerification: true, 
      verificationText: "DELETE", 
      onConfirmHandler: async () => {
        setProcessingAction(true);
        try {
          await api.deleteTopic(topicId);
          if (selectedTopic?._id === topicId) {
            setSelectedTopic(null);
            localStorage.removeItem('iris_selected_topic');
            localStorage.removeItem('iris_selected_topic_id');
          }
          closeModal();
          onRefresh();
        } catch (err) { alert(err.message || "Failed to destroy target topic node."); }
        finally { setProcessingAction(false); }
      }
    });
  };

  const openDeleteCardModal = (cardId) => {
    setModalConfig({
      isOpen: true,
      title: "Drop Content Card Unit Node",
      message: "Remove this specific resource block item from the active syllabus pathway? Active trainee logs for this item will reset.",
      confirmButtonText: "Unmount Node Asset",
      variant: "danger",
      requireTextVerification: false, 
      verificationText: "",
      onConfirmHandler: async () => {
        setProcessingAction(true);
        try {
          await api.deleteCard(cardId);
          closeModal();
          onRefresh();
        } catch (err) { alert(err.message || "Failed to drop content asset block."); }
        finally { setProcessingAction(false); }
      }
    });
  };

  const handleShiftCardOrder = async (index, direction) => {
    const cardsArray = currentModuleData?.hasTopics === false 
      ? currentModuleData.cards 
      : selectedTopic?.cards;

    if (!cardsArray) return;
    const targetCards = [...cardsArray];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= targetCards.length) return;
    
    setProcessingAction(true);
    const tempNode = targetCards[index];
    targetCards[index] = targetCards[targetIndex];
    targetCards[targetIndex] = tempNode;
    
    const batchUpdates = targetCards.map((card, idx) => ({ _id: card._id, cardOrder: idx + 1 }));
    try {
      await Promise.all(batchUpdates.map(update => api.updateCard(update._id, { cardOrder: update.cardOrder })));
      onRefresh();
    } catch (err) { alert("Failed to synchronize sequence."); }
    finally { setProcessingAction(false); }
  };

  const renderCardTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'knowledge': return <LayoutTextWindow className="text-success" />;
      case 'video': return <PlayCircle className="text-primary" />;
      case 'quiz': return <QuestionCircle className="text-warning" />;
      case 'code': return <CodeSquare className="text-danger" />;
      case 'html_sandbox': return <WindowPlus className="text-success" />; 
      case 'pdf': return <FileEarmarkPdf className="text-warning" />; 
      case 'ppt':
      case 'pptx': return <FileEarmarkPpt className="text-info" />; 
      default: return <LayoutTextWindow className="text-secondary" />;
    }
  };

  const renderVisibilityBadge = (visibility) => {
    switch (visibility) {
      case 'Global':
        return <Badge bg="primary" className="d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '9px' }}><Globe2 size={10}/> GLOBAL</Badge>;
      case 'Departmental':
        return <Badge bg="success" className="d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '9px' }}><Building size={10}/> DEPT</Badge>;
      case 'Team-Specific':
        return <Badge bg="dark" className="d-flex align-items-center gap-1 font-monospace text-secondary-brand" style={{ fontSize: '9px' }}><Microsoft size={9}/> TEAM</Badge>;
      default:
        return null;
    }
  };

  const isFlatPipelineActive = currentModuleData && currentModuleData.hasTopics === false;
  const shouldRenderWorkspace = selectedTopic || isFlatPipelineActive;
  
  const activeWorkspaceTitle = isFlatPipelineActive ? currentModuleData.title : selectedTopic?.title;
  const activeCardsList = isFlatPipelineActive ? (currentModuleData.cards || []) : (selectedTopic?.cards || []);

  return (
    <div className="iris-curriculum-builder-workspace animate-fade-in" style={{ pointerEvents: processingAction ? 'none' : 'auto' }}>
      
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirmHandler}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmButtonText={modalConfig.confirmButtonText}
        variant={modalConfig.variant}
        requireTextVerification={modalConfig.requireTextVerification}
        verificationText={modalConfig.verificationText} 
      />

      <Row className="g-0" style={{ minHeight: 'calc(100vh - 74px)' }}>
        
        {/* COURSE HIERARCHY LEFT PANEL */}
        <Col md={4} lg={3} className="cb-sidebar-panel border-end border-slate bg-white">
          <div className="cb-sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom">
            <div>
              <h6 className="m-0 fw-bold text-dark">Course Hierarchy</h6>
              <small className="text-muted font-monospace" style={{ fontSize: '10px' }}>CURRICULUM TREE</small>
            </div>
            <Button variant="none" className="p-1 btn-outline-primary btn-sm rounded-2" onClick={() => onNavigate('add-module')}>
              <FolderPlus size={16} />
            </Button>
          </div>

          <div className="cb-sidebar-scroll-track">
            <Accordion activeKey={activeModuleId} onSelect={(key) => handleLoadModuleTree(key)} className="cb-accordion-root">
              {modules.map((mod) => (
                <Accordion.Item eventKey={mod._id} key={mod._id} className="border-0 border-bottom">
                  <Accordion.Header>
                    <div className="text-truncate text-start w-100 d-flex justify-content-between align-items-center pe-2">
                      <div className="d-flex flex-column gap-1 text-truncate" style={{ maxWidth: '70%' }}>
                        <span className="text-dark small fw-bold text-truncate">{mod.title}</span>
                        <div className="d-flex gap-1 align-items-center">
                          {renderVisibilityBadge(mod.visibility)}
                          {/* 🚀 HYBRID RENDER UPDATED: Evaluates whether this item skips sub-topic rails accurately */}
                          {(activeModuleId === mod._id && currentModuleData ? currentModuleData.hasTopics === false : mod.hasTopics === false) && (
                            <Badge bg="info" className="d-flex align-items-center gap-0.5 font-monospace" style={{ fontSize: '9px', color: '#fff' }}>
                              <LightningChargeFill size={9}/> EXPRESS
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* as="span": Accordion.Header already renders a native <button> around
                          this whole row, so nesting real <button> elements inside it is invalid
                          HTML — react-bootstrap's Button supports polymorphic rendering via `as`
                          to keep identical styling/click behavior without the nested button. */}
                      <div className="d-flex gap-2 align-items-center flex-shrink-0">
                        <Button
                          as="span"
                          role="button"
                          variant="none"
                          className={`p-0 ${mod.isHotModule ? "text-warning" : "text-muted"}`}
                          title={mod.isHotModule ? "Unset Hot Module" : "Mark as platform-wide Hot Module"}
                          onClick={(e) => handleToggleHotModule(mod, e)}
                        >
                          <Fire size={13} color={mod.isHotModule ? "var(--amber-glow)" : undefined} />
                        </Button>
                        <Button
                          as="span"
                          role="button"
                          variant="none"
                          className={`p-0 ${mod.isPopular ? "text-warning" : "text-muted"}`}
                          title={mod.isPopular ? "Remove from Popular Modules" : "Feature in Popular Modules row"}
                          onClick={(e) => handleTogglePopular(mod, e)}
                        >
                          {mod.isPopular ? <StarFill size={13} color="var(--amber-glow)" /> : <Star size={13} />}
                        </Button>
                        <Button as="span" role="button" variant="none" className="p-0 text-primary hover-edit-action" onClick={(e) => { e.stopPropagation(); onNavigate('add-module', '', '', mod); }}>
                          <PencilSquare size={13} />
                        </Button>
                        <Button as="span" role="button" variant="none" className="p-0 text-muted hover-danger-action" onClick={(e) => openDeleteModuleModal(mod._id, e)}>
                          <Trash size={13} />
                        </Button>
                      </div>
                    </div>
                  </Accordion.Header>
                  
                  <Accordion.Body className="p-0 bg-white">
                    {(activeModuleId === mod._id && currentModuleData ? currentModuleData.hasTopics !== false : mod.hasTopics !== false) ? (
                      <>
                        <div className="p-2 bg-light border-bottom text-center">
                          <button className="btn btn-sm btn-link text-decoration-none text-secondary p-0 font-monospace" style={{ fontSize: '11px' }} onClick={() => onNavigate('add-topic', mod._id, currentModuleData?.topics?.length || 0)}>
                            <PlusCircle size={12} className="me-1" /> ADD NEW TOPIC
                          </button>
                        </div>

                        {fetchingTree && activeModuleId === mod._id && (
                          <div className="text-center py-4"><Spinner animation="border" size="sm" style={{color: '#0f256e'}} /></div>
                        )}

                        {activeModuleId === mod._id && !fetchingTree && currentModuleData && (
                          <ListGroup variant="flush" className="cb-topic-list-group">
                            {(!currentModuleData.topics || currentModuleData.topics.length === 0) ? (
                              <div className="p-3 text-muted small italic text-center">No nested sub-topic tracks found.</div>
                            ) : (
                              currentModuleData.topics.map((topic) => {
                                const isActive = selectedTopic?._id === topic._id;
                                return (
                                  <ListGroup.Item 
                                    key={topic._id} action onClick={() => { setSelectedTopic(topic); localStorage.setItem('iris_selected_topic_id', topic._id); }}
                                    className={`border-0 py-2.5 px-3 cb-topic-item position-relative d-flex align-items-center justify-content-between ${isActive ? 'cb-topic-active' : ''}`}
                                    style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500' }}
                                  >
                                    <div className="active-dot-marker" style={{ opacity: isActive ? 1 : 0 }}></div>
                                    <span className="text-truncate d-inline-block ps-2" style={{ maxWidth: '120px' }}>{topic.title}</span>
                                    
                                    <div className="d-flex align-items-center gap-2 ms-auto">
                                      <Badge bg="white" className="text-muted border rounded-pill font-monospace" style={{ fontSize: '9px' }}>{topic.cards?.length || 0} C</Badge>
                                      <Button variant="none" className="p-0 text-primary hover-edit-action-inline" onClick={(e) => { e.stopPropagation(); onNavigate('add-topic', mod._id, '', topic); }}>
                                        <PencilSquare size={12} />
                                      </Button>
                                      <Button variant="none" className="p-0 text-muted hover-danger-action-inline" onClick={(e) => openDeleteTopicModal(topic._id, e)}>
                                        <Trash size={12} />
                                      </Button>
                                    </div>
                                  </ListGroup.Item>
                                );
                              })
                            )}
                          </ListGroup>
                        )}
                      </>
                    ) : (
                      <div className="p-3 text-center bg-light text-muted font-monospace border-bottom" style={{ fontSize: '11px', borderLeft: '3px solid #0dcaf0' }}>
                        ⚡ Express pipeline strategy active. Card assets map directly above.
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        </Col>

        {/* WORKSPACE & ARRAYS CARDS PANEL TRACKS */}
        <Col md={8} lg={9} className="cb-main-workspace p-4 d-flex flex-column gap-4" style={{ backgroundColor: '#fafbfe' }}>
          {shouldRenderWorkspace ? (
            <div className="animate-fade-in flex-grow-1">
              
              <div className="d-flex justify-content-between align-items-center bg-white p-3 border border-slate rounded-3 mb-4 shadow-sm">
                <div>
                  <span className="text-uppercase text-muted font-monospace fw-bold" style={{ fontSize: '10px' }}>
                    {isFlatPipelineActive ? "Active Workspace Module (Flat Pipeline)" : "Active Workspace Topic"}
                  </span>
                  <h4 className="fw-bold text-dark m-0 mt-1">{activeWorkspaceTitle}</h4>
                </div>
                <Button 
                  className="btn btn-sm btn-primary fw-bold px-3 rounded-2" 
                  style={{ backgroundColor: '#0f256e', borderColor: '#0f256e' }} 
                  onClick={() => onNavigate('add-card', activeModuleId, isFlatPipelineActive ? '' : selectedTopic._id)}
                >
                  <PlusCircle size={14} className="me-1" /> Add Card Unit
                </Button>
              </div>

              <h6 className="fw-bold text-secondary mb-3">Resource Content Stack Matrix ({activeCardsList.length})</h6>
              <Row className="g-2 mb-4">
                {(activeCardsList.length === 0) ? (
                  <div className="text-center text-muted p-5 bg-white border border-slate rounded-3">This target branch configuration directory contains no data elements loaded yet.</div>
                ) : (
                  activeCardsList.map((card, cIdx) => (
                    <Col xs={12} key={card._id || cIdx}>
                      <Card className="border-slate rounded-3 bg-white shadow-none cb-card-row">
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                          
                          <div className="d-flex align-items-center gap-3 text-truncate w-65">
                            <div className="d-flex flex-column gap-0.5 align-items-center border-end pe-2.5" style={{ borderColor: '#e2e8f0' }}>
                              <Button variant="none" className="p-0 text-muted hover-edit-action" disabled={cIdx === 0} onClick={() => handleShiftCardOrder(cIdx, 'up')}>
                                <ArrowUp size={12} />
                              </Button>
                              <Button variant="none" className="p-0 text-muted hover-edit-action" disabled={cIdx === activeCardsList.length - 1} onClick={() => handleShiftCardOrder(cIdx, 'down')}>
                                <ArrowDown size={12} />
                              </Button>
                            </div>

                            <div className="cb-avatar-icon flex-shrink-0">
                              {renderCardTypeIcon(card.card_type)}
                            </div>
                            <span className="text-dark fw-semibold text-truncate small">
                              <span className="text-muted font-monospace me-1">#{card.cardOrder || (cIdx + 1)}</span> 
                              {card.content?.title || 'Untitled Node Asset'}
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            <Badge className={`cb-badge-type cb-badge-${card.card_type || 'default'}`}>{card.card_type}</Badge>
                            
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="none" className="p-0 border-0 text-muted shadow-none">
                                <ThreeDotsVertical size={16} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="border-slate rounded-0" style={{ fontSize: '13px' }}>
                                <Dropdown.Item className="py-2" onClick={() => onNavigate('add-card', activeModuleId, isFlatPipelineActive ? '' : selectedTopic._id, card)}>
                                  <PencilSquare className="text-primary me-2" /> Modify Content
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2 text-danger" onClick={() => openDeleteCardModal(card._id)}>
                                  <Trash className="me-2" /> Unmount Node
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>

                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </div>
          ) : (
            <div className="text-center text-muted p-5 bg-white border border-slate rounded-3 m-4 shadow-sm">
              Select an option from the course rails structure menu tree grid system list to display topic tracking panels elements nodes.
            </div>
          )}
        </Col>

      </Row>
    </div>
  );
}