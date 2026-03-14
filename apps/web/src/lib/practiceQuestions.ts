export interface PracticeQuestion {
  id: string;
  prompt: string;
  promptType: 'emoji' | 'hangul' | 'romanization' | 'text';
  answer: string;
  options: string[];
  categoryHint: string;
  category: string;
  hint?: string;
}

// Helper: pick n random items excluding `exclude`
function pickDistractors(pool: string[], exclude: string, n: number): string[] {
  const candidates = pool.filter(x => x !== exclude);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Template {
  prompt: string;
  promptType: 'emoji' | 'hangul' | 'romanization' | 'text';
  answer: string;
  hint?: string;
}

const KOREAN_WORDS_TEMPLATES: Template[] = [
  { prompt: '🐱', promptType: 'emoji', answer: '고양이', hint: '고양이 (go-yang-i)' },
  { prompt: '🐶', promptType: 'emoji', answer: '강아지', hint: '강아지 (gang-a-ji)' },
  { prompt: '🐦', promptType: 'emoji', answer: '새', hint: '새 (sae)' },
  { prompt: '🐟', promptType: 'emoji', answer: '물고기', hint: '물고기 (mul-go-gi)' },
  { prompt: '🐘', promptType: 'emoji', answer: '코끼리', hint: '코끼리 (ko-kki-ri)' },
  { prompt: '🐯', promptType: 'emoji', answer: '호랑이', hint: '호랑이 (ho-rang-i)' },
  { prompt: '🐻', promptType: 'emoji', answer: '곰', hint: '곰 (gom)' },
  { prompt: '🐰', promptType: 'emoji', answer: '토끼', hint: '토끼 (to-kki)' },
  { prompt: '🐸', promptType: 'emoji', answer: '개구리', hint: '개구리 (gae-gu-ri)' },
  { prompt: '🐢', promptType: 'emoji', answer: '거북이', hint: '거북이 (geo-bug-i)' },
  { prompt: '🍎', promptType: 'emoji', answer: '사과', hint: '사과 (sa-gwa)' },
  { prompt: '🍌', promptType: 'emoji', answer: '바나나', hint: '바나나 (ba-na-na)' },
  { prompt: '🍊', promptType: 'emoji', answer: '오렌지', hint: '오렌지 (o-ren-ji)' },
  { prompt: '🍇', promptType: 'emoji', answer: '포도', hint: '포도 (po-do)' },
  { prompt: '🍓', promptType: 'emoji', answer: '딸기', hint: '딸기 (ttal-gi)' },
  { prompt: '🌊', promptType: 'emoji', answer: '바다', hint: '바다 (ba-da)' },
  { prompt: '⛰️', promptType: 'emoji', answer: '산', hint: '산 (san)' },
  { prompt: '🌲', promptType: 'emoji', answer: '나무', hint: '나무 (na-mu)' },
  { prompt: '🌸', promptType: 'emoji', answer: '꽃', hint: '꽃 (kkot)' },
  { prompt: '☀️', promptType: 'emoji', answer: '태양', hint: '태양 (tae-yang)' },
  { prompt: '🚗', promptType: 'emoji', answer: '자동차', hint: '자동차 (ja-dong-cha)' },
  { prompt: '✈️', promptType: 'emoji', answer: '비행기', hint: '비행기 (bi-haeng-gi)' },
  { prompt: '🏠', promptType: 'emoji', answer: '집', hint: '집 (jip)' },
  { prompt: '📚', promptType: 'emoji', answer: '책', hint: '책 (chaek)' },
];

const HANGUL_LETTERS_TEMPLATES: Template[] = [
  { prompt: 'ㄱ', promptType: 'hangul', answer: 'g/k' },
  { prompt: 'ㄴ', promptType: 'hangul', answer: 'n' },
  { prompt: 'ㄷ', promptType: 'hangul', answer: 'd/t' },
  { prompt: 'ㄹ', promptType: 'hangul', answer: 'r/l' },
  { prompt: 'ㅁ', promptType: 'hangul', answer: 'm' },
  { prompt: 'ㅂ', promptType: 'hangul', answer: 'b/p' },
  { prompt: 'ㅅ', promptType: 'hangul', answer: 's' },
  { prompt: 'ㅇ', promptType: 'hangul', answer: 'ng' },
  { prompt: 'ㅈ', promptType: 'hangul', answer: 'j' },
  { prompt: 'ㅊ', promptType: 'hangul', answer: 'ch' },
  { prompt: 'ㅋ', promptType: 'hangul', answer: 'k' },
  { prompt: 'ㅌ', promptType: 'hangul', answer: 't' },
  { prompt: 'ㅍ', promptType: 'hangul', answer: 'p' },
  { prompt: 'ㅎ', promptType: 'hangul', answer: 'h' },
  { prompt: 'ㅏ', promptType: 'hangul', answer: 'a' },
  { prompt: 'ㅓ', promptType: 'hangul', answer: 'eo' },
  { prompt: 'ㅗ', promptType: 'hangul', answer: 'o' },
  { prompt: 'ㅜ', promptType: 'hangul', answer: 'u' },
  { prompt: 'ㅡ', promptType: 'hangul', answer: 'eu' },
  { prompt: 'ㅣ', promptType: 'hangul', answer: 'i' },
  { prompt: 'ㅐ', promptType: 'hangul', answer: 'ae' },
  { prompt: 'ㅔ', promptType: 'hangul', answer: 'e' },
  { prompt: 'ㅛ', promptType: 'hangul', answer: 'yo' },
  { prompt: 'ㅠ', promptType: 'hangul', answer: 'yu' },
];

const CATEGORY_MAP: Record<string, { templates: Template[]; hint: string }> = {
  KOREAN_WORDS: { templates: KOREAN_WORDS_TEMPLATES, hint: 'What is this in Korean?' },
  HANGUL_LETTERS: { templates: HANGUL_LETTERS_TEMPLATES, hint: 'Romanize this letter' },
};

export function generatePracticeQuestions(category: string, count: number): PracticeQuestion[] {
  const entry = CATEGORY_MAP[category] ?? CATEGORY_MAP['KOREAN_WORDS'];
  const templates = entry.templates;
  const allAnswers = templates.map(t => t.answer);

  const shuffled = shuffle(templates).slice(0, count);
  return shuffled.map((t, i) => {
    const distractors = pickDistractors(allAnswers, t.answer, 3);
    const options = shuffle([t.answer, ...distractors]);
    return {
      id: `practice-${i}-${t.prompt}`,
      prompt: t.prompt,
      promptType: t.promptType,
      answer: t.answer,
      options,
      categoryHint: entry.hint,
      category,
      hint: t.hint,
    };
  });
}
