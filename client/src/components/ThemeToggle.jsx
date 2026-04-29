import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/uiSlice';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const isDark = theme === 'dark';

  return (
    <motion.button onClick={() => dispatch(toggleTheme())} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
      {isDark ? '☀️' : '🌙'}
    </motion.button>
  );
}
