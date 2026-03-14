const KEY = 'hq:weakSpots';

interface WeakSpotEntry {
  prompt: string;
  answer: string;
  category: string;
  wrongCount: number;
  lastWrong: number; // unix ms
}

export function recordWrong(prompt: string, answer: string, category: string): void {
  if (typeof window === 'undefined') return;
  const all = getAll();
  const key = `${category}::${prompt}`;
  const existing = all[key];
  all[key] = {
    prompt,
    answer,
    category,
    wrongCount: (existing?.wrongCount ?? 0) + 1,
    lastWrong: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getAll(): Record<string, WeakSpotEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function getWeakSpots(): WeakSpotEntry[] {
  const all = getAll();
  return Object.values(all).sort((a, b) => b.wrongCount - a.wrongCount);
}

export function clearWeakSpots(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
