import { useState } from 'react';

function splitText(text, phrases) {
  if (!phrases || phrases.length === 0) return [{ text, highlight: false }];

  // Build a regex that matches any of the phrases (case-insensitive)
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part) => ({
    text: part,
    highlight: phrases.some((p) => p.toLowerCase() === part.toLowerCase()),
  }));
}

export default function HighlightedText({ text, suspiciousPhrases }) {
  const [tooltip, setTooltip] = useState(null);
  const segments = splitText(text, suspiciousPhrases);

  if (!suspiciousPhrases || suspiciousPhrases.length === 0) {
    return (
      <div className="text-sm text-gray-700 leading-relaxed">
        <p className="text-gray-400 italic">No specific suspicious phrases were detected.</p>
        <p className="mt-2">{text}</p>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-700 leading-relaxed relative">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span key={i} className="relative inline">
            <mark
              className="bg-amber-200 text-amber-900 rounded px-0.5 cursor-help"
              onMouseEnter={() => setTooltip(i)}
              onMouseLeave={() => setTooltip(null)}
            >
              {seg.text}
            </mark>
            {tooltip === i && (
              <span className="absolute bottom-full left-0 mb-1 z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow">
                Suspicious phrase detected
              </span>
            )}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
