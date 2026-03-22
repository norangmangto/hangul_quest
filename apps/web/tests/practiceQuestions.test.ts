import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generatePracticeQuestions } from '../src/lib/practiceQuestions';
import { recordWrong, clearWeakSpots, getWeakSpots } from '../src/lib/weakSpots';

// ─── generatePracticeQuestions ────────────────────────────────────────────────

describe('generatePracticeQuestions — all 6 categories', () => {
  const categories = [
    'KOREAN_WORDS',
    'HANGUL_LETTERS',
    'KOREAN_VERBS',
    'KOREAN_TO_ENGLISH',
    'KOREAN_NUMBERS',
    'KOREAN_SENTENCES',
  ] as const;

  for (const cat of categories) {
    describe(cat, () => {
      it('generates the requested number of questions', () => {
        const qs = generatePracticeQuestions(cat, 10);
        expect(qs).toHaveLength(10);
      });

      it('every question has required fields', () => {
        const qs = generatePracticeQuestions(cat, 5);
        for (const q of qs) {
          expect(q.id).toBeTruthy();
          expect(q.prompt).toBeTruthy();
          expect(['emoji', 'hangul', 'romanization', 'text']).toContain(q.promptType);
          expect(q.answer).toBeTruthy();
          expect(q.options).toHaveLength(4);
          expect(q.categoryHint).toBeTruthy();
          expect(q.category).toBe(cat);
        }
      });

      it('correct answer is always one of the options', () => {
        const qs = generatePracticeQuestions(cat, 10);
        for (const q of qs) {
          expect(q.options).toContain(q.answer);
        }
      });

      it('options contain no duplicates', () => {
        const qs = generatePracticeQuestions(cat, 10);
        for (const q of qs) {
          expect(new Set(q.options).size).toBe(q.options.length);
        }
      });

      it('shuffles questions differently on repeated calls', () => {
        const a = generatePracticeQuestions(cat, 10).map(q => q.id);
        const b = generatePracticeQuestions(cat, 10).map(q => q.id);
        // With 10+ items the chance of identical order is astronomically small
        const atLeastOneDiffers = a.some((id, i) => id !== b[i]);
        // Note: this can theoretically fail (1/(n!) chance) — acceptable flakiness
        expect(atLeastOneDiffers || a.length <= 1).toBe(true);
      });
    });
  }

  it('falls back to KOREAN_WORDS for unknown category', () => {
    const qs = generatePracticeQuestions('UNKNOWN_CATEGORY', 5);
    expect(qs).toHaveLength(5);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
    }
  });

  it('caps count at pool size without throwing', () => {
    // HANGUL_LETTERS has 24 templates; asking for more should not throw
    expect(() => generatePracticeQuestions('HANGUL_LETTERS', 100)).not.toThrow();
  });
});

// ─── weak-spots integration ────────────────────────────────────────────────────

describe('practiceQuestions weak-spot filtering', () => {
  beforeEach(() => clearWeakSpots());
  afterEach(() => clearWeakSpots());

  it('recordWrong stores an entry', () => {
    recordWrong('🐱', '고양이', 'KOREAN_WORDS');
    const spots = getWeakSpots();
    expect(spots).toHaveLength(1);
    expect(spots[0].prompt).toBe('🐱');
    expect(spots[0].answer).toBe('고양이');
    expect(spots[0].category).toBe('KOREAN_WORDS');
  });

  it('wrongCount increments on repeated misses', () => {
    recordWrong('🐱', '고양이', 'KOREAN_WORDS');
    recordWrong('🐱', '고양이', 'KOREAN_WORDS');
    const spots = getWeakSpots();
    expect(spots[0].wrongCount).toBe(2);
  });

  it('getWeakSpots sorts by wrongCount descending', () => {
    recordWrong('🐱', '고양이', 'KOREAN_WORDS');
    recordWrong('🐱', '고양이', 'KOREAN_WORDS');
    recordWrong('🐶', '강아지', 'KOREAN_WORDS');
    const spots = getWeakSpots();
    expect(spots[0].wrongCount).toBeGreaterThanOrEqual(spots[1].wrongCount);
  });

  it('weak spots for new categories (KOREAN_VERBS) are recorded correctly', () => {
    recordWrong('🏃', '달리다', 'KOREAN_VERBS');
    const spots = getWeakSpots();
    const entry = spots.find(s => s.category === 'KOREAN_VERBS');
    expect(entry).toBeDefined();
    expect(entry?.answer).toBe('달리다');
  });
});
