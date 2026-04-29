import { useMemo } from 'react';
import { motion } from 'framer-motion';

const SIGNALS = [
  { pattern: /work from home/i, weight: 2, label: 'Work from home' },
  { pattern: /no experience (needed|required)/i, weight: 2, label: 'No experience needed' },
  { pattern: /guaranteed (income|salary|earnings)/i, weight: 3, label: 'Guaranteed income' },
  { pattern: /registration fee|pay.*fee/i, weight: 4, label: 'Fee required' },
  { pattern: /easy money|get rich/i, weight: 3, label: 'Easy money' },
  { pattern: /urgent.*hiring|immediate.*hiring/i, weight: 2, label: 'Urgent hiring' },
  { pattern: /whatsapp/i, weight: 3, label: 'WhatsApp contact' },
  { pattern: /mlm|network marketing/i, weight: 3, label: 'MLM/Network marketing' },
  { pattern: /passive income/i, weight: 2, label: 'Passive income' },
  { pattern: /uncapped (earnings|commission)/i, weight: 2, label: 'Uncapped earnings' },
  { pattern: /no interview/i, weight: 3, label: 'No interview' },
  { pattern: /recruit (others|friends)/i, weight: 3, label: 'Recruit others' },
  { pattern: /\$\d{3,}.*\/(hour|hr|day)/i, weight: 2, label: 'Unrealistic pay' },
];

function computeLiveScore(text) {
  if (!text || text.length < 20) return { score: 0, signals: [] };
  let totalWeight = 0;
  const found = [];
  for (const s of SIGNALS) {
    if (s.pattern.test(text)) { totalWeight += s.weight; found.push(s.label); }
  }
  const maxWeight = SIGNALS.reduce((a, s) => a + s.weight, 0);
  return { score: Math.min(95, Math.round((totalWeight / maxWeight) * 100)), signals: found };
}

export default function LiveFraudMeter({ text }) {
  const { score, signals } = useMemo(() => computeLiveScore(text), [text]);
  if (!text || text.length < 20) return null;

  const isHigh = score >= 60;
  const isMed  = score >= 30;
  const color  = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
  const bg     = isHigh ? '#fef2f2' : isMed ? '#fffbeb' : '#f0fdf4';
  const border = isHigh ? '#fca5a5' : isMed ? '#fcd34d' : '#6ee7b7';
  const label  = isHigh ? '🚨 High Risk' : isMed ? '⚠️ Suspicious' : '✅ Looks OK';
  const grad   = isHigh ? 'linear-gradient(90deg,#ef4444,#f97316)' : isMed ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#10b981,#06b6d4)';

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '14px 16px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚡ Live Preview</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 900, color }}>{score}% — {label}</span>
      </div>
      <div style={{ height: 8, background: `${color}20`, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div animate={{ width: `${score}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ height: '100%', background: grad, borderRadius: 99 }} />
      </div>
      {signals.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {signals.map((s) => (
            <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: `${color}15`, color, border: `1.5px solid ${color}40`, fontWeight: 700 }}>{s}</span>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>⚡ Live preview — click Analyze for full AI result</p>
    </motion.div>
  );
}
