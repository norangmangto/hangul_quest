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

const KOREAN_VERBS_TEMPLATES: Template[] = [
  { prompt: '🏃', promptType: 'emoji', answer: '달리다', hint: '달리다 — "to run"' },
  { prompt: '🍽️', promptType: 'emoji', answer: '먹다', hint: '먹다 — "to eat"' },
  { prompt: '🥤', promptType: 'emoji', answer: '마시다', hint: '마시다 — "to drink"' },
  { prompt: '😴', promptType: 'emoji', answer: '자다', hint: '자다 — "to sleep"' },
  { prompt: '📖', promptType: 'emoji', answer: '읽다', hint: '읽다 — "to read"' },
  { prompt: '✍️', promptType: 'emoji', answer: '쓰다', hint: '쓰다 — "to write"' },
  { prompt: '👂', promptType: 'emoji', answer: '듣다', hint: '듣다 — "to listen"' },
  { prompt: '👀', promptType: 'emoji', answer: '보다', hint: '보다 — "to see"' },
  { prompt: '🗣️', promptType: 'emoji', answer: '말하다', hint: '말하다 — "to speak"' },
  { prompt: '🚶', promptType: 'emoji', answer: '걷다', hint: '걷다 — "to walk"' },
  { prompt: '🏊', promptType: 'emoji', answer: '수영하다', hint: '수영하다 — "to swim"' },
  { prompt: '🎤', promptType: 'emoji', answer: '노래하다', hint: '노래하다 — "to sing"' },
  { prompt: '💃', promptType: 'emoji', answer: '춤추다', hint: '춤추다 — "to dance"' },
  { prompt: '🍳', promptType: 'emoji', answer: '요리하다', hint: '요리하다 — "to cook"' },
  { prompt: '📝', promptType: 'emoji', answer: '공부하다', hint: '공부하다 — "to study"' },
  { prompt: '🎮', promptType: 'emoji', answer: '놀다', hint: '놀다 — "to play"' },
  { prompt: '🛒', promptType: 'emoji', answer: '사다', hint: '사다 — "to buy"' },
  { prompt: '🎁', promptType: 'emoji', answer: '주다', hint: '주다 — "to give"' },
  { prompt: '😂', promptType: 'emoji', answer: '웃다', hint: '웃다 — "to laugh/smile"' },
  { prompt: '😢', promptType: 'emoji', answer: '울다', hint: '울다 — "to cry"' },
  { prompt: '❤️', promptType: 'emoji', answer: '사랑하다', hint: '사랑하다 — "to love"' },
  { prompt: '🤝', promptType: 'emoji', answer: '만나다', hint: '만나다 — "to meet"' },
  { prompt: '✈️', promptType: 'emoji', answer: '여행하다', hint: '여행하다 — "to travel"' },
  { prompt: '🚪', promptType: 'emoji', answer: '열다', hint: '열다 — "to open"' },
];

const KOREAN_TO_ENGLISH_TEMPLATES: Template[] = [
  { prompt: '안녕하세요', promptType: 'text', answer: 'Hello', hint: 'Formal greeting' },
  { prompt: '감사합니다', promptType: 'text', answer: 'Thank you', hint: 'Formal thanks' },
  { prompt: '미안합니다', promptType: 'text', answer: 'Sorry', hint: 'Formal apology' },
  { prompt: '네', promptType: 'text', answer: 'Yes' },
  { prompt: '아니요', promptType: 'text', answer: 'No' },
  { prompt: '물', promptType: 'text', answer: 'Water' },
  { prompt: '불', promptType: 'text', answer: 'Fire' },
  { prompt: '태양', promptType: 'text', answer: 'Sun' },
  { prompt: '달', promptType: 'text', answer: 'Moon', hint: '달 also means "month"' },
  { prompt: '별', promptType: 'text', answer: 'Star' },
  { prompt: '사람', promptType: 'text', answer: 'Person' },
  { prompt: '친구', promptType: 'text', answer: 'Friend' },
  { prompt: '가족', promptType: 'text', answer: 'Family' },
  { prompt: '집', promptType: 'text', answer: 'House' },
  { prompt: '음식', promptType: 'text', answer: 'Food' },
  { prompt: '사랑', promptType: 'text', answer: 'Love' },
  { prompt: '시간', promptType: 'text', answer: 'Time' },
  { prompt: '돈', promptType: 'text', answer: 'Money' },
  { prompt: '학교', promptType: 'text', answer: 'School' },
  { prompt: '크다', promptType: 'text', answer: 'Big' },
  { prompt: '작다', promptType: 'text', answer: 'Small' },
  { prompt: '좋다', promptType: 'text', answer: 'Good' },
  { prompt: '빠르다', promptType: 'text', answer: 'Fast' },
  { prompt: '행복하다', promptType: 'text', answer: 'Happy' },
];

const KOREAN_NUMBERS_TEMPLATES: Template[] = [
  { prompt: '1', promptType: 'text', answer: '하나', hint: 'Native Korean — used for counting objects' },
  { prompt: '2', promptType: 'text', answer: '둘' },
  { prompt: '3', promptType: 'text', answer: '셋' },
  { prompt: '4', promptType: 'text', answer: '넷' },
  { prompt: '5', promptType: 'text', answer: '다섯' },
  { prompt: '6', promptType: 'text', answer: '여섯' },
  { prompt: '7', promptType: 'text', answer: '일곱' },
  { prompt: '8', promptType: 'text', answer: '여덟' },
  { prompt: '9', promptType: 'text', answer: '아홉' },
  { prompt: '10', promptType: 'text', answer: '열', hint: 'Used for age, hours' },
  { prompt: '①', promptType: 'text', answer: '일', hint: 'Sino-Korean — used for dates, money' },
  { prompt: '②', promptType: 'text', answer: '이' },
  { prompt: '③', promptType: 'text', answer: '삼' },
  { prompt: '④', promptType: 'text', answer: '사', hint: '4 is considered unlucky in Korea' },
  { prompt: '⑤', promptType: 'text', answer: '오' },
  { prompt: '⑥', promptType: 'text', answer: '육' },
  { prompt: '⑦', promptType: 'text', answer: '칠' },
  { prompt: '⑧', promptType: 'text', answer: '팔' },
  { prompt: '⑨', promptType: 'text', answer: '구' },
  { prompt: '⑩', promptType: 'text', answer: '십' },
];

const KOREAN_SENTENCES_TEMPLATES: Template[] = [
  { prompt: '나는 ___을 먹어요.', promptType: 'text', answer: '밥', hint: '나는 = I, 먹어요 = eat' },
  { prompt: '저는 ___을 마셔요.', promptType: 'text', answer: '물', hint: '저는 = I (humble), 마셔요 = drink' },
  { prompt: '저는 ___에 가요.', promptType: 'text', answer: '학교', hint: '에 가요 = going to' },
  { prompt: '제 ___는 착해요.', promptType: 'text', answer: '친구', hint: '착해요 = is kind' },
  { prompt: '우리 집에 ___가 있어요.', promptType: 'text', answer: '강아지', hint: '있어요 = there is' },
  { prompt: '___을 읽어요.', promptType: 'text', answer: '책', hint: '읽어요 = read' },
  { prompt: '한국어를 ___해요.', promptType: 'text', answer: '공부', hint: '공부해요 = study' },
  { prompt: '음악을 ___어요.', promptType: 'text', answer: '들', hint: '들어요 = listen' },
  { prompt: '당신을 ___해요.', promptType: 'text', answer: '사랑', hint: '사랑해요 = I love you' },
  { prompt: '저는 ___해요.', promptType: 'text', answer: '행복', hint: '행복해요 = I am happy' },
  { prompt: '많이 ___해요.', promptType: 'text', answer: '피곤', hint: '피곤해요 = tired' },
  { prompt: '오늘 날씨가 ___요.', promptType: 'text', answer: '추워', hint: '추워요 = it\'s cold' },
  { prompt: '꽃이 ___요.', promptType: 'text', answer: '예뻐', hint: '예뻐요 = pretty' },
  { prompt: '기차가 ___요.', promptType: 'text', answer: '빨라', hint: '빨라요 = fast' },
  { prompt: '코끼리가 ___요.', promptType: 'text', answer: '커', hint: '커요 = big' },
  { prompt: '___이 자고 있어요.', promptType: 'text', answer: '고양이', hint: '자고 있어요 = is sleeping' },
  { prompt: '___이 없어요.', promptType: 'text', answer: '돈', hint: '없어요 = don\'t have' },
  { prompt: '___로 전화해요.', promptType: 'text', answer: '핸드폰', hint: '전화해요 = call' },
];

const CATEGORY_MAP: Record<string, { templates: Template[]; hint: string }> = {
  KOREAN_WORDS: { templates: KOREAN_WORDS_TEMPLATES, hint: 'What is this in Korean?' },
  HANGUL_LETTERS: { templates: HANGUL_LETTERS_TEMPLATES, hint: 'Romanize this letter' },
  KOREAN_VERBS: { templates: KOREAN_VERBS_TEMPLATES, hint: 'What is this verb in Korean?' },
  KOREAN_TO_ENGLISH: { templates: KOREAN_TO_ENGLISH_TEMPLATES, hint: 'Translate to English' },
  KOREAN_NUMBERS: { templates: KOREAN_NUMBERS_TEMPLATES, hint: 'What is this number in Korean?' },
  KOREAN_SENTENCES: { templates: KOREAN_SENTENCES_TEMPLATES, hint: 'Fill in the blank' },
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
