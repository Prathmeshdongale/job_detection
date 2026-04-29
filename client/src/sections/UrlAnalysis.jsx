import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { submitJobText } from '../store/checksSlice';
import ResultCard from '../components/ResultCard';
import Spinner from '../components/Spinner';

export default function UrlAnalysis() {
  const dispatch = useDispatch();
  const { currentCheck, status } = useSelector((s) => s.checks);
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedText, setFetchedText] = useState('');
  const [fetchError, setFetchError] = useState('');

  const handleFetch = async () => {
    if (!url.trim()) return;
    setFetching(true); setFetchError(''); setFetchedText('');
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      const stripped = data.contents.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,10000);
      setFetchedText(stripped);
    } catch { setFetchError('Could not fetch that URL. Try pasting the description manually.'); }
    finally { setFetching(false); }
  };

  const handleSubmit = (e) => { e.preventDefault(); if (fetchedText.trim()) dispatch(submitJobText(fetchedText.trim())); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}>🔗</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>URL Analysis</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Paste a job listing URL — we'll fetch and analyse it automatically.</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '2px solid #a5f3fc', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(6,182,212,0.12)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Job Listing URL</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/…"
                style={{ flex: 1, padding: '12px 14px', fontSize: 14, borderRadius: 12 }} />
              <motion.button type="button" onClick={handleFetch} disabled={!url.trim() || fetching}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(6,182,212,0.4)', flexShrink: 0, opacity: (!url.trim() || fetching) ? 0.6 : 1 }}>
                {fetching ? <><Spinner color="#fff" size={14} /> Fetching…</> : '🌐 Fetch'}
              </motion.button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Works with most public job boards. Some sites may block automated fetching.</p>
          </div>

          {fetchError && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>⚠️ {fetchError}</div>}

          {fetchedText && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Fetched Content — edit if needed</label>
              <textarea rows={7} value={fetchedText} onChange={(e) => setFetchedText(e.target.value)} style={{ width: '100%', padding: '12px 14px', resize: 'vertical', fontSize: 13, borderRadius: 12 }} />
            </motion.div>
          )}

          {fetchedText && (
            <motion.button type="submit" disabled={status === 'loading'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: status === 'loading' ? 0.6 : 1 }}>
              {status === 'loading' ? <><Spinner color="#fff" /> Analysing…</> : <>🔍 Analyze Job Posting</>}
            </motion.button>
          )}
        </form>
        <ResultCard result={currentCheck} />
      </div>
    </motion.div>
  );
}
