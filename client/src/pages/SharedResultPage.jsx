import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import PhraseTooltip from '../components/PhraseTooltip';

export default function SharedResultPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/predict/shared/${token}`)
      .then((r) => setResult(r.data))
      .catch(() => setError('This shared result was not found or has been removed.'))
      .finally(() => setLoading(false));
  }, [token]);

  const isFake = result?.riskLabel === 'High Risk';
  const isMed  = result?.riskLabel === 'Medium Risk';
  const pct    = result ? Math.round(result.scamProbability * 100) : 0;
  const color  = isFake ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981';
  const icon   = isFake ? '🚨' : isMed ? '⚠️' : '✅';
  const label  = isFake ? 'FAKE JOB' : isMed ? 'SUSPICIOUS' : 'LEGITIMATE';

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>JobGuard</p>
          <p style={{ fontSize: 10, color: '#64748b' }}>Shared Analysis Result</p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 600 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 14 }}>Loading result…</div>
        )}

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Result Not Found</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>{error}</p>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score card */}
            <div style={{ background: `${color}20`, border: `2px solid ${color}60`, borderRadius: 20, padding: 28, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <span style={{ fontSize: 36 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '0.02em' }}>{label}</p>
                  {result.jobTitle && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{result.jobTitle}</p>}
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>fraud score</p>
                </div>
              </div>
              <div style={{ height: 8, background: `${color}25`, borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: color, borderRadius: 99 }} />
              </div>
            </div>

            {/* AI Explanation */}
            {result.aiExplanation && (
              <div style={{ background: '#eef2ff', border: '2px solid #c7d2fe', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🤖 AI Explanation</p>
                <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7 }}>{result.aiExplanation}</p>
              </div>
            )}

            {/* Flagged phrases */}
            {result.suspiciousPhrases?.length > 0 && (
              <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Flagged Phrases</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.suspiciousPhrases.map((p, i) => <PhraseTooltip key={i} phrase={p} />)}
                </div>
              </div>
            )}

            {/* Job text preview */}
            <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Job Description</p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, maxHeight: 200, overflow: 'hidden' }}>
                {result.inputText?.slice(0, 600)}{result.inputText?.length > 600 ? '…' : ''}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>Want to check your own job postings?</p>
              <Link to="/register"
                style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
                Try JobGuard Free →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
