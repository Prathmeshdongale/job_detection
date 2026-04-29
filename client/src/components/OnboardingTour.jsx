import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    title: '👋 Welcome to JobGuard!',
    body: 'JobGuard uses AI + rule-based detection to identify fake job postings. Let\'s take a quick tour so you get the most out of it.',
    icon: '🛡️',
  },
  {
    title: '📝 Text Analysis',
    body: 'Paste any job description and click Analyze. Our DistilBERT model + 20 fraud rules will score it in seconds.',
    icon: '📝',
  },
  {
    title: '⚡ Live Risk Preview',
    body: 'As you type, a live meter shows a real-time risk estimate — before you even click Analyze.',
    icon: '⚡',
  },
  {
    title: '📄 Bulk CSV Upload',
    body: 'Have hundreds of job listings? Upload a CSV with a "description" column and analyse up to 500 at once.',
    icon: '📄',
  },
  {
    title: '📊 Analytics & Trends',
    body: 'The Analytics section shows your 30-day activity, risk distribution, and the most common fraud phrases you\'ve encountered.',
    icon: '📊',
  },
  {
    title: '🔗 Share Results',
    body: 'After analysing a job, you can generate a public share link to send to colleagues — no login needed to view.',
    icon: '🔗',
  },
  {
    title: '⌨️ Keyboard Shortcuts',
    body: 'Power users: press ? anytime to see all keyboard shortcuts. Ctrl+Enter submits, Ctrl+1-6 switches sections.',
    icon: '⌨️',
  },
];

const STORAGE_KEY = 'jg_tour_done';

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div
          key={step}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{ background: 'linear-gradient(135deg, #ffffff, #faf5ff)', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 24, padding: 40, width: 460, maxWidth: '90vw', textAlign: 'center', boxShadow: '0 24px 80px rgba(99,102,241,0.2)' }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>{current.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>{current.title}</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>{current.body}</p>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 99, background: i === step ? '#6366f1' : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {step > 0 && (
              <button onClick={prev}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            )}
            <motion.button onClick={next} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              {step === STEPS.length - 1 ? "🚀 Let's Go!" : 'Next →'}
            </motion.button>
          </div>

          <button onClick={finish}
            style={{ marginTop: 16, background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Skip tour
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
