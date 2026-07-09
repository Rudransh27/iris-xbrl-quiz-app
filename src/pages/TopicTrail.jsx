// src/pages/TopicTrail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopicCard from '../components/TopicCard';
import api from '../admin/services/api';
import { ArrowLeft } from 'react-bootstrap-icons';
import './TopicTrail.css';
import AuthContext from '../context/AuthContext';
import { setCurrentModule } from '../components/OrbitDashboard/currentModuleStorage';

export default function TopicTrail() {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext); 

    const [topics, setTopics] = useState([]);
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetchLearningData = async () => {
            if (!user) {
                setLoading(false);
                return navigate('/login');
            }

            try {
                console.log("⏳ Fetching module topics and flat user analytics...");
                const moduleData = await api.getModule(moduleId);
                
                // 🔀 ARCHITECTURAL INTERCEPTOR: Preserved flat validation handling
                if (moduleData && moduleData.hasTopics === false) {
                    console.log("⚡ Express flat pipeline detected. Bypassing syllabus grid map.");
                    return navigate(`/quiz/${moduleId}/undefined`);
                }

                const progressData = await api.getUserProgress();

                setTopics(moduleData?.topics || []);
                setUserProgress(progressData); 

                setLoading(false);
            } catch (error) {
                console.error('❌ Failed to fetch module or progress data:', error);
                setLoading(false);
                navigate('/orbit/modules');
            }
        };

        if (moduleId) {
            fetchLearningData();
        }
    }, [moduleId, navigate, user, location.key]);

    const isTopicUnlocked = () => {
        return true; 
    };

    const getTopicProgress = (topic) => {
        if (!topic || !topic.cards) {
            return { cardsCovered: 0, totalCards: 0, isCompleted: false };
        }

        const totalCardsInTopic = topic.cards.length;
        const completedCardIdsInApp = userProgress?.completedCardIds || [];
        const completedTopicIdsInApp = userProgress?.completedTopicIds || [];
        const currentTopicId = topic._id ? topic._id.toString() : '';
        
        const cardsCoveredCount = topic.cards.filter(card => {
            if (!card?._id) return false;
            return completedCardIdsInApp.includes(card._id.toString());
        }).length;

        const isCompleted = currentTopicId ? completedTopicIdsInApp.includes(currentTopicId) : false;

        return {
            cardsCovered: cardsCoveredCount,
            totalCards: totalCardsInTopic,
            isCompleted: isCompleted,
        };
    };

    return (
        <div className="topic-trail-page">
            <div className="duo-topic-container">
                
                {/* ================= BACK NAVIGATION ROW ================= */}
                <div className="trail-btn-pos">
                    <button onClick={() => navigate('/orbit/modules')} className="trail-back-btn">
                        <ArrowLeft size={16} /> <span>Back to Trails</span>
                    </button>
                </div>

                {/* ================= HEADER SUBTITLE PACK ================= */}
                <div className="topic-page-header text-center">
                  <h1 className="topic-page-title">Your Learning Topics</h1>
                  <p className="topic-page-subtitle">
                    Select a target topic node below to begin your functional simulation journey.
                  </p>
                </div>

                {/* ================= TOPICS CARD GRID MATRIX ================= */}
                <div className="topics-grid-container">
                    {loading ? (
                        <div className="topic-trail-cards-grid">
                            {Array(3).fill(0).map((_, idx) => (
                                <div className="skeleton-topic-card" key={idx}>
                                    <div className="skeleton-node skeleton-icon-sphere"></div>
                                    <div className="skeleton-node skeleton-text-title"></div>
                                    <div className="skeleton-node skeleton-text-paragraph"></div>
                                    <div className="skeleton-node skeleton-progress-track"></div>
                                </div>
                            ))}
                        </div>
                    ) : topics.length > 0 ? (
                        <div className="topic-trail-cards-grid">
                            {topics.map((topic, index) => {
                                const progress = getTopicProgress(topic);
                                const isUnlocked = isTopicUnlocked(); 
                                const status = progress.isCompleted ? 'completed' : 'unlocked';

                                return (
                                    <div className="topic-stagger-wrapper" key={topic._id || index}>
                                        <TopicCard
                                            topicId={topic._id}
                                            moduleId={moduleId}
                                            title={topic.title}
                                            description={topic.description}
                                            image={topic.image}
                                            status={status}
                                            progress={progress}
                                            estimatedTime={topic.estimatedTime}
                                            pointsReward={topic.pointsReward}
                                            onClick={() => {
                                                if (isUnlocked) {
                                                    setCurrentModule(user?._id, { moduleId, topicId: topic._id });
                                                    navigate(`/quiz/${moduleId}/${topic._id}`);
                                                } else {
                                                    alert('This topic is locked!');
                                                }
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-topics-placeholder">
                           No topic nodes are currently mapped under this training module track.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}