// Light theme design tokens — used across all components
export const T = {
  // Backgrounds
  pageBg:    'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fff0f9 100%)',
  cardBg:    '#ffffff',
  cardBg2:   '#f8faff',
  sidebarBg: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',

  // Borders
  border:    '#e2e8f0',
  borderPurple: 'rgba(99,102,241,0.25)',

  // Text
  textPrimary:   '#1e293b',
  textSecondary: '#64748b',
  textMuted:     '#94a3b8',

  // Brand
  purple:  '#6366f1',
  violet:  '#8b5cf6',
  pink:    '#ec4899',

  // Risk
  red:     '#ef4444',
  amber:   '#f59e0b',
  green:   '#10b981',

  // Gradients
  gradPrimary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  gradDanger:  'linear-gradient(135deg, #ef4444, #f97316)',
  gradSuccess: 'linear-gradient(135deg, #10b981, #06b6d4)',
  gradAmber:   'linear-gradient(135deg, #f59e0b, #f97316)',

  // Shadows
  shadowSm:  '0 1px 3px rgba(99,102,241,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:  '0 4px 16px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  shadowLg:  '0 8px 32px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.08)',
  shadowBtn: '0 4px 14px rgba(99,102,241,0.4)',
};

export const card = {
  background: T.cardBg,
  border: `1.5px solid ${T.border}`,
  borderRadius: 18,
  boxShadow: T.shadowMd,
};

export const cardHover = {
  ...card,
  transition: 'box-shadow 0.2s, transform 0.2s',
};

export const primaryBtn = {
  background: T.gradPrimary,
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: T.shadowBtn,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export const ghostBtn = {
  background: 'rgba(99,102,241,0.08)',
  color: T.purple,
  border: `1.5px solid rgba(99,102,241,0.2)`,
  borderRadius: 10,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
