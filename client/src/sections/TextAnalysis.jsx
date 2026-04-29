import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { submitJobText, uploadCsv } from '../store/checksSlice';
import { addToast } from '../store/uiSlice';
import ResultCard from '../components/ResultCard';
import Spinner from '../components/Spinner';
import LiveFraudMeter from '../components/LiveFraudMeter';

const C = { card: '#fff', border: '#e2e8f0', purple: '#6366f1', text: '#1e293b', muted: '#64748b' };
const RISK_COLORS = { 'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#10b981' };

export default function TextAnalysis() {
  const dispatch = useDispatch();
  const { currentCheck, batchResults, status, error } = useSelector((s) => s.checks);
  const [text, setText] = useState('');
  const [tab, setTab] = useState('text');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef();

  const handleSubmit = (e) => { e.preventDefault(); if (text.trim()) dispatch(submitJobText(text.trim())); };

  const handleCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    const res = await dispatch(uploadCsv({ file, onProgress: (pct) => setUploadProgress(pct) }));
    if (uploadCsv.fulfilled.match(res)) dispatch(addToast({ type: 'success', message: `Batch complete: ${res.payload.data.results?.length || 0} jobs analysed` }));
    else dispatch(addToast({ type: 'error', message: res.payload || 'Upload failed' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const tabStyle = (t) => ({
    padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
    background: tab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
    color: tab === t ? '#fff' : '#94a3b8',
    boxShadow: tab === t ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
    transition: 'all 0.2s',
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>📝</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Text Analysis</h1>
            <p style={{ color: C.muted, fontSize: 13 }}>Paste a job description or upload a CSV to detect fraud using AI.</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#f1f5f9', borderRadius: 14, padding: 5, width: 'fit-content' }}>
        <button style={tabStyle('text')} onClick={() => setTab('text')}>✍️ Single Job</button>
        <button style={tabStyle('csv')} onClick={() => setTab('csv')}>📄 Bulk CSV</button>
      </div>

      <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
        <AnimatePresence mode="wait">
          {tab === 'text' ? (
            <motion.form key="text" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                  Job Description
                </label>
                <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} maxLength={10000}
                  placeholder="Paste the full job posting here — title, company, responsibilities, salary, contact info..."
                  style={{ width: '100%', padding: '14px 16px', resize: 'vertical', lineHeight: 1.7, fontSize: 14, borderRadius: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: text.length > 8000 ? '#ef4444' : '#94a3b8' }}>{text.length > 8000 ? '⚠️ ' : ''}{text.length} / 10,000</span>
                  {text.length > 0 && <button type="button" onClick={() => setText('')} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Clear ✕</button>}
                </div>
              </div>
              <LiveFraudMeter text={text} />
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                  ⚠️ {error}
                </motion.div>
              )}
              <motion.button type="submit" disabled={!text.trim() || status === 'loading'} whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.98 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: (!text.trim() || status === 'loading') ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {status === 'loading' ? <><Spinner color="#fff" /> Analysing…</> : <>🔍 Analyze Job Posting</>}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div key="csv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))', border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#4338ca', lineHeight: 1.6 }}>
                📋 <strong>CSV Format:</strong> Include a column named <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 5, fontWeight: 700 }}>description</code> with job text. Max 500 rows.
              </div>
              <motion.div whileHover={{ borderColor: '#6366f1', background: 'rgba(99,102,241,0.03)' }} onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 16, padding: 48, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#fafbff' }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>📄</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#4338ca', marginBottom: 4 }}>Click to upload CSV</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>or drag and drop · max 500 rows</p>
              </motion.div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCsv} style={{ display: 'none' }} />

              {status === 'loading' && (
                <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#4338ca', fontWeight: 600 }}>⚡ Uploading & analysing…</span>
                    <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 800 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: 8, background: '#e0e7ff', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${uploadProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99 }} />
                  </div>
                </div>
              )}

              {batchResults?.results && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Total Analysed', value: batchResults.results.length, color: '#6366f1', bg: '#eef2ff' },
                      { label: 'High Risk', value: batchResults.results.filter((r) => r.riskLabel === 'High Risk').length, color: '#ef4444', bg: '#fef2f2' },
                      { label: 'Legitimate', value: batchResults.results.filter((r) => r.riskLabel === 'Low Risk').length, color: '#10b981', bg: '#f0fdf4' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                        <p style={{ fontSize: 28, fontWeight: 900, color }}>{value}</p>
                        <p style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 14, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#eef2ff' }}>
                        <tr>{['#', 'Preview', 'Score', 'Risk'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#4338ca', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {batchResults.results.map((r, i) => {
                          const color = RISK_COLORS[r.riskLabel] || '#10b981';
                          return (
                            <tr key={i} style={{ borderTop: '1px solid #e0e7ff' }}>
                              <td style={{ padding: '9px 14px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ padding: '9px 14px', color: '#374151', maxWidth: 260 }}>
                                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.inputText?.slice(0, 60)}…</span>
                              </td>
                              <td style={{ padding: '9px 14px', fontWeight: 800, color, fontSize: 14 }}>{Math.round(r.scamProbability * 100)}%</td>
                              <td style={{ padding: '9px 14px' }}>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${color}15`, color, border: `1.5px solid ${color}40`, fontWeight: 700 }}>{r.riskLabel}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {batchResults.warnings?.length > 0 && (
                    <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 8, fontWeight: 600 }}>⚠️ {batchResults.warnings.length} rows skipped (empty description)</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {tab === 'text' && <ResultCard result={currentCheck} />}
      </div>
    </motion.div>
  );
}
