import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { submitJobText } from '../store/checksSlice';
import PhraseTooltip from '../components/PhraseTooltip';
import Spinner from '../components/Spinner';

const RISK_COLORS = { 'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#10b981' };
const CARD_ACCENTS = ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#ec4899,#f97316)'];
const CARD_SHADOWS = ['rgba(99,102,241,0.25)', 'rgba(236,72,153,0.25)'];

function ResultPane({ result, loading, idx }) {
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}><Spinner /></div>;
  if (!result) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, color: '#94a3b8', fontSize: 13 }}>Result will appear here</div>;

  const isFake = result.riskLabel === 'High Risk';
  const isMed  = result.riskLabel === 'Medium Risk';
  const pct    = Math.round((result.scam_probability ?? result.scamProbability) * 100);
  const color  = RISK_COLORS[result.riskLabel] || '#10b981';
  const icon   = isFake ? '🚨' : isMed ? '⚠️' : '✅';
  const label  = isFake ? 'FAKE JOB' : isMed ? 'SUSPICIOUS' : 'LEGITIMATE';
  const phrases = result.suspicious_phrases || result.suspiciousPhrases || [];
  const bg = isFake ? '#fef2f2' : isMed ? '#fffbeb' : '#f0fdf4';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color }}>{label}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Fraud score: {pct}%</p>
        </div>
        <p style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 900, color }}>{pct}%</p>
      </div>
      <div style={{ height: 7, background: `${color}20`, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99 }} />
      </div>
      {phrases.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Flagged</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {phrases.map((p, i) => <PhraseTooltip key={i} phrase={p} />)}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CompareSection() {
  const dispatch = useDispatch();
  const [texts, setTexts] = useState(['', '']);
  const [results, setResults] = useState([null, null]);
  const [loading, setLoading] = useState([false, false]);

  const analyse = async (idx) => {
    if (!texts[idx].trim()) return;
    setLoading((l) => { const n = [...l]; n[idx] = true; return n; });
    const res = await dispatch(submitJobText(texts[idx].trim()));
    setLoading((l) => { const n = [...l]; n[idx] = false; return n; });
    if (submitJobText.fulfilled.match(res)) setResults((r) => { const n = [...r]; n[idx] = res.payload.data; return n; });
  };

  const analyseAll = () => { analyse(0); analyse(1); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>⚖️</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Compare Jobs</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Paste two job descriptions side-by-side to compare fraud scores.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[0, 1].map((idx) => (
          <div key={idx} style={{ flex: 1, background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 20, padding: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: CARD_ACCENTS[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: `0 3px 10px ${CARD_SHADOWS[idx]}` }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Job {idx + 1}</span>
            </div>

            <textarea rows={8} value={texts[idx]}
              onChange={(e) => setTexts((t) => { const n = [...t]; n[idx] = e.target.value; return n; })}
              placeholder={`Paste job description ${idx + 1} here…`}
              style={{ width: '100%', padding: '12px 14px', resize: 'vertical', fontSize: 13, borderRadius: 12 }} />

            <motion.button onClick={() => analyse(idx)} disabled={!texts[idx].trim() || loading[idx]}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: CARD_ACCENTS[idx], color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: `0 4px 12px ${CARD_SHADOWS[idx]}`, opacity: (!texts[idx].trim() || loading[idx]) ? 0.6 : 1 }}>
              {loading[idx] ? <><Spinner color="#fff" size={13} /> Analysing…</> : `🔍 Analyse Job ${idx + 1}`}
            </motion.button>

            <ResultPane result={results[idx]} loading={loading[idx]} idx={idx} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.button onClick={analyseAll} disabled={!texts[0].trim() || !texts[1].trim() || loading[0] || loading[1]}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.98 }}
          style={{ padding: '13px 36px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: (!texts[0].trim() || !texts[1].trim()) ? 0.5 : 1 }}>
          ⚡ Analyse Both Jobs
        </motion.button>
      </div>

      {results[0] && results[1] && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, background: 'linear-gradient(135deg,#eef2ff,#faf5ff)', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: '16px 24px', textAlign: 'center' }}>
          {(() => {
            const s0 = results[0].scam_probability ?? results[0].scamProbability;
            const s1 = results[1].scam_probability ?? results[1].scamProbability;
            const diff = Math.abs(Math.round((s0 - s1) * 100));
            const safer = s0 < s1 ? 'Job 1' : 'Job 2';
            const saferColor = s0 < s1 ? CARD_ACCENTS[0] : CARD_ACCENTS[1];
            return (
              <p style={{ fontSize: 15, fontWeight: 800, background: saferColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🏆 {safer} appears safer — {diff}% lower fraud score
              </p>
            );
          })()}
        </motion.div>
      )}
    </motion.div>
  );
}
