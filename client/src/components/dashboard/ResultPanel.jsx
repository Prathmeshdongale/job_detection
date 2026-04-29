import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import HighlightedText from './HighlightedText';
import { clearCurrentCheck } from '../../store/checksSlice';

function CircleGauge({ pct, color }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="48" y="44" textAnchor="middle" fontSize="18" fontWeight="800"
        fill={color} fontFamily="Inter,sans-serif">{pct}%</text>
      <text x="48" y="58" textAnchor="middle" fontSize="9"
        fill="#94a3b8" fontFamily="Inter,sans-serif">Fraud Prob.</text>
    </svg>
  );
}

const DETECTED_ITEMS = [
  { icon: '⚠️', label: 'Unrealistic salary or promises' },
  { icon: '👤', label: 'Requests for personal data upfront' },
  { icon: '🏢', label: 'Vague or missing company info' },
  { icon: '🏠', label: 'Work-from-home scam patterns' },
  { icon: '⏰', label: 'Urgency and pressure language' },
  { icon: '💳', label: 'Registration or training fee requests' },
];

export default function ResultPanel() {
  const dispatch = useDispatch();
  const { currentCheck, status, error } = useSelector((s) => s.checks);

  useEffect(() => {
    if (error && (error.includes('503') || error.includes('504'))) {
      toast.error('AI service not responding. Make sure it is running on port 8000.');
    }
  }, [error]);

  /* ── Loading skeleton ── */
  if (status === 'loading') {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 16, width: '50%' }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 48 }} />
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!currentCheck) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
          Analysis Result
        </h2>

        {/* Placeholder row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#f8fafc', border: '8px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center', lineHeight: 1.4 }}>Submit to<br/>analyse</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div className="skeleton" style={{ height: 12, width: '60%' }} />
            <div className="skeleton" style={{ height: 10, width: '90%' }} />
            <div className="skeleton" style={{ height: 10, width: '75%' }} />
          </div>
        </div>

        {/* What We Detected grid */}
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>What We Detected</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
          {DETECTED_ITEMS.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', background: '#f8fafc', borderRadius: 7, border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Safety tip */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }}>✅</span>
          <p style={{ fontSize: 11, color: '#15803d', fontWeight: 500 }}>
            Always research the company and never share personal or financial information.
          </p>
        </div>
      </div>
    );
  }

  /* ── Result state ── */
  const { scam_probability, riskLabel, suspicious_phrases, inputText } = currentCheck;
  const pct      = Math.round(scam_probability * 100);
  const color    = scam_probability >= 0.7 ? '#dc2626' : scam_probability >= 0.4 ? '#d97706' : '#16a34a';
  const riskBg   = scam_probability >= 0.7 ? '#fef2f2' : scam_probability >= 0.4 ? '#fffbeb' : '#f0fdf4';
  const riskBdr  = scam_probability >= 0.7 ? '#fca5a5' : scam_probability >= 0.4 ? '#fcd34d' : '#86efac';
  const riskIcon = scam_probability >= 0.7 ? '⛔' : scam_probability >= 0.4 ? '⚠️' : '✅';
  const riskTitle= scam_probability >= 0.7 ? 'High Risk' : scam_probability >= 0.4 ? 'Medium Risk' : 'Low Risk';
  const riskDesc = scam_probability >= 0.7
    ? 'This job posting has strong indicators of potential fraud.'
    : scam_probability >= 0.4
    ? 'Some suspicious elements found. Verify before applying.'
    : 'No major red flags detected. Looks legitimate.';

  const whyFlagged = [
    suspicious_phrases?.[0] && `The job mentions "${suspicious_phrases[0]}"`,
    suspicious_phrases?.[1] && `Contains phrase: "${suspicious_phrases[1]}"`,
    scam_probability >= 0.7 && 'Creates a sense of urgency to apply immediately.',
  ].filter(Boolean);

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Analysis Result</h2>
        <button onClick={() => dispatch(clearCurrentCheck())} className="btn-ghost-blue btn" style={{ fontSize: 12, padding: '5px 12px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          New Analysis
        </button>
      </div>

      {/* Gauge + Risk */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <CircleGauge pct={pct} color={color} />
        <div style={{ flex: 1, background: riskBg, border: `1px solid ${riskBdr}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: 16 }}>{riskIcon}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color }}>{riskTitle}</span>
          </div>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{riskDesc}</p>
        </div>
      </div>

      {/* What We Detected */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>What We Detected</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {DETECTED_ITEMS.map((item) => {
            const flagged = suspicious_phrases?.some(p =>
              item.label.toLowerCase().includes(p.toLowerCase().slice(0, 6))
            );
            return (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', background: flagged ? '#fef2f2' : '#f8fafc', borderRadius: 7, border: `1px solid ${flagged ? '#fca5a5' : '#f1f5f9'}` }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: flagged ? '#dc2626' : '#64748b', fontWeight: flagged ? 600 : 400 }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Flagged */}
      {whyFlagged.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>Why Flagged?</p>
          <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {whyFlagged.map((r, i) => (
              <li key={i} style={{ fontSize: 12, color: '#475569' }}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Analysed text (collapsed) */}
      {inputText && suspicious_phrases?.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Analysed Text</p>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, maxHeight: 80, overflowY: 'auto', padding: '8px 11px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e2e8f0' }}>
            <HighlightedText text={inputText} suspiciousPhrases={suspicious_phrases} />
          </div>
        </div>
      )}

      {/* Safety tip */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }}>✅</span>
        <p style={{ fontSize: 11, color: '#15803d', fontWeight: 500 }}>
          Always research the company and never share personal or financial information.
        </p>
      </div>
    </div>
  );
}
