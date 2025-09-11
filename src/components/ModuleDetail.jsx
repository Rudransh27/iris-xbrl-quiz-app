// src/components/ModuleDetail.jsx

import React, { useState, useEffect, useLayoutEffect, useContext } from 'react'; // Import useContext
import { useParams, useNavigate } from "react-router-dom";
import ModuleCardEach from './ModuleCardEach';
import api from '../admin/services/api';
import './ModuleDetail.css';
import AuthContext from '../context/AuthContext'; // Import AuthContext

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get user from AuthContext

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
        console.error("Failed to fetch module data:", error);
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const handleTopicClick = (index) => {
    if (expandedTopicIndex === index) {
      setExpandedTopicIndex(null);
    } else {
      setExpandedTopicIndex(index);
    }
  };

  const handleNavigateToCardDocumentation = (topicId, cardId, event) => {
    event.stopPropagation();
    navigate(`/modules/${moduleId}/topics/${topicId}/cards/${cardId}/documentation`);
  };

  // --- MODIFIED FUNCTION ---
  const handleStartTrail = () => {
    if (user) { // Check if user is logged in
      // If logged in, navigate to the topics
      navigate(`/modules/${moduleId}/topics`);
    } else {
      // If not logged in, navigate to the login page
      navigate('/login');
    }
  };
  // --- END MODIFIED FUNCTION ---

  const handleBackToModules = () => {
    navigate('/modules');
  };

  if (loading) {
    return <div className="loading-state">Loading module details...</div>;
  }

  if (!module) {
    return <div className="error-state">Module not found.</div>;
  }

  const activeTopic = expandedTopicIndex !== null ? module.topics[expandedTopicIndex] : null;
  const knowledgeCards = activeTopic ? activeTopic.cards.filter(card => card.card_type === 'knowledge') : [];

  return (
    <div className="module-detail-page">
      <div className="module-detail-background-shapes">
        <div className="detail-shape shape--circle-red"></div>
        <div className="detail-shape shape--square-yellow"></div>
      </div>

      <button className="back-btn" onClick={handleBackToModules}>&larr; Back to Modules</button>
      
      <div className="module-detail-content-wrapper">
        <div className="module-detail-left">
          <h1 className="module-title">{module.title}</h1>
          <p className="module-description">{module.description}</p>
          
          <h2 className="content-heading">Topics Covered in this Module</h2>
          <div className="topics-table">
            {module.topics.map((topic, index) => (
              <div key={topic.id || index}>
                <div
                  className={`topic-item ${expandedTopicIndex === index ? 'expanded' : ''}`}
                  onClick={() => handleTopicClick(index)}
                >
                  <span className="topic-icon">&gt;</span>
                  <span className="topic-title">
                    {topic.title}
                  </span>
                </div>
                {expandedTopicIndex === index && knowledgeCards.length > 0 && (
                  <div className="knowledge-cards-list-wrapper">
                    <div className="knowledge-cards-list">
                      {knowledgeCards.map((card) => (
                        <div 
                          key={card.id} 
                          className="knowledge-card-link clickable"
                          onClick={(e) => handleNavigateToCardDocumentation(topic._id, card._id, e)}
                        >
                          {card.content.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="module-detail-right">
          <ModuleCardEach
            title={module.title}
            imageUrl={module.imageUrl}
            description={module.description}
            department={module.department}
            isButtonVisible={true}
            buttonText="Start Learning Trail"
            onButtonClick={handleStartTrail}
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleDetail;