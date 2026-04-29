import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/uiSlice';

const STYLES = {
  success: { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', icon: '✅', accent: '#10b981' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', icon: '🚨', accent: '#ef4444' },
  info:    { bg: '#eef2ff', border: '#a5b4fc', color: '#4338ca', icon: 'ℹ️', accent: '#6366f1' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#d97706', icon: '⚠️', accent: '#f59e0b' },
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();
  const s = STYLES[toast.type] || STYLES.info;

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(toast.id)), toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dispatch]);

  return (
    <motion.div initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.9 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: s.bg, border: `1.5px solid ${s.border}`, borderLeft: `4px solid ${s.accent}`, borderRadius: 14, padding: '12px 16px', minWidth: 280, maxWidth: 380, boxShadow: `0 8px 24px ${s.accent}25` }}>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <span style={{ fontSize: 13, color: s.color, flex: 1, fontWeight: 600 }}>{toast.message}</span>
      <button onClick={() => dispatch(removeToast(toast.id))}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2, borderRadius: 6 }}>×</button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence>{toasts.map((t) => <ToastItem key={t.id} toast={t} />)}</AnimatePresence>
    </div>
  );
}
