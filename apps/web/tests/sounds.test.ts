import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AudioContext since jsdom doesn't support it
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { setValueAtTime: vi.fn() },
  type: 'sine',
};
const mockGain = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};
const mockCtx = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  currentTime: 0,
};

vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

describe('sounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset ctx singleton between tests by resetting module
  });

  it('playCorrect creates oscillators', async () => {
    const { playCorrect } = await import('../src/lib/sounds');
    playCorrect();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it('playWrong creates oscillators', async () => {
    const { playWrong } = await import('../src/lib/sounds');
    playWrong();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('playTimerTick creates an oscillator', async () => {
    const { playTimerTick } = await import('../src/lib/sounds');
    playTimerTick();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('playGameOver creates multiple oscillators', async () => {
    const { playGameOver } = await import('../src/lib/sounds');
    playGameOver();
    expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
