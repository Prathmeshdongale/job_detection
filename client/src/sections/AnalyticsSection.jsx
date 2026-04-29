import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/checksSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

const RISK_COLORS = { 'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(99,102,241,0.15)', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color || '#6366f1' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

export default function AnalyticsSection() {
  const dispatch = useDispatch();
  const { analytics, analyticsStatus } = useSelector((s) => s.checks);
  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  if (analyticsStatus === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map((i) => <div key={i} style={{ height: 220, background: '#f1f5f9', borderRadius: 18, animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
      </div>
    );
  }
  if (!analytics) return null;

  const { riskDist, dailyTrend, topPhrases, totalCount } = analytics;
  const pieData = riskDist.map((r) => ({ name: r._id, value: r.count }));
  const trendData = dailyTrend.map((d) => ({ date: d._id.slice(5), Checks: d.count, 'Avg Score': Math.round(d.avgScore * 100) }));
  const phraseData = topPhrases.map((p) => ({ phrase: p._id.slice(0, 22), count: p.count }));

  const cardStyle = { background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.1)' };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#ec4899,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(236,72,153,0.35)' }}>📈</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Analytics</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Trends and insights from your <strong style={{ color: '#6366f1' }}>{totalCount}</strong> total checks.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🥧 Risk Distribution</p>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>All-time breakdown</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={4} dataKey="value">
                  {pieData.map((entry) => <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#6366f1'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 70 }}>No data yet</p>}
        </div>

        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🚩 Top Flagged Phrases</p>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Most common fraud signals</p>
          {phraseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={phraseData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="phrase" tick={{ fill: '#374151', fontSize: 10, fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0,6,6,0]}>
                  {phraseData.map((_, i) => <Cell key={i} fill={['#f59e0b','#ef4444','#8b5cf6','#06b6d4','#10b981','#ec4899','#f97316','#6366f1','#84cc16','#14b8a6'][i % 10]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 70 }}>No phrases flagged yet</p>}
        </div>
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>📅 Daily Activity — Last 30 Days</p>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Checks per day and average fraud score</p>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{v}</span>} />
              <Line yAxisId="left" type="monotone" dataKey="Checks" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="Avg Score" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingTop: 70 }}>No activity in the last 30 days</p>}
      </div>
    </motion.div>
  );
}
