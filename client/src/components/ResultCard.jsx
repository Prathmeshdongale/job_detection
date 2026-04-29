import { useState } from 'react';
import { motion } from 'framer-motion';
import PhraseTooltip from './PhraseTooltip';
import ShareModal from './ShareModal';

const RISK = {
  'High Risk':   { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '🚨', label: 'FAKE JOB',    grad: 'linear-gradient(135deg,#ef4444,#f97316)' },
  'Medium Risk': { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', label: 'SUSPICIOUS',  grad: 'linear-gradient(135deg,#f59e0b,#f97316)' },
  'Low Risk':    { color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', icon: '✅', label: 'LEGITIMATE',  grad: 'linear-gradient(135deg,#10b981,#06b6d4)' },
};

export default function ResultCard({ result }) {
  const [showShare, setShowShare] = useState(false);
  if (!result) return null;

  const r = RISK[result.riskLabel] || RISK['Low Risk'];
  const pct = Math.round((result.scam_probability ?? result.scamProbability) * 100);
  const phrases = result.suspicious_phrases || result.suspiciousPhrases || [];

  const TIPS = {
    'High Risk':   ['Do not apply or share personal info', 'Report the listing to the job board', 'Share this result to warn others', 'Search company name + "scam"'],
    'Medium Risk': ['Research the company on LinkedIn', 'Verify on the company\'s official site', 'Never pay any fees before starting', 'Trust your instincts — if off, skip it'],
    'Low Risk':    ['Looks legitimate — proceed with care', 'Still verify through official channels', 'Never share financial details early'],
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ marginTop: 20, borderRadius: 20, overflow: 'hidden', boxShadow: `0 8px 32px ${r.color}25`, border: `1.5px solid ${r.border}` }}>

        {/* Gradient header */}
        <div style={{ background: r.grad, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {r.icon}
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>{r.label}</p>
            {result.jobTitle && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>📌 {result.jobTitle}</p>}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Fraud probability detected</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{pct}%</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>confidence</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: '#ffffff', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderTop: `3px solid ${r.color}` }}>
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fraud Score</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{pct >= 70 ? 'High danger' : pct >= 30 ? 'Moderate risk' : 'Low risk'}</span>
            </div>
            <div style={{ height: 10, background: `${r.color}20`, borderRadius: 99, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: r.grad, borderRadius: 99 }} />
            </div>
          </div>

          {/* AI Explanation */}
          {result.aiExplanation && (
            <div style={{ background: '#eef2ff', border: '2px solid #c7d2fe', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                🤖 AI Explanation
              </p>
              <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7 }}>{result.aiExplanation}</p>
            </div>
          )}

          {/* Flagged phrases */}
          {phrases.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                🚩 Flagged Phrases — hover for explanation
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {phrases.map((p, i) => <PhraseTooltip key={i} phrase={p} />)}
              </div>
            </div>
          )}

          {/* What to do next */}
          <div style={{ background: r.bg, border: `2px solid ${r.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: r.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              💡 What to do next
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(TIPS[result.riskLabel] || TIPS['Low Risk']).map((tip) => (
                <li key={tip} style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Share button */}
          {result.checkId && (
            <motion.button onClick={() => setShowShare(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', alignSelf: 'flex-start' }}>
              🔗 Share This Result
            </motion.button>
          )}
        </div>
      </motion.div>

      {showShare && <ShareModal checkId={result.checkId} onClose={() => setShowShare(false)} />}
    </>
  );
}
