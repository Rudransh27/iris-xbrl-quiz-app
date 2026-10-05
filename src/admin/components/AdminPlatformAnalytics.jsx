// src/admin/components/AdminPlatformAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useThemeTokens } from '../../components/ui';

// Card-type -> theme token key (resolved at render via useThemeTokens).
const CARD_TYPE_COLORS = {
  quiz: 'cat-sky',
  knowledge: 'cat-violet',
  code: 'cat-teal',
  video: 'cat-rose',
  pdf: 'cat-amber',
  ppt: 'cat-green',
  html_sandbox: 'ui-accent',
  unknown: 'ui-text-3',
};
const BUCKET_KEYS = ['cat-violet', 'cat-sky', 'cat-teal', 'cat-amber', 'cat-rose', 'cat-green'];

const STAT_CARD = ({ label, value, sub, color = 'var(--ui-accent)' }) => (
  <div style={{
    background: 'var(--orbit-surface)', border: '1px solid var(--orbit-border)', borderBottom: '3px solid ' + color,
    padding: '18px 22px', flex: 1, minWidth: 150
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orbit-text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--orbit-text-heading)' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--orbit-text-muted)', marginTop: 3 }}>{sub}</div>}
  </div>
);

const SECTION = ({ title, description, accent = 'var(--ui-accent)', children }) => (
  <div style={{ background: 'var(--orbit-surface)', border: '1px solid var(--orbit-border)', borderTop: `3px solid ${accent}`, padding: '22px 24px', marginBottom: 20 }}>
    <div style={{ marginBottom: 18, borderBottom: '1px solid var(--orbit-border)', paddingBottom: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--orbit-text-heading)' }}>{title}</div>
      {description && <div style={{ fontSize: 11.5, color: 'var(--orbit-text-muted)', marginTop: 4 }}>{description}</div>}
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', boxShadow: 'var(--ui-shadow-md)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--ui-text)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--ui-text)' }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

export default function AdminPlatformAnalytics() {
  const [platform, setPlatform] = useState(null);
  const [modules, setModules]   = useState(null);
  const [depts, setDepts]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const tk = useThemeTokens();

  useEffect(() => {
    Promise.all([
      api.getAdminPlatformStats(),
      api.getAdminModuleEngagement(),
      api.getAdminDepartmentStats(),
    ])
      .then(([p, m, d]) => {
        if (p?.success) setPlatform(p);
        if (m?.success) setModules(m.modules);
        if (d?.success) setDepts(d.departments);
      })
      .catch(e => setError(e?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <Spinner animation="border" style={{ color: 'var(--orbit-brand)' }} />
        <div style={{ fontSize: 13, color: 'var(--orbit-text-muted)' }}>Compiling platform analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: 24, padding: 16, background: 'var(--ui-danger-soft)', border: '1px solid color-mix(in srgb, var(--ui-danger) 30%, var(--ui-surface))', borderRadius: 10, color: 'var(--ui-danger-text)', fontSize: 13 }}>
        <strong>Error:</strong> {error}
        <br /><span style={{ color: 'var(--orbit-text-muted)' }}>Make sure the backend is restarted with the new routes.</span>
      </div>
    );
  }

  // Fill in missing dates for the last 14 days so charts have no gaps
  const fillDays = (dataArr) => {
    const map = {};
    (dataArr || []).forEach(d => { map[d.date] = d.count; });
    const result = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key.slice(5), count: map[key] || 0 });
    }
    return result;
  };

  const activityData = fillDays(platform?.cardActivity);
  const growthData   = fillDays(platform?.userGrowth);

  const cardTypeData = (platform?.cardTypeBreakdown || []).map(d => ({
    name: d.type.replace('_', ' '),
    value: d.count,
    fill: tk[CARD_TYPE_COLORS[d.type] || 'ui-text-3']
  }));

  const xpData = platform?.xpDistribution || [];

  const topModules = (modules || []).slice(0, 8);
  const topDepts   = depts || [];

  return (
    <div style={{ padding: '24px 28px', background: 'var(--orbit-canvas)', minHeight: '100vh' }}>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <STAT_CARD label="Total Lightyears Earned" value={(platform?.xpStats?.total || 0).toLocaleString()} sub="Across all users" color="var(--ui-accent)" />
        <STAT_CARD label="Avg Lightyears / User"   value={platform?.xpStats?.avg || 0}                     sub="Mean Lightyears score"   color="var(--cat-sky)" />
        <STAT_CARD label="Top Lightyears Score"    value={platform?.xpStats?.max || 0}                     sub="Highest earner"  color="var(--cat-teal)" />
        <STAT_CARD label="Modules"         value={modules?.length || 0}                            sub="In platform"     color="var(--cat-violet)" />
        <STAT_CARD label="Departments"     value={depts?.length || 0}                              sub="Active units"    color="var(--cat-amber)" />
      </div>

      {/* ── Activity line charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION
          title="Card Completions — Last 14 Days"
          description="How many content cards were completed platform-wide each day, over the last two weeks."
          accent="var(--cat-teal)"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={tk['ui-border']} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tk['ui-text-3'] }} />
              <YAxis tick={{ fontSize: 11, fill: tk['ui-text-3'] }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Completions" stroke={tk['cat-teal']} strokeWidth={2.5} dot={{ r: 3, fill: tk['cat-teal'] }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION
          title="User Registrations — Last 14 Days"
          description="New verified sign-ups per day, over the last two weeks."
          accent="var(--cat-rose)"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={tk['ui-border']} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tk['ui-text-3'] }} />
              <YAxis tick={{ fontSize: 11, fill: tk['ui-text-3'] }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Registrations" stroke={tk['cat-rose']} strokeWidth={2.5} dot={{ r: 3, fill: tk['cat-rose'] }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>
      </div>

      {/* ── Lightyears distribution + Card type donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION
          title="Lightyears Distribution — User Buckets"
          description="How many users fall into each XP bracket — shows whether engagement is broad or concentrated at the top."
          accent="var(--cat-violet)"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={xpData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={tk['ui-border']} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: tk['ui-text-3'] }} />
              <YAxis tick={{ fontSize: 11, fill: tk['ui-text-3'] }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                {xpData.map((_, i) => (
                  <Cell key={i} fill={tk[BUCKET_KEYS[i % 6]]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION
          title="Card Type Completions"
          description="Which content formats (quiz, video, code, etc.) get completed most."
          accent="var(--cat-amber)"
        >
          {cardTypeData.length === 0 ? (
            <div style={{ color: 'var(--orbit-text-muted)', textAlign: 'center', paddingTop: 60, fontSize: 13 }}>No completion data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cardTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                  {cardTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8, background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', color: 'var(--ui-text)' }} itemStyle={{ color: 'var(--ui-text)' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SECTION>
      </div>

      {/* ── Module engagement horizontal bar ── */}
      <SECTION
        title="Module Engagement — Users Started"
        description="Users started vs. cards completed per module — spot modules with high drop-off."
        accent="var(--cat-amber)"
      >
        {topModules.length === 0 ? (
          <div style={{ color: 'var(--orbit-text-muted)', textAlign: 'center', padding: 32, fontSize: 13 }}>No module data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topModules.length * 36)}>
            <BarChart data={topModules} layout="vertical" barSize={18} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tk['ui-border']} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: tk['ui-text-3'] }} allowDecimals={false} />
              <YAxis type="category" dataKey="title" width={160} tick={{ fontSize: 11, fill: tk['ui-text'] }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usersStarted" name="Users Started" fill={tk['cat-amber']} radius={[0, 6, 6, 0]} />
              <Bar dataKey="totalCompletions" name="Card Completions" fill={tk['cat-teal']} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SECTION>

      {/* ── Department comparison table ── */}
      <SECTION
        title="Department Leaderboard"
        description="Every department's total/avg XP and completion counts side-by-side, with each department's top earner."
        accent="var(--ui-accent)"
      >
        {topDepts.length === 0 ? (
          <div style={{ color: 'var(--orbit-text-muted)', textAlign: 'center', padding: 32, fontSize: 13 }}>No department data yet.</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1.2fr 1fr 1fr', gap: 8, padding: '6px 10px', background: 'var(--orbit-surface-subtle)', borderRadius: 8, marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--orbit-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div>Department</div>
              <div style={{ textAlign: 'center' }}>Users</div>
              <div style={{ textAlign: 'right' }}>Total Lightyears</div>
              <div style={{ textAlign: 'right' }}>Avg Lightyears</div>
              <div style={{ textAlign: 'right' }}>Cards Done</div>
              <div style={{ textAlign: 'right' }}>Topics Done</div>
              <div>Top Earner</div>
            </div>
            {topDepts.map((d, i) => (
              <div key={d.deptId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1.2fr 1fr 1fr', gap: 8, padding: '10px 10px', borderBottom: '1px solid var(--orbit-border)', fontSize: 12.5, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ui-text)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--orbit-text-muted)', fontFamily: 'monospace' }}>{(d.code || '').toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--orbit-text-body)' }}>{d.userCount}</div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--ui-accent-text)' }}>{d.totalXp.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: 'var(--ui-text-2)' }}>{d.avgXp}</div>
                <div style={{ textAlign: 'right', color: 'var(--ui-text-2)' }}>{d.cardsCompleted.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: 'var(--ui-text-2)' }}>{d.topicsCompleted}</div>
                <div>
                  {d.topEarner ? (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ui-text)', fontSize: 11.5 }}>{d.topEarner.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--cat-teal-text)', fontWeight: 700 }}>{d.topEarner.xp} Lightyears</div>
                    </div>
                  ) : <span style={{ color: 'var(--orbit-text-muted)', fontSize: 11 }}>—</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SECTION>
    </div>
  );
}
