const MAX_CHARS = 10000;

export default function TextInputArea({ value, onChange }) {
  return (
    <div>
      <label htmlFor="job-text" className="block text-sm font-medium text-gray-700 mb-1">
        Job Description
      </label>
      <textarea
        id="job-text"
        name="job-text"
        rows={8}
        maxLength={MAX_CHARS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here…"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-400 text-right mt-1">
        {value.length} / {MAX_CHARS}
      </p>
    </div>
  );
}
