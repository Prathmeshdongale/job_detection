import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import { loginUser } from '../store/authSlice';

const FEATURES = [
  { icon: '🤖', text: 'DistilBERT AI model' },
  { icon: '⚡', text: 'Instant live preview' },
  { icon: '📊', text: 'Analytics dashboard' },
  { icon: '🔗', text: 'Shareable results' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((s) => s.auth);
  useEffect(() => { if (token) navigate('/dashboard', { replace: true }); }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '40%', right: '10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      <div style={{ display: 'flex', gap: 48, alignItems: 'center', width: '100%', maxWidth: 900, position: 'relative' }}>

        {/* Left — branding */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          style={{ flex: 1, display: 'none', flexDirection: 'column', gap: 24 }}
          className="hidden-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JobGuard</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>AI-Powered Fraud Detection</p>
            </div>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>
            Protect yourself from<br />
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>fake job scams</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.1)' }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — form */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>JobGuard</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Fake Job Detection System</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 24, padding: 36, boxShadow: '0 8px 40px rgba(99,102,241,0.2)', border: '2px solid #c7d2fe' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Welcome back 👋</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>Sign in to your account</p>
            <AuthForm mode="login" onSubmit={({ email, password }) => dispatch(loginUser({ email, password }))} status={status} error={error} />
            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Create one free →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
