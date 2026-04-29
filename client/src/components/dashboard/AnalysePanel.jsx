import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createWorker } from 'tesseract.js';
import { submitJobText, uploadCsv } from '../../store/checksSlice';

const TABS = [
  { id: 'text', label: 'Description', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'image', label: 'Image', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { id: 'url', label: 'URL', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { id: 'csv', label: 'Bulk CSV', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> },
];

export default function AnalysePanel() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((s) => s.checks);
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const fileRef = useRef();
  const imgRef = useRef();
  const isLoading = status === 'loading';

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setExtractedText('');
    setOcrProgress(0);
    setOcrStatus('');
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const runOCR = async () => {
    if (!imageFile) return;
    setOcrStatus('Starting…');
    setOcrProgress(5);
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.round(m.progress * 100));
          setOcrStatus(`Reading… ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    const { data: { text: extracted } } = await worker.recognize(imageFile);
    await worker.terminate();
    const cleaned = extracted.trim();
    setExtractedText(cleaned);
    setText(cleaned);
    setOcrStatus('Done — text extracted');
    setOcrProgress(100);
  };

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setUrlLoading(true);
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      const stripped = data.contents
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim().slice(0, 10000);
      setText(stripped);
      setTab('text');
    } catch {
      alert('Could not fetch that URL. Paste the description manually.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === 'csv' && csvFile) { dispatch(uploadCsv({ file: csvFile })); return; }
    if (text.trim()) dispatch(submitJobText(text.trim()));
  };

  const canSubmit = !isLoading && (tab === 'csv' ? !!csvFile : !!text.trim());

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ padding: '16px 20px 0' }}>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-item ${tab === t.id ? 'active' : ''}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* TEXT */}
        {tab === 'text' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              Job Description
            </label>
            <textarea
              rows={7}
              maxLength={10000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full job posting here — title, company, responsibilities, salary, contact info..."
              style={{ padding: '10px 14px', resize: 'vertical', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>
              {text.length} / 10,000
            </p>
          </div>
        )}

        {/* IMAGE */}
        {tab === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Upload job post image</label>
            <div className="dropzone" onClick={() => imgRef.current?.click()}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ maxHeight: 180, margin: '0 auto', display: 'block', borderRadius: 8, objectFit: 'contain' }} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>Click to upload image</p>
                    <p style={{ fontSize: 12 }}>PNG, JPG, WEBP supported</p>
                  </div>
                )
              }
            </div>
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            {imageFile && !extractedText && (
              <button type="button" onClick={runOCR} className="btn btn-blue">Extract text from image</button>
            )}
            {ocrStatus && (
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>{ocrStatus}</p>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${ocrProgress}%`, background: ocrProgress === 100 ? '#16a34a' : '#2563eb' }} />
                </div>
              </div>
            )}
            {extractedText && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Extracted text — edit if needed</label>
                <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} style={{ padding: '10px 13px', resize: 'vertical' }} />
              </div>
            )}
          </div>
        )}

        {/* URL */}
        {tab === 'url' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Job listing URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/…" style={{ padding: '10px 13px', flex: 1 }} />
              <button type="button" onClick={handleUrlFetch} disabled={!url.trim() || urlLoading} className="btn btn-blue" style={{ padding: '10px 18px', flexShrink: 0 }}>
                {urlLoading ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Works with most public job boards. If blocked, paste the description manually.</p>
            {text && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Fetched content</label>
                <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} style={{ padding: '10px 13px', resize: 'vertical' }} />
              </div>
            )}
          </div>
        )}

        {/* CSV */}
        {tab === 'csv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Upload CSV file</label>
            <div className="dropzone" onClick={() => fileRef.current?.click()}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>{csvFile ? csvFile.name : 'Click to upload CSV'}</p>
                <p style={{ fontSize: 12 }}>Max 500 rows · 10 MB</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0])} style={{ display: 'none' }} />
            <p style={{ fontSize: 12, color: '#94a3b8' }}>CSV must have a <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>description</code> column.</p>
          </div>
        )}

        {error && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 13px', color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Tip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '8px 11px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            <strong>Tip:</strong> The more details you provide, the more accurate the analysis.
          </p>
        </div>

        <button type="submit" disabled={!canSubmit} className="btn btn-blue" style={{ width: '100%', padding: '12px', fontSize: 14, gap: 8 }}>
          {isLoading ? (
            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analysing…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Analyze Job Posting</>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Your data is private and never shared.
        </p>
      </form>
    </div>
  );
}
