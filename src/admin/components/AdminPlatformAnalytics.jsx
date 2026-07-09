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
    background: '#fff', border: '1.5px solid #e2e8f0', borderBottom: '4px solid ' + color,
    borderRadius: 14, padding: '18px 22px', flex: 1, minWidth: 150
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{sub}</div>}
  </div>
);

const SECTION = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
      {title}
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
        <Spinner animation="border" style={{ color: '#0f256e' }} />
        <div style={{ fontSize: 13, color: '#64748b' }}>Compiling platform analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: 24, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
        <strong>Error:</strong> {error}
        <br /><span style={{ color: '#64748b' }}>Make sure the backend is restarted with the new routes.</span>
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
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <STAT_CARD label="Total XP Earned" value={(platform?.xpStats?.total || 0).toLocaleString()} sub="Across all users" color="#0f256e" />
        <STAT_CARD label="Avg XP / User"   value={platform?.xpStats?.avg || 0}                     sub="Mean XP score"   color="#3a86ff" />
        <STAT_CARD label="Top XP Score"    value={platform?.xpStats?.max || 0}                     sub="Highest earner"  color="#06d6a0" />
        <STAT_CARD label="Modules"         value={modules?.length || 0}                            sub="In platform"     color="#8338ec" />
        <STAT_CARD label="Departments"     value={depts?.length || 0}                              sub="Active units"    color="#fb5607" />
      </div>

      {/* ── Activity line charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION title="Card Completions — Last 14 Days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Completions" stroke="#0f256e" strokeWidth={2.5} dot={{ r: 3, fill: '#0f256e' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION title="User Registrations — Last 14 Days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Registrations" stroke="#3a86ff" strokeWidth={2.5} dot={{ r: 3, fill: '#3a86ff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </SECTION>
      </div>

      {/* ── XP distribution + Card type donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        <SECTION title="XP Distribution — User Buckets">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={xpData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Users" fill="#0f256e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SECTION>

        <SECTION title="Card Type Completions">
          {cardTypeData.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60, fontSize: 13 }}>No completion data yet.</div>
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
      <SECTION title="Module Engagement — Users Started">
        {topModules.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32, fontSize: 13 }}>No module data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topModules.length * 36)}>
            <BarChart data={topModules} layout="vertical" barSize={18} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <YAxis type="category" dataKey="title" width={160} tick={{ fontSize: 11, fill: '#334155' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usersStarted" name="Users Started" fill="#3a86ff" radius={[0, 6, 6, 0]} />
              <Bar dataKey="totalCompletions" name="Card Completions" fill="#8338ec" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SECTION>

      {/* ── Department comparison table ── */}
      <SECTION title="Department Leaderboard">
        {topDepts.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32, fontSize: 13 }}>No department data yet.</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1.2fr 1fr 1fr', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div>Department</div>
              <div style={{ textAlign: 'center' }}>Users</div>
              <div style={{ textAlign: 'right' }}>Total XP</div>
              <div style={{ textAlign: 'right' }}>Avg XP</div>
              <div style={{ textAlign: 'right' }}>Cards Done</div>
              <div style={{ textAlign: 'right' }}>Topics Done</div>
              <div>Top Earner</div>
            </div>
            {topDepts.map((d, i) => (
              <div key={d.deptId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1.2fr 1fr 1fr', gap: 8, padding: '10px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12.5, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{(d.code || '').toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>{d.userCount}</div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f256e' }}>{d.totalXp.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.avgXp}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.cardsCompleted.toLocaleString()}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{d.topicsCompleted}</div>
                <div>
                  {d.topEarner ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 11.5 }}>{d.topEarner.username}</div>
                      <div style={{ fontSize: 10, color: '#06d6a0', fontWeight: 700 }}>{d.topEarner.xp} XP</div>
                    </div>
                  ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SECTION>
    </div>
  );
}
