// src/admin/components/AdminConsoleLauncher.jsx
import React from 'react';
import {
  Grid, BarChartLine, People, Lightbulb, GraphUp, Shield,
  Collection, CpuFill, FolderPlus, FileEarmarkPlus, Book, Broadcast, TagFill,
  GlobeAmericas, ClipboardCheck, SignpostSplit, QuestionCircle, PersonLinesFill, ShieldLock,
} from 'react-bootstrap-icons';

// One accent color per tile, used only to tint the small icon chip (the
// card itself stays a plain neutral surface — see AdminDashboard.css's
// .admin-launcher-card-icon, which derives the chip background from this
// via color-mix() so it looks right in both light and dark mode without a
// second hardcoded value per tile).
const VIEWS = [
  { key: 'overview', label: 'Curriculum Map', desc: 'Browse and manage every module, topic, and card.', Icon: Grid, accent: 'var(--cat-violet)' },
  { key: 'learning-paths', label: 'Learning Paths', desc: 'Build paths step by step: modules, who sees them, Pre/Post check, publish.', Icon: SignpostSplit, accent: 'var(--cat-sky)' },
  { key: 'question-bank', label: 'Question Bank', desc: 'Pre/Post questions per module — write them or import from Excel.', Icon: QuestionCircle, accent: 'var(--cat-teal)' },
  { key: 'tags', label: 'Tags', desc: 'The categories that group paths on the Learn page.', Icon: TagFill, accent: 'var(--cat-rose)' },
  { key: 'regions', label: 'Regions', desc: 'Create regions and set which region(s) each learner belongs to.', Icon: GlobeAmericas, accent: 'var(--cat-green)' },
  { key: 'metrics-grid', label: 'Metrics Activity Deck', desc: 'A wireframe overview of platform activity at a glance.', Icon: BarChartLine, accent: 'var(--cat-sky)' },
  { key: 'create-team', label: 'Team Hub', desc: 'Teams, admins, rosters, and member reassignment requests.', Icon: People, accent: 'var(--cat-teal)' },
  { key: 'ideas-review', label: 'Ideas Inbox', desc: 'Review and curate ideas submitted by learners.', Icon: Lightbulb, accent: 'var(--cat-amber)' },
  { key: 'learner-report', label: 'Learner Report', desc: 'One learner at a glance: Pre/Post, in-module results question by question, progress and time.', Icon: PersonLinesFill, accent: 'var(--cat-sky)' },
  { key: 'user-analytics', label: 'User Analytics', desc: 'Grading, CSV import/export, and per-user progress.', Icon: GraphUp, accent: 'var(--cat-violet)' },
  { key: 'progress-dashboard', label: 'Progress Dashboard', desc: 'Track completion across modules and topics.', Icon: BarChartLine, accent: 'var(--cat-amber)' },
  { key: 'auth-activity', label: 'Sign-in Activity', desc: 'Who signed in and how (Microsoft SSO or password), failed attempts, sessions.', Icon: ShieldLock, accent: 'var(--cat-rose)' },
  { key: 'prepost-report', label: 'Pre/Post Report', desc: 'How much learners improved on each path, from Pre-check to Post-check.', Icon: ClipboardCheck, accent: 'var(--cat-green)' },
];

const PLATFORM_ANALYTICS_TILE = {
  key: 'platform-analytics', label: 'Platform Analytics', desc: 'Cross-department comparison — superadmin only.', Icon: Shield, accent: 'var(--ui-text-3)',
};

const CREATE_ACTIONS = [
  { key: 'add-module', label: '+ Module', desc: 'Create a new Standard or Express curriculum module.', Icon: Collection, accent: 'var(--cat-violet)' },
  { key: 'add-html-module', label: '+ HTML Sandbox', desc: 'A standalone interactive HTML/CSS/JS module.', Icon: CpuFill, accent: 'var(--cat-sky)' },
  { key: 'add-topic', label: '+ Topic Node', desc: 'Add a topic under an existing Standard module.', Icon: FolderPlus, accent: 'var(--cat-teal)' },
  { key: 'add-card', label: '+ Card Block', desc: 'Add a knowledge, quiz, code, or video card.', Icon: FileEarmarkPlus, accent: 'var(--cat-rose)' },
  { key: 'daily-reads', label: '+ Post Read', desc: "Publish today's Daily Read for your department.", Icon: Book, accent: 'var(--cat-amber)' },
  { key: 'broadcast', label: '+ Broadcast', desc: 'Push a News item to a department or globally.', Icon: Broadcast, accent: 'var(--cat-violet)' },
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
