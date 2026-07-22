// src/pages/TopicTrail.jsx
import React, { useState, useEffect, useLayoutEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopicCard from '../components/TopicCard';
import api from '../admin/services/api';
import { ChevronRight, ArrowLeft, Book, Trophy, ClockHistory } from 'react-bootstrap-icons';
import './TopicTrail.css';
import '../components/OrbitDashboard/OrbitDashboard.css';
import { useStars } from '../components/OrbitDashboard/HeroWelcome';
import AuthContext from '../context/AuthContext';
import { setCurrentModule } from '../components/OrbitDashboard/currentModuleStorage';

// "90 min" below an hour, "1.5 hrs" once it crosses 60 — avoids an odd-looking
// "0.5 hours" for anything short, without needing two separate formats.
const formatDuration = (totalMinutes) => {
  if (!totalMinutes) return null;
  if (totalMinutes < 60) return `${totalMinutes} min`;
  return `${(totalMinutes / 60).toFixed(1)} hrs`;
};

export default function TopicTrail() {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const [moduleInfo, setModuleInfo] = useState(null);
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

                setModuleInfo(moduleData || null);
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

    // ── Hero metadata: aggregate across every topic, not just this module's
    // own estimatedTime/pointsReward — those are what actually get awarded
    // per-topic, so summing them is what "Potential: +X XP" should mean.
    const { totalTopicsCount, completedTopicsCount, totalDurationMinutes, totalPotentialXp, masterProgressPct } = useMemo(() => {
        const total = topics.length;
        let completed = 0;
        let minutes = 0;
        let xp = 0;

        topics.forEach((topic) => {
            if (getTopicProgress(topic).isCompleted) completed += 1;
            minutes += Number(topic.estimatedTime) || 0;
            xp += Number(topic.pointsReward) || 0;
        });

        return {
            totalTopicsCount: total,
            completedTopicsCount: completed,
            totalDurationMinutes: minutes,
            totalPotentialXp: xp,
            masterProgressPct: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topics, userProgress]);

    const durationLabel = formatDuration(totalDurationMinutes);
    const stars = useStars(24);

    return (
        <div className="topic-trail-page">
            <div className="duo-topic-container">

                {/* Sits above the hero banner (not inside it) — a plain page-level
                    back action, distinct from the breadcrumb's fixed "Modules"
                    destination below.
                    🎯 BUG FIX ("Back to Learn doesn't always go to Learn"):
                    this used navigate(-1) — raw browser-history back — so it
                    could land anywhere depending on how the learner arrived
                    at this topic (a module card, a search result, a deep
                    link). A button labeled "Back to Learn" must always go to
                    the real Learn page, not wherever history happens to be. */}
                <button
                    type="button"
                    className="topic-back-btn"
                    onClick={() => navigate("/orbit/modules")}
                >
                    <ArrowLeft size={14} /> Back to Learn
                </button>

                {/* ================= HERO HEADER =================
                    Same galaxy-gradient/starfield/comet shell as the Home and
                    Learn hero banners, sized down for a sub-page: breadcrumb,
                    module title, meta row, and the master progress line. */}
                <div className="orbit-hero orbit-hero--topic">
                    <div className="orbit-hero__stars" aria-hidden="true">
                        {stars.map((s) => (
                            <span
                                key={s.id}
                                className="orbit-hero__star"
                                style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration }}
                            />
                        ))}
                    </div>
                    <div className="orbit-hero__comet" aria-hidden="true" />

                    <div className="topic-header">
                        <nav className="topic-header__breadcrumb" aria-label="Breadcrumb">
                            <button type="button" onClick={() => navigate('/orbit/modules')}>Learn</button>
                            <ChevronRight size={10} />
                            <button type="button" onClick={() => navigate('/orbit/modules')}>Modules</button>
                            <ChevronRight size={10} />
                            <span className="topic-header__breadcrumb-current">{moduleInfo?.title || '…'}</span>
                        </nav>

                        <h1 className="topic-header__title">{moduleInfo?.title || 'Your Learning Topics'}</h1>

                        <div className="topic-header__meta-row">
                            <span className="topic-header__meta-item">
                                <Book size={13} /> {totalTopicsCount} {totalTopicsCount === 1 ? 'topic' : 'topics'}
                            </span>
                            {durationLabel && (
                                <span className="topic-header__meta-item">
                                    <ClockHistory size={13} /> {durationLabel}
                                </span>
                            )}
                            {totalPotentialXp > 0 && (
                                <span className="topic-header__meta-item topic-header__meta-item--xp">
                                    <Trophy size={13} /> +{totalPotentialXp} Lightyear
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ================= RAZOR-THIN MASTER PROGRESS LINE ================= */}
                    {totalTopicsCount > 0 && (
                        <div className="topic-progress-line-wrap">
                            <div className="topic-progress-line-labels">
                                <span>{completedTopicsCount}/{totalTopicsCount} completed</span>
                                <span>{masterProgressPct}%</span>
                            </div>
                            <div className={`topic-progress-line ${masterProgressPct >= 100 ? 'topic-progress-line--mastered' : ''}`}>
                                <div
                                    className="topic-progress-line__fill"
                                    style={{ width: `${Math.max(masterProgressPct > 0 ? 2 : 0, masterProgressPct)}%` }}
                                />
                            </div>
                        </div>
                    )}
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
                                            cards={topic.cards}
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
