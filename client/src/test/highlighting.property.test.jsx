import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import HighlightedText from '../components/dashboard/HighlightedText';

/**
 * Property 14: Suspicious phrase highlighting is complete.
 * Every phrase in suspiciousPhrases appears inside a <mark> element.
 * Validates: Requirements 3.7, 6.1
 */
describe('Property 14 — highlighting completeness', () => {
  it('every suspicious phrase appears in a <mark> element', () => {
    fc.assert(
      fc.property(
        // Generate a base text of printable ASCII words
        fc.array(
          fc.stringMatching(/^[a-z]{3,8}$/),
          { minLength: 3, maxLength: 10 }
        ),
        // Pick 1-3 of those words as suspicious phrases
        (words) => {
          const text = words.join(' ');
          // Pick up to 2 unique words as phrases
          const phrases = [...new Set(words.slice(0, 2))];
          if (phrases.length === 0) return true; // skip degenerate case

          const { container } = render(
            <HighlightedText text={text} suspiciousPhrases={phrases} />
          );

          const marks = Array.from(container.querySelectorAll('mark'));
          const markedTexts = marks.map((m) => m.textContent.toLowerCase());

          for (const phrase of phrases) {
            const found = markedTexts.some((m) => m === phrase.toLowerCase());
            if (!found) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
