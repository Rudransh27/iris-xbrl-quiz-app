// src/admin/components/AdminConsoleLauncher.jsx
import React from 'react';
import {
  Grid, BarChartLine, People, Lightbulb, GraphUp, Shield,
  Collection, CpuFill, FolderPlus, FileEarmarkPlus, Book, Broadcast,
} from 'react-bootstrap-icons';

// One accent color per tile, used only to tint the small icon chip (the
// card itself stays a plain neutral surface — see AdminDashboard.css's
// .admin-launcher-card-icon, which derives the chip background from this
// via color-mix() so it looks right in both light and dark mode without a
// second hardcoded value per tile).
const VIEWS = [
  { key: 'overview', label: 'Curriculum Map', desc: 'Browse and manage every module, topic, and card.', Icon: Grid, accent: '#0f256e' },
  { key: 'metrics-grid', label: 'Metrics Activity Deck', desc: 'A wireframe overview of platform activity at a glance.', Icon: BarChartLine, accent: '#3a86ff' },
  { key: 'create-team', label: 'Team Hub', desc: 'Teams, admins, rosters, and member reassignment requests.', Icon: People, accent: '#06d6a0' },
  { key: 'ideas-review', label: 'Ideas Inbox', desc: 'Review and curate ideas submitted by learners.', Icon: Lightbulb, accent: '#ffbe0b' },
  { key: 'user-analytics', label: 'User Analytics', desc: 'Grading, CSV import/export, and per-user progress.', Icon: GraphUp, accent: '#8338ec' },
  { key: 'progress-dashboard', label: 'Progress Dashboard', desc: 'Track completion across modules and topics.', Icon: BarChartLine, accent: '#fb5607' },
];

const PLATFORM_ANALYTICS_TILE = {
  key: 'platform-analytics', label: 'Platform Analytics', desc: 'Cross-department comparison — superadmin only.', Icon: Shield, accent: '#64748b',
};

const CREATE_ACTIONS = [
  { key: 'add-module', label: '+ Module', desc: 'Create a new Standard or Express curriculum module.', Icon: Collection, accent: '#0f256e' },
  { key: 'add-html-module', label: '+ HTML Sandbox', desc: 'A standalone interactive HTML/CSS/JS module.', Icon: CpuFill, accent: '#3a86ff' },
  { key: 'add-topic', label: '+ Topic Node', desc: 'Add a topic under an existing Standard module.', Icon: FolderPlus, accent: '#06d6a0' },
  { key: 'add-card', label: '+ Card Block', desc: 'Add a knowledge, quiz, code, or video card.', Icon: FileEarmarkPlus, accent: '#ff006e' },
  { key: 'daily-reads', label: '+ Post Read', desc: "Publish today's Daily Read for your department.", Icon: Book, accent: '#ffbe0b' },
  { key: 'broadcast', label: '+ Broadcast', desc: 'Push a News item to a department or globally.', Icon: Broadcast, accent: '#8338ec' },
];

function LauncherCard({ tile, onNavigate }) {
  const { key, label, desc, Icon, accent } = tile;
  return (
    <button
      type="button"
      className="admin-launcher-card"
      style={{ '--card-accent': accent }}
      onClick={() => onNavigate(key)}
    >
      <div className="admin-launcher-card-icon">
        <Icon size={17} />
      </div>
      <div>
        <p className="admin-launcher-card-title">{label}</p>
        <p className="admin-launcher-card-desc">{desc}</p>
      </div>
    </button>
  );
}

export default function AdminConsoleLauncher({ isSuperAdmin, onNavigate }) {
  const views = isSuperAdmin ? [...VIEWS, PLATFORM_ANALYTICS_TILE] : VIEWS;

  return (
    <div>
      <div className="admin-launcher-section-label">Views &amp; Tools</div>
      <div className="admin-launcher-grid">
        {views.map(tile => (
          <LauncherCard key={tile.key} tile={tile} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="admin-launcher-section-label">Create New</div>
      <div className="admin-launcher-grid">
        {CREATE_ACTIONS.map(tile => (
          <LauncherCard key={tile.key} tile={tile} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
