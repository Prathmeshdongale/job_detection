import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, changePassword, deleteAccount } from '../store/userSlice';
import { clearAuth } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import Spinner from '../components/Spinner';

export default function ProfileSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, status, pwStatus, pwError } = useSelector((s) => s.user);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, [dispatch]);

  const handlePwChange = async (e) => {
    e.preventDefault(); setPwMsg('');
    if (pw.newPassword !== pw.confirm) { setPwMsg('Passwords do not match'); return; }
    const res = await dispatch(changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }));
    if (changePassword.fulfilled.match(res)) {
      dispatch(addToast({ type: 'success', message: 'Password updated successfully!' }));
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } else { setPwMsg(res.payload || 'Failed to update password'); }
  };

  const handleDelete = async () => {
    const res = await dispatch(deleteAccount());
    if (deleteAccount.fulfilled.match(res)) { dispatch(clearAuth()); navigate('/login', { replace: true }); }
  };

  const cardStyle = { background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: 24, marginBottom: 16, boxShadow: '0 4px 16px rgba(99,102,241,0.1)' };
  const inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f97316,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>👤</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Profile & Settings</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Manage your account details and preferences.</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div style={cardStyle}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>👤 Account Info</p>
        {status === 'loading' ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div> : profile ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Username', value: profile.username, icon: '👤', color: '#4338ca', bg: '#e0e7ff' },
              { label: 'Email', value: profile.email, icon: '📧', color: '#0e7490', bg: '#cffafe' },
              { label: 'Member Since', value: new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), icon: '📅', color: '#065f46', bg: '#d1fae5' },
              { label: 'Total Checks', value: profile.totalChecks, icon: '🔍', color: '#c2410c', bg: '#fed7aa' },
            ].map(({ label, value, icon, color, bg }) => (
              <motion.div key={label} whileHover={{ y: -2 }} style={{ background: bg, borderRadius: 14, padding: '14px 18px', border: `2px solid ${color}40`, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <p style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>{label}</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{value}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Change Password */}
      <div style={cardStyle}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>🔐 Change Password</p>
        <form onSubmit={handlePwChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[{ key: 'currentPassword', label: 'Current Password' }, { key: 'newPassword', label: 'New Password' }, { key: 'confirm', label: 'Confirm New Password' }].map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input type="password" value={pw[key]} onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
          {(pwMsg || pwError) && <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>⚠️ {pwMsg || pwError}</p>}
          <motion.button type="submit" disabled={pwStatus === 'loading'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', opacity: pwStatus === 'loading' ? 0.6 : 1, alignSelf: 'flex-start' }}>
            {pwStatus === 'loading' ? '⏳ Updating…' : '🔐 Update Password'}
          </motion.button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: 18, padding: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>⚠️ Danger Zone</p>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Permanently delete your account and all check history. This cannot be undone.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #fca5a5', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑️ Delete Account
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Are you absolutely sure?</span>
            <button onClick={handleDelete} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>Yes, Delete Everything</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
