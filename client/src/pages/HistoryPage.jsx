import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHistory, deleteCheck, toggleBookmark, setFilters, clearFilters } from '../store/checksSlice';
import { addToast } from '../store/uiSlice';
import api from '../api/axiosInstance';
import PhraseTooltip from '../components/PhraseTooltip';

const RISK_OPTIONS = ['', 'High Risk', 'Medium Risk', 'Low Risk'];
const RISK_STYLES = {
  'High Risk':   { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  'Medium Risk': { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  'Low Risk':    { color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
};

export default function HistoryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, pagination, status, filters, bookmarks } = useSelector((s) => s.checks);
  const [expanded, setExpanded] = useState(null);
  const [localFilters, setLocalFilters] = useState(filters);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = (page = 1, f = localFilters) => dispatch(fetchHistory({ page, limit: 20, ...f }));
  useEffect(() => { load(1); }, []);

  const applyFilters = () => { dispatch(setFilters(localFilters)); load(1, localFilters); };
  const resetFilters = () => {
    const empty = { risk: '', search: '', dateFrom: '', dateTo: '' };
    setLocalFilters(empty); dispatch(clearFilters()); load(1, empty);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/api/checks/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'jobguard-history.csv'; a.click();
      URL.revokeObjectURL(url);
      dispatch(addToast({ type: 'success', message: 'History exported as CSV!' }));
    } catch { dispatch(addToast({ type: 'error', message: 'Export failed. Try again.' })); }
    finally { setExporting(false); }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const displayed = showBookmarksOnly ? history.filter((c) => bookmarks.includes(c._id)) : history;

  const inputStyle = { padding: '9px 13px', fontSize: 13, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '2px solid #c7d2fe', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(99,102,241,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '7px 16px', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Back
            </motion.button>
            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>📋 Check History</span>
            <span style={{ fontSize: 12, color: '#6366f1', background: '#eef2ff', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1.5px solid rgba(99,102,241,0.2)' }}>{pagination.total} total</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button onClick={() => setShowBookmarksOnly((v) => !v)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: showBookmarksOnly ? '#fffbeb' : 'rgba(245,158,11,0.08)', border: `1.5px solid ${showBookmarksOnly ? '#fcd34d' : 'rgba(245,158,11,0.25)'}`, borderRadius: 10, padding: '7px 14px', color: '#d97706', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔖 {showBookmarksOnly ? 'All Checks' : 'Bookmarks'}
            </motion.button>
            <motion.button onClick={handleExport} disabled={exporting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '7px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.35)', opacity: exporting ? 0.7 : 1 }}>
              {exporting ? '⏳ Exporting…' : '⬇️ Export CSV'}
            </motion.button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px' }}>
        {/* Filters */}
        <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 18, padding: '18px 22px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
          <div>
            <label style={{ fontSize: 11, color: '#6366f1', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🔍 Search</label>
            <input value={localFilters.search} onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Keyword in job text…" style={{ ...inputStyle, width: 200 }} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6366f1', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Level</label>
            <select value={localFilters.risk} onChange={(e) => setLocalFilters((f) => ({ ...f, risk: e.target.value }))} style={{ ...inputStyle, width: 150 }}>
              {RISK_OPTIONS.map((r) => <option key={r} value={r}>{r || 'All Risks'}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6366f1', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</label>
            <input type="date" value={localFilters.dateFrom} onChange={(e) => setLocalFilters((f) => ({ ...f, dateFrom: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6366f1', display: 'block', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</label>
            <input type="date" value={localFilters.dateTo} onChange={(e) => setLocalFilters((f) => ({ ...f, dateTo: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button onClick={applyFilters} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              Apply
            </motion.button>
            <button onClick={resetFilters} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#64748b', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        {status === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map((i) => <div key={i} style={{ height: 56, background: '#f1f5f9', borderRadius: 14, animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 20, padding: 64, textAlign: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>📋</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>No results found</p>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>Try adjusting your filters or analyse a job posting.</p>
          </div>
        ) : (
          <>
            <div style={{ background: '#ffffff', border: '2px solid #c7d2fe', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#eef2ff', borderBottom: '2px solid #c7d2fe' }}>
                    {['', 'Job Preview', 'Score', 'Risk', 'Source', 'Date', ''].map((h, i) => (
                      <th key={i} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 800, color: '#4338ca', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((check, i) => {
                    const rs = RISK_STYLES[check.riskLabel] || RISK_STYLES['Low Risk'];
                    const isBookmarked = bookmarks.includes(check._id);
                    const isExpanded = expanded === check._id;
                    return (
                      <>
                        <motion.tr key={check._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8faff'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => setExpanded(isExpanded ? null : check._id)}>
                          <td style={{ padding: '13px 8px 13px 16px' }}>
                            <button onClick={(e) => { e.stopPropagation(); dispatch(toggleBookmark(check._id)); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: isBookmarked ? 1 : 0.25, transition: 'all 0.2s', transform: isBookmarked ? 'scale(1.1)' : 'scale(1)' }}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>🔖</button>
                          </td>
                          <td style={{ padding: '13px 16px', color: '#374151', maxWidth: 280 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{check.inputText?.slice(0, 65)}…</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontWeight: 900, color: rs.color, fontSize: 16 }}>{(check.scamProbability * 100).toFixed(0)}%</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: rs.bg, color: rs.color, border: `1.5px solid ${rs.border}`, fontWeight: 800 }}>{check.riskLabel}</span>
                          </td>
                          <td style={{ padding: '13px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{check.source === 'csv' ? '📄 CSV' : '✍️ Manual'}</td>
                          <td style={{ padding: '13px 16px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {new Date(check.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                            <button onClick={(e) => { e.stopPropagation(); dispatch(deleteCheck(check._id)); dispatch(addToast({ type: 'success', message: 'Check deleted' })); }}
                              style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.15s' }}
                              onMouseEnter={(e) => { e.target.style.color = '#ef4444'; e.target.style.background = '#fef2f2'; }}
                              onMouseLeave={(e) => { e.target.style.color = '#94a3b8'; e.target.style.background = 'none'; }}>
                              🗑️ Delete
                            </button>
                          </td>
                        </motion.tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr key={`${check._id}-exp`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <td colSpan={7} style={{ padding: '0 16px 18px 52px', background: '#eef2ff' }}>
                                <div style={{ paddingTop: 14 }}>
                                  <p style={{ fontSize: 11, color: '#6366f1', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Text</p>
                                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 14, background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #e0e7ff' }}>{check.inputText}</p>
                                  {check.suspiciousPhrases?.length > 0 && (
                                    <>
                                      <p style={{ fontSize: 11, color: '#6366f1', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flagged Phrases</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {check.suspiciousPhrases.map((p, i) => <PhraseTooltip key={i} phrase={p} />)}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!showBookmarksOnly && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                <motion.button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 10, padding: '9px 18px', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: pagination.page <= 1 ? 0.4 : 1, boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }}>
                  ← Previous
                </motion.button>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <motion.button key={p} onClick={() => load(p)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={{ width: 36, height: 36, borderRadius: 10, border: p === pagination.page ? 'none' : '1.5px solid #e0e7ff', background: p === pagination.page ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff', color: p === pagination.page ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: p === pagination.page ? '0 4px 12px rgba(99,102,241,0.35)' : '0 2px 6px rgba(99,102,241,0.06)' }}>
                      {p}
                    </motion.button>
                  ))}
                </div>
                <motion.button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= totalPages} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 10, padding: '9px 18px', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: pagination.page >= totalPages ? 0.4 : 1, boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }}>
                  Next →
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
