import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import { registerUser } from '../store/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((s) => s.auth);
  useEffect(() => { if (token) navigate('/dashboard', { replace: true }); }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: '5%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 440 }}>

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Create your account 🎉</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>Free forever · No credit card needed</p>
          <AuthForm mode="register" onSubmit={({ username, email, password }) => dispatch(registerUser({ username, email, password }))} status={status} error={error} />
          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
