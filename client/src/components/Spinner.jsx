export default function Spinner({ color = '#6366f1', size = 16 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid rgba(99,102,241,0.2)`,
      borderTopColor: color, borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}
