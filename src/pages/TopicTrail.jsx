// src/pages/TopicTrail.jsx

import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopicCard from '../components/TopicCard';
import api from '../admin/services/api';
import './TopicTrail.css';
import AuthContext from '../context/AuthContext';

export default function TopicTrail() {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext); // Removed refreshUser since it's not needed for XP updates

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
                const moduleData = await api.getModule(moduleId);
                const progressData = await api.getUserProgress();

                setTopics(moduleData.topics || []);
                setUserProgress(progressData); // Now returns just the progress data, no 'data' key

                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch module or progress data:', error);
                setLoading(false);
                navigate('/modules');
            }
        };

        if (moduleId) {
            fetchLearningData();
        }
    }, [moduleId, navigate, user, location.key]);

    // This function is now simplified to always return true,
    // making all topics accessible regardless of completion.
    const isTopicUnlocked = () => {
        return true;
    };

    const getTopicProgress = (topic) => {
        if (!userProgress) {
            return {
                cardsCovered: 0,
                totalCards: topic.cards.length
            };
        }

        const moduleProgress = userProgress.modules.find(m => m.moduleId === moduleId);
        if (!moduleProgress) {
            return {
                cardsCovered: 0,
                totalCards: topic.cards.length
            };
        }

        const topicProgress = moduleProgress.topics.find(t => t.topicId === topic._id);
        const cardsCoveredCount = topicProgress?.cardsCovered?.length || 0;
        const isCompleted = topicProgress?.isCompleted || false;

        return {
            cardsCovered: cardsCoveredCount,
            totalCards: topic.cards.length,
            isCompleted: isCompleted,
        };
    };

    if (loading) {
        return <div className="loading-state">Loading topics...</div>;
    }

    return (
        <div className="topic-cards-page">
            <header className="page-header-container">
                <div className="btnPos">
                    <button onClick={() => navigate(`/modules/${moduleId}`)} className="back-btn">&larr; Back</button>
                </div>

                <div className="cards-header-content">
                    <h1>Your Learning Topics</h1>
                    <p>Select a topic to begin your journey.</p>
                    {/* The XP display is removed as requested */}
                </div>
            </header>

            <div className="card-background-shapes">
                <div className="card-shape-1"></div>
                <div className="card-shape-2"></div>
                <div className="card-shape-3"></div>
                <div className="card-shape-4"></div>
                <div className="card-shape-5"></div>
                <div className="card-shape-6"></div>
            </div>

            <div className="cards-container">
                {topics.map((topic) => {
                    const progress = getTopicProgress(topic);
                    const isUnlocked = isTopicUnlocked(); // Now always true
                    const status = progress.isCompleted ? 'completed' : 'unlocked'; // Topics are never 'locked' now

                    return (
                        <TopicCard
                            key={topic._id}
                            topicId={topic._id}
                            moduleId={moduleId}
                            title={topic.title}
                            description={topic.description}
                            image={topic.image}
                            status={status} // Set status to 'completed' or 'unlocked'
                            progress={progress}
                            onClick={() => {
                                // Since all topics are unlocked, the check is not strictly necessary but is good practice.
                                if (isUnlocked) {
                                    navigate(`/quiz/${moduleId}/${topic._id}`);
                                } else {
                                    // This block will never be executed but is kept for logical completeness.
                                    alert('This topic is locked! Complete the previous topic first.');
                                }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}