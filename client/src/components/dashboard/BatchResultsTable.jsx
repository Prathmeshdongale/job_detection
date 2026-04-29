import { useSelector } from 'react-redux';

function RiskBadge({ label }) {
  const cls = label === 'High Risk' ? 'badge-high' : label === 'Medium Risk' ? 'badge-medium' : 'badge-low';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function BatchResultsTable() {
  const batchResults = useSelector((s) => s.checks.batchResults);
  if (!batchResults) return null;

  const { results = [], warnings = [] } = batchResults;
  const high = results.filter((r) => r.riskLabel === 'High Risk').length;
  const med  = results.filter((r) => r.riskLabel === 'Medium Risk').length;
  const low  = results.filter((r) => r.riskLabel === 'Low Risk').length;

  return (
    <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1c1c1c' }}>Batch results</h2>
        <span style={{ fontSize: 13, color: '#7a7a7a' }}>{results.length} jobs analysed</span>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'High Risk',   count: high, bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
          { label: 'Medium Risk', count: med,  bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
          { label: 'Low Risk',    count: low,  bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
        ].map((s) => (
          <div key={s.label} className="stat-box"
            style={{ background: s.bg, borderColor: s.border }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</p>
            <p style={{ fontSize: 12, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e0ddd6' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f5f0', borderBottom: '1px solid #e0ddd6' }}>
              {['#', 'Preview', 'Score', 'Risk', 'Verdict'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontWeight: 700, color: '#7a7a7a',
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ede8' }}>
                <td style={{ padding: '10px 14px', color: '#a0a0a0' }}>{i + 1}</td>
                <td style={{ padding: '10px 14px', color: '#4a4a4a', maxWidth: 220 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.inputText?.slice(0, 55) || `Row ${i + 1}`}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 700,
                  color: row.riskLabel === 'High Risk' ? '#dc2626' : row.riskLabel === 'Medium Risk' ? '#d97706' : '#16a34a' }}>
                  {(row.scam_probability * 100).toFixed(0)}%
                </td>
                <td style={{ padding: '10px 14px' }}><RiskBadge label={row.riskLabel} /></td>
                <td style={{ padding: '10px 14px', color: '#7a7a7a', fontSize: 12 }}>
                  {row.riskLabel === 'High Risk' ? 'Likely fraud' : row.riskLabel === 'Medium Risk' ? 'Suspicious' : 'Legitimate'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 5 }}>
            {warnings.length} rows skipped
          </p>
          <ul style={{ fontSize: 12, color: '#b45309', paddingLeft: 16 }}>
            {warnings.map((w, i) => <li key={i}>Row {w.row + 1}: {w.reason}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
