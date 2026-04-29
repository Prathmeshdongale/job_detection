import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AuthForm({ mode, onSubmit, status, error }) {
  const isRegister = mode === 'register';
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const onChange = (e) => setFields((p) => ({ ...p, [e.target.name]: e.target.value }));

  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 };
  const inputStyle = { padding: '12px 14px', fontSize: 14, width: '100%', borderRadius: 10 };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(fields); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {isRegister && (
        <div>
          <label htmlFor="username" style={labelStyle}>Full name</label>
          <input id="username" name="username" type="text" required value={fields.username} onChange={onChange} placeholder="Jane Smith" style={inputStyle} />
        </div>
      )}

      <div>
        <label htmlFor="email" style={labelStyle}>Email address</label>
        <input id="email" name="email" type="email" required value={fields.email} onChange={onChange} placeholder="you@example.com" style={inputStyle} />
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <input id="password" name="password" type="password" required minLength={8} value={fields.password} onChange={onChange} placeholder="Minimum 8 characters" style={inputStyle} />
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          role="alert" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {error}
        </motion.div>
      )}

      <motion.button type="submit" disabled={status === 'loading'} whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.98 }}
        style={{ width: '100%', padding: '14px', marginTop: 4, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: status === 'loading' ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        {status === 'loading' ? '⏳ Please wait…' : isRegister ? '🚀 Create account' : '✨ Sign in'}
      </motion.button>
    </form>
  );
}
