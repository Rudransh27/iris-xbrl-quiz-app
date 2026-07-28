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

const CARD_TYPE_COLORS = {
  quiz: '#3a86ff',
  knowledge: '#8338ec',
  code: '#06d6a0',
  video: '#ff006e',
  pdf: '#fb5607',
  ppt: '#ffbe0b',
  html_sandbox: '#0f256e',
  unknown: '#94a3b8',
};

const STAT_CARD = ({ label, value, sub, color = '#0f256e' }) => (
  <div style={{
    background: 'var(--orbit-surface)', border: '1px solid var(--orbit-border)', borderBottom: '3px solid ' + color,
    padding: '18px 22px', flex: 1, minWidth: 150
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orbit-text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--orbit-text-heading)' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--orbit-text-muted)', marginTop: 3 }}>{sub}</div>}
  </div>
);

const SECTION = ({ title, description, accent = '#0f256e', children }) => (
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
    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff' }}>{p.name}: <strong>{p.value}</strong></div>
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
      <div style={{ margin: 24, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
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
    fill: CARD_TYPE_COLORS[d.type] || '#94a3b8'
  }));

  const xpData = platform?.xpDistribution || [];

  const topModules = (modules || []).slice(0, 8);
  const topDepts   = depts || [];

  return (
    <div style={{ padding: '24px 28px', background: 'var(--orbit-canvas)', minHeight: '100vh' }}>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <STAT_CARD label="Total Lightyears Earned" value={(platform?.xpStats?.total || 0).toLocaleString()} sub="Across all users" color="#0f256e" />
        <STAT_CARD label="Avg Lightyears / User"   value={platform?.xpStats?.avg || 0}                     sub="Mean Lightyears score"   color="#3a86ff" />
        <STAT_CARD label="Top Lightyears Score"    value={platform?.xpStats?.max || 0}                     sub="Highest earner"  color="#06d6a0" />
        <STAT_CARD label="Modules"         value={modules?.length || 0}                            sub="In platform"     color="#8338ec" />
        <STAT_CARD label="Departments"     value={depts?.length || 0}                              sub="Active units"    color="#fb5607" />
      </div>

      {/* ── Activity line charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION
          title="Card Completions — Last 14 Days"
          description="How many content cards were completed platform-wide each day, over the last two weeks."
          accent="#06d6a0"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--orbit-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Completions" stroke="#06d6a0" strokeWidth={2.5} dot={{ r: 3, fill: '#06d6a0' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION
          title="User Registrations — Last 14 Days"
          description="New verified sign-ups per day, over the last two weeks."
          accent="#ff006e"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--orbit-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Registrations" stroke="#ff006e" strokeWidth={2.5} dot={{ r: 3, fill: '#ff006e' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>
      </div>

      {/* ── Lightyears distribution + Card type donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION
          title="Lightyears Distribution — User Buckets"
          description="How many users fall into each XP bracket — shows whether engagement is broad or concentrated at the top."
          accent="#8338ec"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={xpData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--orbit-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                {xpData.map((_, i) => (
                  <Cell key={i} fill={['#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607', '#ff006e'][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION
          title="Card Type Completions"
          description="Which content formats (quiz, video, code, etc.) get completed most."
          accent="#ffbe0b"
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
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
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
        accent="#fb5607"
      >
        {topModules.length === 0 ? (
          <div style={{ color: 'var(--orbit-text-muted)', textAlign: 'center', padding: 32, fontSize: 13 }}>No module data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topModules.length * 36)}>
            <BarChart data={topModules} layout="vertical" barSize={18} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--orbit-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--orbit-text-muted)' }} allowDecimals={false} />
              <YAxis type="category" dataKey="title" width={160} tick={{ fontSize: 11, fill: 'var(--orbit-text-heading)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usersStarted" name="Users Started" fill="#fb5607" radius={[0, 6, 6, 0]} />
              <Bar dataKey="totalCompletions" name="Card Completions" fill="#06d6a0" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SECTION>

      {/* ── Department comparison table ── */}
      <SECTION
        title="Department Leaderboard"
        description="Every department's total/avg XP and completion counts side-by-side, with each department's top earner."
        accent="#0f256e"
      >
        {topDepts.length === 0 ? (
          <div style={{ color: 'var(--orbit-text-muted)', textAlign: 'center', padding: 32, fontSize: 13 }}>No department data yet.</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1.2fr 1fr 1fr', gap: 8, padding: '6px 10px', background: 'var(--orbit-surface-subtle)', borderRadius: 8, marginBottom: 6, fontSize: 10.5, fontWeight: 700, color: 'var(--orbit-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--orbit-text-muted)', fontFamily: 'monospace' }}>{(d.code || '').toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--orbit-text-body)' }}>{d.userCount}</div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f256e' }}>{d.totalXp.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.avgXp}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.cardsCompleted.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.topicsCompleted}</div>
                <div>
                  {d.topEarner ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11.5 }}>{d.topEarner.username}</div>
                      <div style={{ fontSize: 10, color: '#06d6a0', fontWeight: 700 }}>{d.topEarner.xp} Lightyears</div>
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
