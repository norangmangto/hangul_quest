import { describe, it, expect } from 'vitest';

// Pure speed-bonus formula extracted from PlayerGame / RoomManager.
// fraction = elapsed / (timeLimit * 1000)
// bonus    = fraction < 0.33 → +2 | fraction < 0.66 → +1 | else → 0
function calcSpeedBonus(elapsedMs: number, timeLimitSec: number): number {
  const fraction = elapsedMs / (timeLimitSec * 1000);
  return fraction < 0.33 ? 2 : fraction < 0.66 ? 1 : 0;
}

describe('speed bonus calculation', () => {
  const TIME_LIMIT = 15; // seconds (default)

  it('awards +2 when answered in first 33% of time', () => {
    // 33% of 15s = 4.95s → anything under 4950ms
    expect(calcSpeedBonus(1000, TIME_LIMIT)).toBe(2);
    expect(calcSpeedBonus(4000, TIME_LIMIT)).toBe(2);
    expect(calcSpeedBonus(4949, TIME_LIMIT)).toBe(2);
  });

  it('awards +1 when answered between 33% and 66% of time', () => {
    // 33–66% of 15s = 4950ms–9900ms
    expect(calcSpeedBonus(5000, TIME_LIMIT)).toBe(1);
    expect(calcSpeedBonus(7500, TIME_LIMIT)).toBe(1);
    expect(calcSpeedBonus(9899, TIME_LIMIT)).toBe(1);
  });

  it('awards +0 when answered in last third of time', () => {
    expect(calcSpeedBonus(9900, TIME_LIMIT)).toBe(0);
    expect(calcSpeedBonus(12000, TIME_LIMIT)).toBe(0);
    expect(calcSpeedBonus(15000, TIME_LIMIT)).toBe(0);
  });

  it('awards +0 when answered exactly at the boundary (66%)', () => {
    // 66% of 15s = 9900ms — boundary is exclusive for +1
    expect(calcSpeedBonus(9900, TIME_LIMIT)).toBe(0);
  });

  it('awards +2 for instant answers (0ms elapsed)', () => {
    expect(calcSpeedBonus(0, TIME_LIMIT)).toBe(2);
  });

  it('scales correctly with different time limits', () => {
    // 30-second round: 33% = 9900ms
    expect(calcSpeedBonus(5000, 30)).toBe(2);
    expect(calcSpeedBonus(12000, 30)).toBe(1);
    expect(calcSpeedBonus(25000, 30)).toBe(0);
  });

  it('awards +0 for answers after time limit', () => {
    expect(calcSpeedBonus(16000, TIME_LIMIT)).toBe(0);
    expect(calcSpeedBonus(30000, TIME_LIMIT)).toBe(0);
  });
});
