import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createWorker } from 'tesseract.js';
import { submitJobText } from '../store/checksSlice';
import ResultCard from '../components/ResultCard';
import Spinner from '../components/Spinner';

export default function ImageAnalysis() {
  const dispatch = useDispatch();
  const { currentCheck, status } = useSelector((s) => s.checks);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageFile(file); setOcrText(''); setOcrDone(false); setOcrProgress(0);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const runOCR = async () => {
    if (!imageFile) return;
    setOcrLoading(true); setOcrProgress(5);
    const worker = await createWorker('eng', 1, { logger: (m) => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); } });
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    setOcrText(text.trim()); setOcrDone(true); setOcrLoading(false); setOcrProgress(100);
  };

  const handleSubmit = (e) => { e.preventDefault(); if (ocrText.trim()) dispatch(submitJobText(ocrText.trim())); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}>🖼️</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Image Analysis</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Upload a screenshot — OCR extracts the text, then AI analyses it.</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '2px solid #ddd6fe', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(139,92,246,0.12)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <motion.div whileHover={{ borderColor: '#8b5cf6', background: '#faf5ff' }} onClick={() => inputRef.current?.click()}
            style={{ border: '2px dashed rgba(139,92,246,0.35)', borderRadius: 16, padding: 36, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#fdfaff' }}>
            {preview
              ? <img src={preview} alt="preview" style={{ maxHeight: 220, margin: '0 auto', display: 'block', borderRadius: 12, objectFit: 'contain', boxShadow: '0 4px 16px rgba(139,92,246,0.2)' }} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 48 }}>🖼️</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed' }}>Click to upload image</p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>PNG, JPG, WEBP — screenshots work great</p>
                </div>
              )}
          </motion.div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

          {imageFile && !ocrDone && (
            <motion.button type="button" onClick={runOCR} disabled={ocrLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
              {ocrLoading ? <><Spinner color="#fff" /> Extracting… {ocrProgress}%</> : '🔍 Extract Text from Image'}
            </motion.button>
          )}

          {ocrLoading && (
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Reading image…</span>
                <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{ocrProgress}%</span>
              </div>
              <div style={{ height: 6, background: '#ede9fe', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div animate={{ width: `${ocrProgress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius: 99 }} />
              </div>
            </div>
          )}

          {ocrDone && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>Extracted Text — edit if needed</label>
              <textarea rows={5} value={ocrText} onChange={(e) => setOcrText(e.target.value)} style={{ width: '100%', padding: '12px 14px', resize: 'vertical', fontSize: 13, borderRadius: 12 }} />
            </div>
          )}

          {ocrDone && (
            <motion.button type="submit" disabled={!ocrText.trim() || status === 'loading'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: (!ocrText.trim() || status === 'loading') ? 0.6 : 1 }}>
              {status === 'loading' ? <><Spinner color="#fff" /> Analysing…</> : <>🔍 Analyze Job Posting</>}
            </motion.button>
          )}
        </form>
        <ResultCard result={currentCheck} />
      </div>
    </motion.div>
  );
}
