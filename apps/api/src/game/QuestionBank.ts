import type { GameCategory, PublicQuestion } from '@hangul-quest/shared';

interface QuestionTemplate {
  id: string;
  category: GameCategory;
  prompt: string;
  promptType: 'emoji' | 'hangul' | 'romanization';
  categoryHint: string;
  correctAnswer: string;
}

const KOREAN_WORDS: QuestionTemplate[] = [
  // Animals 동물
  { id: 'w_elephant',   category: 'KOREAN_WORDS', prompt: '🐘', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '코끼리' },
  { id: 'w_horse',      category: 'KOREAN_WORDS', prompt: '🐴', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '말' },
  { id: 'w_lion',       category: 'KOREAN_WORDS', prompt: '🦁', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '사자' },
  { id: 'w_tiger',      category: 'KOREAN_WORDS', prompt: '🐯', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '호랑이' },
  { id: 'w_monkey',     category: 'KOREAN_WORDS', prompt: '🐒', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '원숭이' },
  { id: 'w_rabbit',     category: 'KOREAN_WORDS', prompt: '🐰', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '토끼' },
  { id: 'w_dog',        category: 'KOREAN_WORDS', prompt: '🐕', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '강아지' },
  { id: 'w_cat',        category: 'KOREAN_WORDS', prompt: '🐱', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '고양이' },
  { id: 'w_pig',        category: 'KOREAN_WORDS', prompt: '🐷', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '돼지' },
  { id: 'w_cow',        category: 'KOREAN_WORDS', prompt: '🐄', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '소' },
  { id: 'w_chicken',    category: 'KOREAN_WORDS', prompt: '🐔', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '닭' },
  { id: 'w_fish',       category: 'KOREAN_WORDS', prompt: '🐟', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '물고기' },
  { id: 'w_bear',       category: 'KOREAN_WORDS', prompt: '🐻', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '곰' },
  { id: 'w_panda',      category: 'KOREAN_WORDS', prompt: '🐼', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '판다' },
  { id: 'w_penguin',    category: 'KOREAN_WORDS', prompt: '🐧', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '펭귄' },
  { id: 'w_bird',       category: 'KOREAN_WORDS', prompt: '🐦', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '새' },
  { id: 'w_butterfly',  category: 'KOREAN_WORDS', prompt: '🦋', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '나비' },
  // Vehicles 탈것
  { id: 'w_car',        category: 'KOREAN_WORDS', prompt: '🚗', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '자동차' },
  { id: 'w_police_car', category: 'KOREAN_WORDS', prompt: '🚓', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '경찰차' },
  { id: 'w_fire_truck', category: 'KOREAN_WORDS', prompt: '🚒', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '소방차' },
  { id: 'w_ambulance',  category: 'KOREAN_WORDS', prompt: '🚑', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '구급차' },
  { id: 'w_bus',        category: 'KOREAN_WORDS', prompt: '🚌', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '버스' },
  { id: 'w_train',      category: 'KOREAN_WORDS', prompt: '🚂', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '기차' },
  { id: 'w_airplane',   category: 'KOREAN_WORDS', prompt: '✈️', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '비행기' },
  { id: 'w_ship',       category: 'KOREAN_WORDS', prompt: '🚢', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '배' },
  { id: 'w_bicycle',    category: 'KOREAN_WORDS', prompt: '🚲', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '자전거' },
  { id: 'w_helicopter', category: 'KOREAN_WORDS', prompt: '🚁', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '헬리콥터' },
  // Fruits & Food 과일과 음식
  { id: 'w_apple',      category: 'KOREAN_WORDS', prompt: '🍎', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '사과' },
  { id: 'w_banana',     category: 'KOREAN_WORDS', prompt: '🍌', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '바나나' },
  { id: 'w_grape',      category: 'KOREAN_WORDS', prompt: '🍇', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '포도' },
  { id: 'w_strawberry', category: 'KOREAN_WORDS', prompt: '🍓', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '딸기' },
  { id: 'w_watermelon', category: 'KOREAN_WORDS', prompt: '🍉', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '수박' },
  { id: 'w_orange',     category: 'KOREAN_WORDS', prompt: '🍊', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '오렌지' },
  { id: 'w_peach',      category: 'KOREAN_WORDS', prompt: '🍑', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '복숭아' },
  { id: 'w_pizza',      category: 'KOREAN_WORDS', prompt: '🍕', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '피자' },
  { id: 'w_ramen',      category: 'KOREAN_WORDS', prompt: '🍜', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '라면' },
  { id: 'w_rice',       category: 'KOREAN_WORDS', prompt: '🍚', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '밥' },
  { id: 'w_cake',       category: 'KOREAN_WORDS', prompt: '🎂', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '케이크' },
  { id: 'w_bread',      category: 'KOREAN_WORDS', prompt: '🍞', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '빵' },
  { id: 'w_icecream',   category: 'KOREAN_WORDS', prompt: '🍦', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '아이스크림' },
  // Nature & Objects 자연과 사물
  { id: 'w_flower',     category: 'KOREAN_WORDS', prompt: '🌸', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '꽃' },
  { id: 'w_tree',       category: 'KOREAN_WORDS', prompt: '🌳', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '나무' },
  { id: 'w_sun',        category: 'KOREAN_WORDS', prompt: '☀️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '태양' },
  { id: 'w_moon',       category: 'KOREAN_WORDS', prompt: '🌙', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '달' },
  { id: 'w_star',       category: 'KOREAN_WORDS', prompt: '⭐', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '별' },
  { id: 'w_sea',        category: 'KOREAN_WORDS', prompt: '🌊', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '바다' },
  { id: 'w_mountain',   category: 'KOREAN_WORDS', prompt: '⛰️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '산' },
  { id: 'w_rain',       category: 'KOREAN_WORDS', prompt: '🌧️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '비' },
  { id: 'w_snow',       category: 'KOREAN_WORDS', prompt: '❄️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '눈' },
  // Places & Daily life
  { id: 'w_house',      category: 'KOREAN_WORDS', prompt: '🏠', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '집' },
  { id: 'w_school',     category: 'KOREAN_WORDS', prompt: '🏫', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '학교' },
  { id: 'w_hospital',   category: 'KOREAN_WORDS', prompt: '🏥', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '병원' },
  { id: 'w_book',       category: 'KOREAN_WORDS', prompt: '📚', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '책' },
  { id: 'w_pencil',     category: 'KOREAN_WORDS', prompt: '✏️', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '연필' },
  { id: 'w_bag',        category: 'KOREAN_WORDS', prompt: '🎒', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '가방' },
  { id: 'w_ball',       category: 'KOREAN_WORDS', prompt: '⚽', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '공' },
  { id: 'w_phone',      category: 'KOREAN_WORDS', prompt: '📱', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '핸드폰' },
  { id: 'w_clock',      category: 'KOREAN_WORDS', prompt: '⏰', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '시계' },
];

// Hangul consonants: show character → pick romanization
const HANGUL_CONSONANTS: QuestionTemplate[] = [
  { id: 'h_g',  category: 'HANGUL_LETTERS', prompt: 'ㄱ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'g/k' },
  { id: 'h_n',  category: 'HANGUL_LETTERS', prompt: 'ㄴ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'n' },
  { id: 'h_d',  category: 'HANGUL_LETTERS', prompt: 'ㄷ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'd/t' },
  { id: 'h_r',  category: 'HANGUL_LETTERS', prompt: 'ㄹ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'r/l' },
  { id: 'h_m',  category: 'HANGUL_LETTERS', prompt: 'ㅁ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'm' },
  { id: 'h_b',  category: 'HANGUL_LETTERS', prompt: 'ㅂ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'b/p' },
  { id: 'h_s',  category: 'HANGUL_LETTERS', prompt: 'ㅅ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 's' },
  { id: 'h_ng', category: 'HANGUL_LETTERS', prompt: 'ㅇ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'ng/-' },
  { id: 'h_j',  category: 'HANGUL_LETTERS', prompt: 'ㅈ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'j' },
  { id: 'h_ch', category: 'HANGUL_LETTERS', prompt: 'ㅊ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'ch' },
  { id: 'h_k',  category: 'HANGUL_LETTERS', prompt: 'ㅋ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'k' },
  { id: 'h_t',  category: 'HANGUL_LETTERS', prompt: 'ㅌ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 't' },
  { id: 'h_p',  category: 'HANGUL_LETTERS', prompt: 'ㅍ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'p' },
  { id: 'h_h',  category: 'HANGUL_LETTERS', prompt: 'ㅎ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'h' },
];

// Hangul vowels: show character → pick romanization
const HANGUL_VOWELS: QuestionTemplate[] = [
  { id: 'h_a',   category: 'HANGUL_LETTERS', prompt: 'ㅏ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'a' },
  { id: 'h_ya',  category: 'HANGUL_LETTERS', prompt: 'ㅑ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'ya' },
  { id: 'h_eo',  category: 'HANGUL_LETTERS', prompt: 'ㅓ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'eo' },
  { id: 'h_yeo', category: 'HANGUL_LETTERS', prompt: 'ㅕ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yeo' },
  { id: 'h_o',   category: 'HANGUL_LETTERS', prompt: 'ㅗ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'o' },
  { id: 'h_yo',  category: 'HANGUL_LETTERS', prompt: 'ㅛ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yo' },
  { id: 'h_u',   category: 'HANGUL_LETTERS', prompt: 'ㅜ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'u' },
  { id: 'h_yu',  category: 'HANGUL_LETTERS', prompt: 'ㅠ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yu' },
  { id: 'h_eu',  category: 'HANGUL_LETTERS', prompt: 'ㅡ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'eu' },
  { id: 'h_i',   category: 'HANGUL_LETTERS', prompt: 'ㅣ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'i' },
];

const ALL_TEMPLATES: QuestionTemplate[] = [
  ...KOREAN_WORDS,
  ...HANGUL_CONSONANTS,
  ...HANGUL_VOWELS,
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: QuestionTemplate, pool: QuestionTemplate[], count: number): string[] {
  const distractors = pool
    .filter(q => q.id !== correct.id && q.correctAnswer !== correct.correctAnswer)
    .map(q => q.correctAnswer);
  return shuffle(distractors).slice(0, count);
}

export function buildQuestion(template: QuestionTemplate, pool: QuestionTemplate[]): { question: PublicQuestion; correctAnswer: string } {
  const distractors = pickDistractors(template, pool, 3);
  const options = shuffle([template.correctAnswer, ...distractors]);
  return {
    question: {
      id: template.id,
      prompt: template.prompt,
      promptType: template.promptType,
      categoryHint: template.categoryHint,
      options,
    },
    correctAnswer: template.correctAnswer,
  };
}

export function generateRoundQuestions(category: GameCategory, count: number): Array<{ question: PublicQuestion; correctAnswer: string }> {
  const pool = ALL_TEMPLATES.filter(t => t.category === category);
  const sameCategoryPool = pool;
  const selected = shuffle(pool).slice(0, count);
  return selected.map(t => buildQuestion(t, sameCategoryPool));
}
