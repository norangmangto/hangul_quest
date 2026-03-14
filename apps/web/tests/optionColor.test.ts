import { describe, it, expect } from 'vitest';

// Pure helper extracted from PlayerGame for isolated testing
function optionColor(
  opt: string,
  isResult: boolean,
  selected: string | null,
  correctAnswer: string | undefined,
): string {
  if (!isResult) {
    if (opt === selected) return 'selected';
    if (selected !== null) return 'disabled';
    return 'default';
  }
  if (opt === correctAnswer) return 'correct';
  if (opt === selected && opt !== correctAnswer) return 'wrong';
  return 'neutral';
}

describe('optionColor logic', () => {
  it('returns default when not answered and not result', () => {
    expect(optionColor('A', false, null, undefined)).toBe('default');
  });

  it('returns selected when this option was chosen', () => {
    expect(optionColor('A', false, 'A', undefined)).toBe('selected');
  });

  it('returns disabled for other options after answering', () => {
    expect(optionColor('B', false, 'A', undefined)).toBe('disabled');
  });

  it('marks correct answer green in result', () => {
    expect(optionColor('A', true, 'B', 'A')).toBe('correct');
  });

  it('marks selected wrong answer red in result', () => {
    expect(optionColor('B', true, 'B', 'A')).toBe('wrong');
  });

  it('marks unselected wrong options neutral in result', () => {
    expect(optionColor('C', true, 'B', 'A')).toBe('neutral');
  });
});
