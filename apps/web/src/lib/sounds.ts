// Web Audio API sound effects — no external files required

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gainValue = 0.3,
  delay = 0,
): void {
  const context = getCtx();
  if (!context) return;

  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.connect(gain);
  gain.connect(context.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, context.currentTime + delay);

  gain.gain.setValueAtTime(0, context.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainValue, context.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);

  osc.start(context.currentTime + delay);
  osc.stop(context.currentTime + delay + duration + 0.05);
}

export function playCorrect(): void {
  // Happy ascending two-note chord
  playTone(523, 'sine', 0.15, 0.25);      // C5
  playTone(659, 'sine', 0.25, 0.25, 0.1); // E5
  playTone(784, 'sine', 0.3, 0.2, 0.2);   // G5
}

export function playWrong(): void {
  // Low descending buzz
  playTone(220, 'sawtooth', 0.12, 0.15);
  playTone(180, 'sawtooth', 0.15, 0.15, 0.12);
}

export function playTimerTick(): void {
  playTone(880, 'square', 0.05, 0.08);
}

export function playRoundEnd(): void {
  // Descending fanfare
  playTone(440, 'sine', 0.12, 0.2);
  playTone(370, 'sine', 0.12, 0.2, 0.13);
  playTone(330, 'sine', 0.2, 0.2, 0.26);
}

export function playGameOver(): void {
  // Short celebratory melody
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => playTone(freq, 'sine', 0.25, 0.25, i * 0.15));
}
