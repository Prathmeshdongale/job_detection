import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/uiSlice';
import api from '../api/axiosInstance';

export default function ShareModal({ checkId, onClose }) {
  const dispatch = useDispatch();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/predict/${checkId}/share`);
      const url = `${window.location.origin}/shared/${data.shareToken}`;
      setShareUrl(url);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to generate share link' }));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    dispatch(addToast({ type: 'success', message: 'Link copied to clipboard!' }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: 32, width: 440, maxWidth: '90vw' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>🔗 Share Result</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
            Generate a public link to share this fraud analysis result. Anyone with the link can view it — no login required.
          </p>

          {!shareUrl ? (
            <motion.button onClick={generate} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
              {loading ? '⏳ Generating…' : '✨ Generate Share Link'}
            </motion.button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={shareUrl}
                  style={{ flex: 1, padding: '10px 12px', background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 8, color: '#4338ca', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                <motion.button onClick={copy} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: '1px solid rgba(99,102,241,0.3)', flexShrink: 0 }}>
                  📋 Copy
                </motion.button>
              </div>
              <p style={{ fontSize: 11, color: '#475569' }}>⚠️ Anyone with this link can view the result. The link does not expire.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
