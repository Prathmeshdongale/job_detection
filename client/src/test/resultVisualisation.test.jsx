import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskBadge from '../components/dashboard/RiskBadge';
import HighlightedText from '../components/dashboard/HighlightedText';

// ── RiskBadge ───────────────────────────────────────────────────────────────

describe('RiskBadge', () => {
  it('renders High Risk label', () => {
    render(<RiskBadge riskLabel="High Risk" />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders Medium Risk label', () => {
    render(<RiskBadge riskLabel="Medium Risk" />);
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('renders Low Risk label', () => {
    render(<RiskBadge riskLabel="Low Risk" />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });
});

// ── HighlightedText ─────────────────────────────────────────────────────────

describe('HighlightedText', () => {
  it('wraps each suspicious phrase in a <mark> element', () => {
    const { container } = render(
      <HighlightedText
        text="Work from home and earn money fast"
        suspiciousPhrases={['work from home', 'earn money fast']}
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
    expect(marks[0].textContent.toLowerCase()).toBe('work from home');
    expect(marks[1].textContent.toLowerCase()).toBe('earn money fast');
  });

  it('shows "no phrases" message when list is empty', () => {
    render(
      <HighlightedText
        text="Legitimate software engineer role"
        suspiciousPhrases={[]}
      />
    );
    expect(
      screen.getByText(/no specific suspicious phrases were detected/i)
    ).toBeInTheDocument();
  });

  it('shows "no phrases" message when suspiciousPhrases is undefined', () => {
    render(
      <HighlightedText text="Some text" suspiciousPhrases={undefined} />
    );
    expect(
      screen.getByText(/no specific suspicious phrases were detected/i)
    ).toBeInTheDocument();
  });
});
