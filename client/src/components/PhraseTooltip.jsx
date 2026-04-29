import { useState } from 'react';

const EXPLANATIONS = {
  'work from home': 'Legitimate remote jobs rarely need to emphasise this so heavily.',
  'no experience needed': 'Real jobs have requirements. This phrase is used to cast a wide net.',
  'guaranteed income': 'No employer can legally guarantee income — this is a red flag.',
  'uncapped earnings': 'Often used in MLM/pyramid schemes to lure recruits.',
  'urgent hiring': 'Artificial urgency is a classic pressure tactic to bypass scrutiny.',
  'send cv via whatsapp': 'Legitimate companies use official email or portals, not WhatsApp.',
  'registration fee': 'You should never pay to get a job. This is almost always a scam.',
  'pay fee': 'Legitimate employers never ask candidates to pay fees.',
  'easy money': 'No job offers easy money — this phrase signals deception.',
  'passive income': 'Passive income promises are common in MLM and scam schemes.',
  'mlm': 'Multi-level marketing structures are often exploitative.',
  'network marketing': 'Often a euphemism for MLM recruitment schemes.',
  'recruit others': 'Paying you to recruit is a pyramid scheme structure.',
  'no interview needed': 'Skipping interviews means no vetting — a major red flag.',
  'get paid daily': 'Unusual payment frequency is used to attract desperate job seekers.',
  'earn weekly': 'Overly frequent pay promises are a common scam tactic.',
};

function getExplanation(phrase) {
  const lower = phrase.toLowerCase();
  for (const [key, val] of Object.entries(EXPLANATIONS)) {
    if (lower.includes(key)) return val;
  }
  return 'This phrase matches a known fraud pattern in job postings.';
}

export default function PhraseTooltip({ phrase }) {
  const [show, setShow] = useState(false);
  const explanation = getExplanation(phrase);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ fontSize: 12, padding: '4px 11px', borderRadius: 20, background: '#fffbeb', color: '#d97706', border: '1.5px solid #fcd34d', fontWeight: 700, cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
        {phrase}
        <span style={{ fontSize: 10, opacity: 0.7 }}>ⓘ</span>
      </span>
      {show && (
        <div style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '10px 14px', width: 230, zIndex: 100, fontSize: 12, color: '#374151', lineHeight: 1.6, boxShadow: '0 8px 24px rgba(245,158,11,0.2)' }}>
          <div style={{ fontWeight: 800, color: '#d97706', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>⚠️ Why flagged?</div>
          {explanation}
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: '#fff', border: '1.5px solid #fcd34d', borderTop: 'none', borderLeft: 'none' }} />
        </div>
      )}
    </span>
  );
}
