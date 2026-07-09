// src/components/CoursesHeroSection.jsx
import React from 'react';
import { Link } from 'react-router-dom'; 
import './CoursesHeroSection.css';
// 🔑 Added ArrowRightShort directly into your components import destructured token list
import { LightningChargeFill, ShieldCheck, MortarboardFill, AwardFill, ArrowRightShort } from 'react-bootstrap-icons';

const teamUpskillBenefits = [
  {
    id: 'ifile-team',
    badge: 'REGULATORY EXPERTISE',
    teamName: 'iFile & Compliance Team',
    emoji: '📈',
    problem: 'Constantly chasing shifting regulatory tax frameworks and standard updates.',
    solution: 'Gamified interactive sandboxes turn dry compliance sheets into bite-sized validation challenges, helping employees master reporting structures faster.',
    color: 'var(--azure-blue)',
    shadowColor: '#1a62d6'
  },
  {
    id: 'ideal-datatech',
    badge: 'PIPELINE VELOCITY',
    teamName: 'iDEAL & DataTech Team',
    emoji: '⚡',
    problem: 'Siloed data formats and human validation errors delaying staging runs.',
    solution: 'Interactive simulation levels guide engineers through dirty data parsing, validation rulesets, and ingestion mechanics with immediate, tactile feedback.',
    color: 'var(--neon-pink)',
    shadowColor: '#b3004b'
  },
  {
    id: 'carbon-specialists',
    badge: 'SUSTAINABILITY TRACK',
    teamName: 'Carbon Specialization Team',
    emoji: '🌱',
    problem: 'Onboarding employees onto environmental compliance rules can take weeks.',
    solution: 'Daily streak mechanics and micro-learning units shorten training times on emissions calculations and reporting templates.',
    color: 'var(--amber-gold)',
    shadowColor: '#e0a300'
  },
  {
    id: 'it-hr-operations',
    badge: 'ONBOARDING ACCELERATION',
    teamName: 'IT & HR Operations',
    emoji: '🤝',
    problem: 'Low completion rates for mandatory corporate security training modules.',
    solution: 'Leaderboards and competitive league brackets turn mandatory training into an engaging game, increasing user retention and keeping your workforce certified.',
    color: 'var(--blue-violet)',
    shadowColor: '#651ccc'
  }
];

export default function CoursesHeroSection() {
  return (
    <section className="orbit-home-benefit-section">
      <div className="orbit-home-wrapper">
        
        {/* ================= HERO TEXT INTRO BLOCK ================= */}
        <div className="orbit-home-header">
          <div className="duo-spark-badge">
            <LightningChargeFill size={14} /> GAMIFIED WORKFORCE UPSKILLING
          </div>
          <h2 className="orbit-home-title">
            Empower Your Teams to <br />
            <span className="title-accent">Master Compliance Together</span>
          </h2>
          <p className="orbit-home-subtitle">
            See how IRIS Orbit turns specialized product technical domains into engaging daily challenges for your operations groups.
          </p>
        </div>

        {/* ================= TEAM BENEFIT GRID LAYOUT ================= */}
        <div className="orbit-benefits-grid">
          {teamUpskillBenefits.map((item) => (
            <div 
              key={item.id} 
              className="duo-benefit-card" 
              style={{ '--hover-accent': item.color, '--hover-shadow': item.shadowColor }}
            >
              <div className="duo-card-top">
                <span className="duo-card-badge">{item.badge}</span>
                <span className="duo-card-character-emoji">{item.emoji}</span>
              </div>

              <h3 className="duo-card-team-title">{item.teamName}</h3>
              
              <div className="duo-card-divider"></div>

              <div className="duo-card-body">
                <div className="body-block">
                  <span className="block-label label-red">THE CHALLENGE</span>
                  <p className="block-text">{item.problem}</p>
                </div>
                
                <div className="body-block">
                  <span className="block-label label-green">HOW ORBIT HELPS</span>
                  <p className="block-text text-highlight">{item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= VALUE FOOTER CALL-OUT INFO STRIP ================= */}
        <div className="orbit-home-value-strip">
          <div className="value-strip-item">
            <MortarboardFill className="strip-icon text-azure" />
            <div className="strip-text-group">
              <h5>Bite-Sized Lessons</h5>
              <p>Lessons take under 5 minutes, fitting perfectly into regular work sprints.</p>
            </div>
          </div>

          <div className="value-strip-item">
            <ShieldCheck className="strip-icon text-pink" />
            <div className="strip-text-group">
              <h5>Verifiable Mastery</h5>
              <p>Real-time knowledge checkpoints protect data from human errors.</p>
            </div>
          </div>

          <div className="value-strip-item">
            <AwardFill className="strip-icon text-gold" />
            <div className="strip-text-group">
              <h5>Competitive Leagues</h5>
              <p>Team leaderboard competitions drive consistent platform adoption.</p>
            </div>
          </div>
        </div>

        {/* Bottom Core CTA Alignment Row */}
        <div className="orbit-home-actions-row">
          <Link to="/modules" className="orbit-cta-primary-btn">
            EXPLORE MODULES <ArrowRightShort size={20} />
          </Link>
        </div>

      </div>
    </section>
  );
}