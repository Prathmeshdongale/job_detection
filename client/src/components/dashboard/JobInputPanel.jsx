import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitJobText, uploadCsv } from '../../store/checksSlice';
import TextInputArea from './TextInputArea';
import CsvUploadControl from './CsvUploadControl';

export default function JobInputPanel() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((s) => s.checks);
  const [text, setText] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const isLoading = status === 'loading';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (csvFile) {
      dispatch(uploadCsv({ file: csvFile }));
    } else if (text.trim()) {
      dispatch(submitJobText(text.trim()));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">Analyse a Job Posting</h2>
      <TextInputArea value={text} onChange={setText} />
      <CsvUploadControl onFileSelect={setCsvFile} error={null} />

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || (!text.trim() && !csvFile)}
        className="self-end bg-blue-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {isLoading ? 'Analysing…' : 'Analyse'}
      </button>
    </form>
  );
}
