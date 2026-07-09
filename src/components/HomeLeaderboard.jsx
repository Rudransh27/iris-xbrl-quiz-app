// src/components/HomeLeaderboard.jsx
import React from 'react';
import './HomeLeaderboard.css'; // Add separate file or merge into your layout styles
import { TrophyFill, LightningFill, StarFill } from 'react-bootstrap-icons';

const leaderboardTeams = [
  { rank: 1, name: 'iDEAL Data Pipeline Crew', xp: 2450, color: 'var(--amber-gold)' },
  { rank: 2, name: 'iFile Validation Squad', xp: 2120, color: '#c0c0c0' },
  { rank: 3, name: 'Carbon Auditing Specialists', xp: 1890, color: '#cd7f32' },
  { rank: 4, name: 'IT Infrastructure Ops', xp: 1420, color: 'transparent' }
];

export default function HomeLeaderboard() {
  return (
    <section className="duo-leaderboard-section">
      <div className="duo-leaderboard-wrapper">
        
        <div className="leaderboard-header text-center">
          <div className="badge-wrapper"><TrophyFill size={16} /> LEAGUE BRACKET</div>
          <h2 className="leaderboard-title">Active Department Standings</h2>
          <p className="leaderboard-subtitle">See which specialized engineering circles are commanding the board this week.</p>
        </div>

        <div className="leaderboard-board-box">
          {leaderboardTeams.map((team) => (
            <div key={team.rank} className="leaderboard-row-item">
              <div className="row-left-group">
                <span className="rank-number font-monospace" style={{ backgroundColor: team.color }}>
                  {team.rank}
                </span>
                <span className="team-display-name">{team.name}</span>
              </div>
              <div className="row-right-group">
                <LightningFill className="xp-bolt-icon" />
                <span className="xp-score-text font-monospace">{team.xp}</span>
                <span className="xp-label">XP</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}