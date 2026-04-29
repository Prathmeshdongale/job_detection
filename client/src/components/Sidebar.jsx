import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

const NAV = [
  { id: 'text',      label: 'Text Analysis',  icon: '📝', color: '#6366f1' },
  { id: 'image',     label: 'Image Analysis', icon: '🖼️', color: '#8b5cf6' },
  { id: 'url',       label: 'URL Analysis',   icon: '🔗', color: '#06b6d4' },
  { id: 'compare',   label: 'Compare Jobs',   icon: '⚖️', color: '#f59e0b' },
  { id: 'dashboard', label: 'Dashboard',      icon: '📊', color: '#10b981' },
  { id: 'analytics', label: 'Analytics',      icon: '📈', color: '#ec4899' },
  { id: 'profile',   label: 'Profile',        icon: '👤', color: '#f97316' },
];

export default function Sidebar({ open, active, onSelect, onToggle }) {
  const bookmarks = useSelector((s) => s.checks.bookmarks);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onToggle}
            style={{ position: 'fixed', inset: 0, background: 'rgba(99,102,241,0.15)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: open ? 248 : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)',
          zIndex: 50, overflow: 'hidden', flexShrink: 0,
          boxShadow: '4px 0 32px rgba(99,102,241,0.3)',
        }}
      >
        <div style={{ width: 248, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Brand */}
          <div style={{ padding: '28px 20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>JobGuard</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>AI Fraud Detector</p>
              </div>
            </div>

            {/* AI status pill */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>AI Model Active</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>DistilBERT</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 20px' }} />

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px 8px' }}>Navigation</p>
            {NAV.map((item) => {
              const isActive = active === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  whileHover={{ x: 4, background: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 14px', borderRadius: 12, border: 'none',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                    boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    position: 'relative',
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <motion.div layoutId="sidebarActive"
                      style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 99, background: '#fff' }} />
                  )}

                  {/* Icon bubble */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, transition: 'background 0.15s',
                  }}>
                    {item.icon}
                  </div>

                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'rgba(255,255,255,0.75)', flex: 1 }}>
                    {item.label}
                  </span>

                  {item.id === 'profile' && bookmarks.length > 0 && (
                    <span style={{ fontSize: 10, background: '#fbbf24', color: '#78350f', borderRadius: 10, padding: '2px 7px', fontWeight: 800 }}>
                      {bookmarks.length}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Stay Protected</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Always verify before applying</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
