import { useState } from 'react';

export default function CsvUploadControl({ onFileSelect, error }) {
  const [filename, setFilename] = useState('');

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div>
      <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-1">
        Or upload a CSV file
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="block text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {filename && (
        <p className="text-xs text-gray-500 mt-1">Selected: {filename}</p>
      )}
      {error && (
        <p role="alert" className="text-red-600 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
