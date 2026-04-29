import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], action: 'Analyze job posting' },
  { keys: ['Ctrl', '1'], action: 'Go to Text Analysis' },
  { keys: ['Ctrl', '2'], action: 'Go to Image Analysis' },
  { keys: ['Ctrl', '3'], action: 'Go to URL Analysis' },
  { keys: ['Ctrl', '4'], action: 'Go to Compare' },
  { keys: ['Ctrl', '5'], action: 'Go to Dashboard' },
  { keys: ['Ctrl', '6'], action: 'Go to Analytics' },
  { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' },
  { keys: ['?'], action: 'Show this help' },
  { keys: ['Esc'], action: 'Close modal / clear' },
];

export function useKeyboardShortcuts({ onNavigate, onToggleSidebar, onAnalyze }) {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'TEXTAREA' || tag === 'INPUT';

      if (e.key === '?' && !isTyping) {
        onNavigate?.('shortcuts');
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const map = { '1': 'text', '2': 'image', '3': 'url', '4': 'compare', '5': 'dashboard', '6': 'analytics' };
        if (map[e.key]) { e.preventDefault(); onNavigate?.(map[e.key]); return; }
        if (e.key === 'b' || e.key === 'B') { e.preventDefault(); onToggleSidebar?.(); return; }
        if (e.key === 'Enter' && isTyping) { e.preventDefault(); onAnalyze?.(); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNavigate, onToggleSidebar, onAnalyze]);
}

export default function ShortcutsModal({ onClose }) {
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
          style={{ background: '#fff', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: 32, width: 420, maxWidth: '90vw' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>⌨️ Keyboard Shortcuts</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHORTCUTS.map(({ keys, action }) => (
              <div key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{action}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {keys.map((k) => (
                    <kbd key={k} style={{ padding: '2px 8px', background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 5, fontSize: 11, color: '#4338ca', fontFamily: 'monospace', fontWeight: 700 }}>
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 16, textAlign: 'center' }}>Press <kbd style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, fontSize: 10, color: '#a5b4fc' }}>?</kbd> anytime to open this</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
