import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { clearAuth } from '../store/authSlice';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import ToastContainer from '../components/Toast';
import OnboardingTour from '../components/OnboardingTour';
import ShortcutsModal, { useKeyboardShortcuts } from '../components/KeyboardShortcuts';
import TextAnalysis from '../sections/TextAnalysis';
import ImageAnalysis from '../sections/ImageAnalysis';
import UrlAnalysis from '../sections/UrlAnalysis';
import Dashboard from '../sections/Dashboard';
import AnalyticsSection from '../sections/AnalyticsSection';
import ProfileSection from '../sections/ProfileSection';
import CompareSection from '../sections/CompareSection';

const SECTIONS = { text: TextAnalysis, image: ImageAnalysis, url: UrlAnalysis, compare: CompareSection, dashboard: Dashboard, analytics: AnalyticsSection, profile: ProfileSection };
const TITLES   = { text: '📝 Text Analysis', image: '🖼️ Image Analysis', url: '🔗 URL Analysis', compare: '⚖️ Compare Jobs', dashboard: '📊 Dashboard', analytics: '📈 Analytics', profile: '👤 Profile & Settings' };
const SECTION_COLORS = { text: '#6366f1', image: '#8b5cf6', url: '#06b6d4', compare: '#f59e0b', dashboard: '#10b981', analytics: '#ec4899', profile: '#f97316' };

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [active, setActive] = useState('text');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const ActiveSection = SECTIONS[active];
  const accentColor = SECTION_COLORS[active];

  useKeyboardShortcuts({
    onNavigate: (id) => { if (id === 'shortcuts') setShowShortcuts(true); else setActive(id); },
    onToggleSidebar: () => setSidebarOpen((v) => !v),
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef2ff' }}>
      <Sidebar open={sidebarOpen} active={active} onSelect={setActive} onToggle={() => setSidebarOpen((v) => !v)} />

      <div style={{ flex: 1, marginLeft: sidebarOpen ? 248 : 0, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          height: 60, background: '#ffffff',
          borderBottom: '2px solid #c7d2fe',
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
          boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
        }}>
          {/* Hamburger */}
          <motion.button onClick={() => setSidebarOpen((v) => !v)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0,1,2].map((i) => <span key={i} style={{ display: 'block', width: 16, height: 2, background: '#6366f1', borderRadius: 1 }} />)}
          </motion.button>

          {/* Title with color accent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 20, borderRadius: 99, background: accentColor }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{TITLES[active]}</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* AI status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>AI Online</span>
            </div>

            <ThemeToggle />

            <motion.button onClick={() => setShowShortcuts(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              title="Keyboard shortcuts (?)"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '7px 10px', color: '#6366f1', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⌨️
            </motion.button>

            <motion.button onClick={() => navigate('/history')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '7px 14px', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              📋 History
            </motion.button>

            <motion.button onClick={() => { dispatch(clearAuth()); navigate('/login', { replace: true }); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '7px 14px', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign out
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: 980, width: '100%', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <ActiveSection key={active} />
          </AnimatePresence>
        </main>
      </div>

      <ToastContainer />
      <OnboardingTour />
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
