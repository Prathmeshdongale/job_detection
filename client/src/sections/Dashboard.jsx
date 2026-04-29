import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHistory } from '../store/checksSlice';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const RISK_COLORS = { 'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#10b981' };

const STAT_CONFIGS = [
  { label: 'Total Checks', key: 'total', icon: '📋', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.3)' },
  { label: 'Fake Jobs',    key: 'high',  icon: '🚨', grad: 'linear-gradient(135deg,#ef4444,#f97316)', shadow: 'rgba(239,68,68,0.3)' },
  { label: 'Suspicious',  key: 'med',   icon: '⚠️', grad: 'linear-gradient(135deg,#f59e0b,#f97316)', shadow: 'rgba(245,158,11,0.3)' },
  { label: 'Legitimate',  key: 'low',   icon: '✅', grad: 'linear-gradient(135deg,#10b981,#06b6d4)', shadow: 'rgba(16,185,129,0.3)' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(99,102,241,0.15)', fontSize: 13, color: '#1e293b' }}>
      <p style={{ fontWeight: 700 }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color || '#6366f1' }}>{p.name}: {p.value}{p.name === 'Score' ? '%' : ''}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { history, pagination, status } = useSelector((s) => s.checks);
  useEffect(() => { dispatch(fetchHistory({ page: 1, limit: 20 })); }, [dispatch]);

  const high = history.filter((c) => c.riskLabel === 'High Risk').length;
  const med  = history.filter((c) => c.riskLabel === 'Medium Risk').length;
  const low  = history.filter((c) => c.riskLabel === 'Low Risk').length;
  const vals = { total: pagination.total || 0, high, med, low };

  const pieData = [
    { name: 'Fake', value: high }, { name: 'Suspicious', value: med }, { name: 'Legitimate', value: low },
  ].filter((d) => d.value > 0);

  const barData = history.slice(0, 8).map((c, i) => ({
    name: `#${i + 1}`, Score: Math.round(c.scamProbability * 100),
    fill: RISK_COLORS[c.riskLabel] || '#10b981',
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>📊</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Overview of all your fraud detection results.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {STAT_CONFIGS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: `0 12px 32px ${s.shadow}` }}
            style={{ background: s.grad, borderRadius: 18, padding: '20px 22px', boxShadow: `0 4px 16px ${s.shadow}`, cursor: 'default', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{vals[s.key]}</span>
              </div>
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{vals[s.key]}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: 600 }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: '20px 20px 12px', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🥧 Risk Distribution</p>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Breakdown of all your checks</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={[RISK_COLORS['High Risk'], RISK_COLORS['Medium Risk'], RISK_COLORS['Low Risk']][i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No data yet — run some analyses first</div>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {[['#ef4444','Fake'],['#f59e0b','Suspicious'],['#10b981','Legitimate']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: '20px 20px 12px', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>📊 Recent Scores</p>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Fraud confidence of last 8 checks</p>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Score" radius={[6,6,0,0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No data yet</div>}
        </div>
      </div>

      {/* Recent predictions */}
      <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>🕐 Recent Predictions</p>
        {status === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map((i) => <div key={i} style={{ height: 48, background: '#f1f5f9', borderRadius: 10, animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 14, fontWeight: 600 }}>No predictions yet</p>
            <p style={{ fontSize: 13 }}>Analyse a job posting to see results here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 8).map((check, i) => {
              const color = RISK_COLORS[check.riskLabel] || '#10b981';
              const bg = check.riskLabel === 'High Risk' ? '#fef2f2' : check.riskLabel === 'Medium Risk' ? '#fffbeb' : '#f0fdf4';
              const icon = check.riskLabel === 'High Risk' ? '🚨' : check.riskLabel === 'Medium Risk' ? '⚠️' : '✅';
              return (
                <motion.div key={check._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: bg, borderRadius: 12, border: `1.5px solid ${color}25`, transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <p style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {check.inputText?.slice(0, 70)}…
                  </p>
                  <span style={{ fontSize: 15, fontWeight: 900, color, flexShrink: 0 }}>{Math.round(check.scamProbability * 100)}%</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${color}15`, color, border: `1.5px solid ${color}40`, fontWeight: 700, flexShrink: 0 }}>{check.riskLabel}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
