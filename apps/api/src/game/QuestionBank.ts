import type { GameCategory, PublicQuestion } from '@hangul-quest/shared';

interface QuestionTemplate {
  id: string;
  category: GameCategory;
  prompt: string;
  promptType: 'emoji' | 'hangul' | 'romanization' | 'text';
  categoryHint: string;
  correctAnswer: string;
  hint?: string;
}

const KOREAN_WORDS: QuestionTemplate[] = [
  // Animals 동물
  { id: 'w_elephant',   category: 'KOREAN_WORDS', prompt: '🐘', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '코끼리', hint: '코 (nose) + 끼리 — the animal with a long nose' },
  { id: 'w_horse',      category: 'KOREAN_WORDS', prompt: '🐴', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '말', hint: '말 also means "word/speech" — context matters!' },
  { id: 'w_lion',       category: 'KOREAN_WORDS', prompt: '🦁', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '사자', hint: 'Think "SAH-jah" — the king of the jungle' },
  { id: 'w_tiger',      category: 'KOREAN_WORDS', prompt: '🐯', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '호랑이', hint: 'Korea\'s national animal! "HO-rang-ee"' },
  { id: 'w_monkey',     category: 'KOREAN_WORDS', prompt: '🐒', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '원숭이' },
  { id: 'w_rabbit',     category: 'KOREAN_WORDS', prompt: '🐰', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '토끼', hint: '"TOH-kki" — the rabbit in Korean folklore lives on the moon' },
  { id: 'w_dog',        category: 'KOREAN_WORDS', prompt: '🐕', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '강아지', hint: '강아지 is a puppy/dog. 개 (gae) is also used for dog' },
  { id: 'w_cat',        category: 'KOREAN_WORDS', prompt: '🐱', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '고양이', hint: '"GO-yang-ee" — sounds like it\'s calling itself!' },
  { id: 'w_pig',        category: 'KOREAN_WORDS', prompt: '🐷', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '돼지', hint: 'Dreaming of 돼지 is considered good luck in Korea' },
  { id: 'w_cow',        category: 'KOREAN_WORDS', prompt: '🐄', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '소' },
  { id: 'w_chicken',    category: 'KOREAN_WORDS', prompt: '🐔', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '닭', hint: '닭갈비 (spicy stir-fried chicken) is a famous Korean dish' },
  { id: 'w_fish',       category: 'KOREAN_WORDS', prompt: '🐟', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '물고기', hint: '물 (water) + 고기 (meat) = water-meat = fish!' },
  { id: 'w_bear',       category: 'KOREAN_WORDS', prompt: '🐻', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '곰', hint: 'In the legend of Dangun, a bear became the first Korean woman' },
  { id: 'w_panda',      category: 'KOREAN_WORDS', prompt: '🐼', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '판다' },
  { id: 'w_penguin',    category: 'KOREAN_WORDS', prompt: '🐧', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '펭귄' },
  { id: 'w_bird',       category: 'KOREAN_WORDS', prompt: '🐦', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '새' },
  { id: 'w_butterfly',  category: 'KOREAN_WORDS', prompt: '🦋', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '나비', hint: '나비 — appears in many Korean songs and poems' },
  { id: 'w_turtle',     category: 'KOREAN_WORDS', prompt: '🐢', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '거북이' },
  { id: 'w_frog',       category: 'KOREAN_WORDS', prompt: '🐸', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '개구리', hint: 'The Korean frog story: a disobedient frog who only listened too late' },
  { id: 'w_sheep',      category: 'KOREAN_WORDS', prompt: '🐑', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '양' },
  { id: 'w_duck',       category: 'KOREAN_WORDS', prompt: '🦆', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '오리', hint: '오리 also means "5 li" (a unit of distance) — same sound, different meaning!' },
  { id: 'w_fox',        category: 'KOREAN_WORDS', prompt: '🦊', promptType: 'emoji', categoryHint: '동물 (Animal)',   correctAnswer: '여우', hint: '여우 is also slang for a cunning/sly person' },
  // Vehicles 탈것
  { id: 'w_car',        category: 'KOREAN_WORDS', prompt: '🚗', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '자동차', hint: '자동 (automatic) + 차 (vehicle) = automobile' },
  { id: 'w_police_car', category: 'KOREAN_WORDS', prompt: '🚓', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '경찰차', hint: '경찰 (police) + 차 (car) = police car' },
  { id: 'w_fire_truck', category: 'KOREAN_WORDS', prompt: '🚒', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '소방차', hint: '소방 (firefighting) + 차 (car) = fire truck' },
  { id: 'w_ambulance',  category: 'KOREAN_WORDS', prompt: '🚑', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '구급차', hint: '구급 (emergency aid) + 차 (car)' },
  { id: 'w_bus',        category: 'KOREAN_WORDS', prompt: '🚌', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '버스' },
  { id: 'w_train',      category: 'KOREAN_WORDS', prompt: '🚂', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '기차', hint: '기차 — KTX is Korea\'s famous high-speed train' },
  { id: 'w_airplane',   category: 'KOREAN_WORDS', prompt: '✈️', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '비행기', hint: '비행 (flight) + 기 (machine) = airplane' },
  { id: 'w_ship',       category: 'KOREAN_WORDS', prompt: '🚢', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '배', hint: '배 also means "stomach/belly" — same sound!' },
  { id: 'w_bicycle',    category: 'KOREAN_WORDS', prompt: '🚲', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '자전거', hint: '자전거 — 자전 means "self-rotating"' },
  { id: 'w_helicopter', category: 'KOREAN_WORDS', prompt: '🚁', promptType: 'emoji', categoryHint: '탈것 (Vehicle)', correctAnswer: '헬리콥터' },
  // Fruits & Food 과일과 음식
  { id: 'w_apple',      category: 'KOREAN_WORDS', prompt: '🍎', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '사과', hint: '사과 also means "apology/sorry" — same word!' },
  { id: 'w_banana',     category: 'KOREAN_WORDS', prompt: '🍌', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '바나나' },
  { id: 'w_grape',      category: 'KOREAN_WORDS', prompt: '🍇', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '포도' },
  { id: 'w_strawberry', category: 'KOREAN_WORDS', prompt: '🍓', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '딸기' },
  { id: 'w_watermelon', category: 'KOREAN_WORDS', prompt: '🍉', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '수박', hint: '수박 — Korea\'s favorite summer fruit' },
  { id: 'w_orange',     category: 'KOREAN_WORDS', prompt: '🍊', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '오렌지' },
  { id: 'w_peach',      category: 'KOREAN_WORDS', prompt: '🍑', promptType: 'emoji', categoryHint: '과일 (Fruit)',   correctAnswer: '복숭아' },
  { id: 'w_pizza',      category: 'KOREAN_WORDS', prompt: '🍕', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '피자' },
  { id: 'w_ramen',      category: 'KOREAN_WORDS', prompt: '🍜', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '라면', hint: '라면 is Korea\'s beloved instant noodle — billions eaten per year!' },
  { id: 'w_rice',       category: 'KOREAN_WORDS', prompt: '🍚', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '밥', hint: '밥 also informally means "meal" — 밥 먹었어요? means "Did you eat?"' },
  { id: 'w_cake',       category: 'KOREAN_WORDS', prompt: '🎂', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '케이크' },
  { id: 'w_bread',      category: 'KOREAN_WORDS', prompt: '🍞', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '빵', hint: 'Borrowed from Portuguese "pão" via Japan' },
  { id: 'w_icecream',   category: 'KOREAN_WORDS', prompt: '🍦', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '아이스크림' },
  { id: 'w_sushi',      category: 'KOREAN_WORDS', prompt: '🍣', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '초밥', hint: '초 (vinegar) + 밥 (rice) = sushi rice' },
  { id: 'w_hamburger',  category: 'KOREAN_WORDS', prompt: '🍔', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '햄버거' },
  { id: 'w_egg',        category: 'KOREAN_WORDS', prompt: '🥚', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '달걀', hint: '달걀 or 계란 (gyeran) — both mean egg!' },
  { id: 'w_milk',       category: 'KOREAN_WORDS', prompt: '🥛', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '우유' },
  { id: 'w_coffee',     category: 'KOREAN_WORDS', prompt: '☕', promptType: 'emoji', categoryHint: '음식 (Food)',    correctAnswer: '커피', hint: 'Korea has one of the highest coffee consumption rates in Asia' },
  // Nature 자연
  { id: 'w_flower',     category: 'KOREAN_WORDS', prompt: '🌸', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '꽃', hint: 'Mugunghwa (무궁화) is Korea\'s national flower' },
  { id: 'w_tree',       category: 'KOREAN_WORDS', prompt: '🌳', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '나무' },
  { id: 'w_sun',        category: 'KOREAN_WORDS', prompt: '☀️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '태양', hint: '해 (hae) is also used for sun in everyday speech' },
  { id: 'w_moon',       category: 'KOREAN_WORDS', prompt: '🌙', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '달', hint: '달 also means "month" — the lunar calendar connection!' },
  { id: 'w_star',       category: 'KOREAN_WORDS', prompt: '⭐', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '별' },
  { id: 'w_sea',        category: 'KOREAN_WORDS', prompt: '🌊', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '바다' },
  { id: 'w_mountain',   category: 'KOREAN_WORDS', prompt: '⛰️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '산', hint: 'Hallasan (한라산) on Jeju Island is Korea\'s highest peak' },
  { id: 'w_rain',       category: 'KOREAN_WORDS', prompt: '🌧️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '비' },
  { id: 'w_snow',       category: 'KOREAN_WORDS', prompt: '❄️', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '눈', hint: '눈 also means "eye" — same pronunciation!' },
  { id: 'w_fire',       category: 'KOREAN_WORDS', prompt: '🔥', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '불' },
  { id: 'w_wind',       category: 'KOREAN_WORDS', prompt: '💨', promptType: 'emoji', categoryHint: '자연 (Nature)',  correctAnswer: '바람', hint: '바람 also means "wish/hope" in some contexts' },
  // Places & Objects
  { id: 'w_house',      category: 'KOREAN_WORDS', prompt: '🏠', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '집' },
  { id: 'w_school',     category: 'KOREAN_WORDS', prompt: '🏫', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '학교', hint: '학 (study) + 교 (teach) = school' },
  { id: 'w_hospital',   category: 'KOREAN_WORDS', prompt: '🏥', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '병원', hint: '병 (illness) + 원 (institution) = hospital' },
  { id: 'w_store',      category: 'KOREAN_WORDS', prompt: '🏪', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '가게' },
  { id: 'w_bank',       category: 'KOREAN_WORDS', prompt: '🏦', promptType: 'emoji', categoryHint: '장소 (Place)',   correctAnswer: '은행', hint: '은행 also means "ginkgo tree" — same word!' },
  { id: 'w_book',       category: 'KOREAN_WORDS', prompt: '📚', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '책' },
  { id: 'w_pencil',     category: 'KOREAN_WORDS', prompt: '✏️', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '연필', hint: '연 (lead/soft) + 필 (pen) = pencil' },
  { id: 'w_bag',        category: 'KOREAN_WORDS', prompt: '🎒', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '가방' },
  { id: 'w_ball',       category: 'KOREAN_WORDS', prompt: '⚽', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '공' },
  { id: 'w_phone',      category: 'KOREAN_WORDS', prompt: '📱', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '핸드폰', hint: '핸드폰 is the informal term; 휴대폰 is more formal' },
  { id: 'w_clock',      category: 'KOREAN_WORDS', prompt: '⏰', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '시계', hint: '시 (time/hour) + 계 (machine) = clock' },
  { id: 'w_key',        category: 'KOREAN_WORDS', prompt: '🔑', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '열쇠', hint: '열다 (to open) + 쇠 (metal) = key!' },
  { id: 'w_mirror',     category: 'KOREAN_WORDS', prompt: '🪞', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '거울' },
  { id: 'w_chair',      category: 'KOREAN_WORDS', prompt: '🪑', promptType: 'emoji', categoryHint: '사물 (Object)',  correctAnswer: '의자' },
];

// Korean verbs: emoji prompt → Korean verb (dictionary form)
const KOREAN_VERBS: QuestionTemplate[] = [
  { id: 'v_run',     category: 'KOREAN_VERBS', prompt: '🏃', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '달리다', hint: '달리다 — present tense: 달려요' },
  { id: 'v_eat',     category: 'KOREAN_VERBS', prompt: '🍽️', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '먹다', hint: '먹다 — one of the first verbs every learner needs!' },
  { id: 'v_drink',   category: 'KOREAN_VERBS', prompt: '🥤', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '마시다' },
  { id: 'v_sleep',   category: 'KOREAN_VERBS', prompt: '😴', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '자다', hint: '자다 — 잘 자요 means "sleep well!"' },
  { id: 'v_read',    category: 'KOREAN_VERBS', prompt: '📖', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '읽다' },
  { id: 'v_write',   category: 'KOREAN_VERBS', prompt: '✍️', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '쓰다', hint: '쓰다 also means "to wear (a hat)" or "to be bitter" — context!' },
  { id: 'v_listen',  category: 'KOREAN_VERBS', prompt: '👂', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '듣다' },
  { id: 'v_see',     category: 'KOREAN_VERBS', prompt: '👀', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '보다', hint: '보다 also means "to try" or "compared to" in different contexts' },
  { id: 'v_speak',   category: 'KOREAN_VERBS', prompt: '🗣️', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '말하다' },
  { id: 'v_walk',    category: 'KOREAN_VERBS', prompt: '🚶', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '걷다' },
  { id: 'v_swim',    category: 'KOREAN_VERBS', prompt: '🏊', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '수영하다', hint: '수영 (swimming) + 하다 (to do) — many activities use 하다!' },
  { id: 'v_sing',    category: 'KOREAN_VERBS', prompt: '🎤', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '노래하다', hint: 'Koreans love 노래방 (karaoke rooms)!' },
  { id: 'v_dance',   category: 'KOREAN_VERBS', prompt: '💃', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '춤추다' },
  { id: 'v_cook',    category: 'KOREAN_VERBS', prompt: '🍳', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '요리하다' },
  { id: 'v_study',   category: 'KOREAN_VERBS', prompt: '📝', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '공부하다', hint: '공부 — every Korean student knows this word!' },
  { id: 'v_work',    category: 'KOREAN_VERBS', prompt: '💼', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '일하다' },
  { id: 'v_play',    category: 'KOREAN_VERBS', prompt: '🎮', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '놀다' },
  { id: 'v_buy',     category: 'KOREAN_VERBS', prompt: '🛒', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '사다' },
  { id: 'v_give',    category: 'KOREAN_VERBS', prompt: '🎁', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '주다' },
  { id: 'v_sit',     category: 'KOREAN_VERBS', prompt: '🪑', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '앉다' },
  { id: 'v_stand',   category: 'KOREAN_VERBS', prompt: '🧍', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '서다' },
  { id: 'v_laugh',   category: 'KOREAN_VERBS', prompt: '😂', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '웃다', hint: '웃다 — 웃어요! means "Smile/Laugh!"' },
  { id: 'v_cry',     category: 'KOREAN_VERBS', prompt: '😢', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '울다' },
  { id: 'v_know',    category: 'KOREAN_VERBS', prompt: '💡', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '알다', hint: '알다 — 알아요 means "I know" in conversation' },
  { id: 'v_love',    category: 'KOREAN_VERBS', prompt: '❤️', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '사랑하다', hint: '사랑해요 — "I love you" in Korean' },
  { id: 'v_meet',    category: 'KOREAN_VERBS', prompt: '🤝', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '만나다', hint: '반갑습니다 is said when you first meet someone' },
  { id: 'v_call',    category: 'KOREAN_VERBS', prompt: '📞', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '전화하다' },
  { id: 'v_travel',  category: 'KOREAN_VERBS', prompt: '✈️', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '여행하다' },
  { id: 'v_open',    category: 'KOREAN_VERBS', prompt: '🚪', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '열다' },
  { id: 'v_close',   category: 'KOREAN_VERBS', prompt: '🔒', promptType: 'emoji', categoryHint: '동사 (Verb)', correctAnswer: '닫다' },
];

// Korean to English
const KOREAN_TO_ENGLISH: QuestionTemplate[] = [
  { id: 'ke_hello',    category: 'KOREAN_TO_ENGLISH', prompt: '안녕하세요', promptType: 'hangul', categoryHint: '인사 (Greeting)', correctAnswer: 'Hello', hint: 'Formal greeting. Casual: 안녕!' },
  { id: 'ke_thankyou', category: 'KOREAN_TO_ENGLISH', prompt: '감사합니다', promptType: 'hangul', categoryHint: '인사 (Greeting)', correctAnswer: 'Thank you', hint: 'Formal. Casual: 고마워요' },
  { id: 'ke_sorry',    category: 'KOREAN_TO_ENGLISH', prompt: '미안합니다', promptType: 'hangul', categoryHint: '인사 (Greeting)', correctAnswer: 'Sorry', hint: 'Also: 죄송합니다 (more formal apology)' },
  { id: 'ke_yes',      category: 'KOREAN_TO_ENGLISH', prompt: '네', promptType: 'hangul', categoryHint: '기본 (Basic)', correctAnswer: 'Yes', hint: '네 and 예 both mean yes. 네 is more common' },
  { id: 'ke_no',       category: 'KOREAN_TO_ENGLISH', prompt: '아니요', promptType: 'hangul', categoryHint: '기본 (Basic)', correctAnswer: 'No' },
  { id: 'ke_water',    category: 'KOREAN_TO_ENGLISH', prompt: '물', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Water' },
  { id: 'ke_fire',     category: 'KOREAN_TO_ENGLISH', prompt: '불', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Fire' },
  { id: 'ke_sun',      category: 'KOREAN_TO_ENGLISH', prompt: '태양', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Sun' },
  { id: 'ke_moon',     category: 'KOREAN_TO_ENGLISH', prompt: '달', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Moon' },
  { id: 'ke_star',     category: 'KOREAN_TO_ENGLISH', prompt: '별', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Star' },
  { id: 'ke_person',   category: 'KOREAN_TO_ENGLISH', prompt: '사람', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Person' },
  { id: 'ke_friend',   category: 'KOREAN_TO_ENGLISH', prompt: '친구', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Friend' },
  { id: 'ke_family',   category: 'KOREAN_TO_ENGLISH', prompt: '가족', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Family' },
  { id: 'ke_house',    category: 'KOREAN_TO_ENGLISH', prompt: '집', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'House' },
  { id: 'ke_food',     category: 'KOREAN_TO_ENGLISH', prompt: '음식', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Food' },
  { id: 'ke_love',     category: 'KOREAN_TO_ENGLISH', prompt: '사랑', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Love' },
  { id: 'ke_time',     category: 'KOREAN_TO_ENGLISH', prompt: '시간', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Time' },
  { id: 'ke_money',    category: 'KOREAN_TO_ENGLISH', prompt: '돈', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Money' },
  { id: 'ke_school',   category: 'KOREAN_TO_ENGLISH', prompt: '학교', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'School' },
  { id: 'ke_work',     category: 'KOREAN_TO_ENGLISH', prompt: '일', promptType: 'hangul', categoryHint: '명사 (Noun)', correctAnswer: 'Work' },
  { id: 'ke_big',      category: 'KOREAN_TO_ENGLISH', prompt: '크다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Big' },
  { id: 'ke_small',    category: 'KOREAN_TO_ENGLISH', prompt: '작다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Small' },
  { id: 'ke_good',     category: 'KOREAN_TO_ENGLISH', prompt: '좋다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Good' },
  { id: 'ke_bad',      category: 'KOREAN_TO_ENGLISH', prompt: '나쁘다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Bad' },
  { id: 'ke_hot',      category: 'KOREAN_TO_ENGLISH', prompt: '뜨겁다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Hot' },
  { id: 'ke_cold',     category: 'KOREAN_TO_ENGLISH', prompt: '춥다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Cold', hint: '춥다 = cold (weather/air). 차갑다 = cold (to touch)' },
  { id: 'ke_fast',     category: 'KOREAN_TO_ENGLISH', prompt: '빠르다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Fast' },
  { id: 'ke_slow',     category: 'KOREAN_TO_ENGLISH', prompt: '느리다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Slow' },
  { id: 'ke_happy',    category: 'KOREAN_TO_ENGLISH', prompt: '행복하다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Happy' },
  { id: 'ke_sad',      category: 'KOREAN_TO_ENGLISH', prompt: '슬프다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Sad' },
  { id: 'ke_beautiful',category: 'KOREAN_TO_ENGLISH', prompt: '아름답다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Beautiful' },
  { id: 'ke_strong',   category: 'KOREAN_TO_ENGLISH', prompt: '강하다', promptType: 'hangul', categoryHint: '형용사 (Adj)', correctAnswer: 'Strong' },
];

// Korean numbers: digit prompt → Korean word
const KOREAN_NUMBERS: QuestionTemplate[] = [
  // Native Korean (순우리말)
  { id: 'n_1',  category: 'KOREAN_NUMBERS', prompt: '1', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '하나', hint: '하나, 둘, 셋... Used for counting objects' },
  { id: 'n_2',  category: 'KOREAN_NUMBERS', prompt: '2', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '둘' },
  { id: 'n_3',  category: 'KOREAN_NUMBERS', prompt: '3', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '셋' },
  { id: 'n_4',  category: 'KOREAN_NUMBERS', prompt: '4', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '넷' },
  { id: 'n_5',  category: 'KOREAN_NUMBERS', prompt: '5', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '다섯' },
  { id: 'n_6',  category: 'KOREAN_NUMBERS', prompt: '6', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '여섯' },
  { id: 'n_7',  category: 'KOREAN_NUMBERS', prompt: '7', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '일곱' },
  { id: 'n_8',  category: 'KOREAN_NUMBERS', prompt: '8', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '여덟' },
  { id: 'n_9',  category: 'KOREAN_NUMBERS', prompt: '9', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '아홉' },
  { id: 'n_10', category: 'KOREAN_NUMBERS', prompt: '10', promptType: 'text', categoryHint: '수 - 순우리말 (Native)', correctAnswer: '열', hint: '열 means 10 in native Korean. Used for age, hours (시)' },
  // Sino-Korean (한자어)
  { id: 'n_s1',  category: 'KOREAN_NUMBERS', prompt: '①', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '일', hint: '일, 이, 삼... Used for dates, phone numbers, money' },
  { id: 'n_s2',  category: 'KOREAN_NUMBERS', prompt: '②', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '이' },
  { id: 'n_s3',  category: 'KOREAN_NUMBERS', prompt: '③', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '삼' },
  { id: 'n_s4',  category: 'KOREAN_NUMBERS', prompt: '④', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '사', hint: '사 (4) is considered unlucky in Korea — like 13 in the West' },
  { id: 'n_s5',  category: 'KOREAN_NUMBERS', prompt: '⑤', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '오' },
  { id: 'n_s6',  category: 'KOREAN_NUMBERS', prompt: '⑥', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '육' },
  { id: 'n_s7',  category: 'KOREAN_NUMBERS', prompt: '⑦', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '칠' },
  { id: 'n_s8',  category: 'KOREAN_NUMBERS', prompt: '⑧', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '팔' },
  { id: 'n_s9',  category: 'KOREAN_NUMBERS', prompt: '⑨', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '구' },
  { id: 'n_s10', category: 'KOREAN_NUMBERS', prompt: '⑩', promptType: 'text', categoryHint: '수 - 한자어 (Sino)', correctAnswer: '십', hint: '십 (10) + 일 (1) = 십일 (11). The system is additive!' },
];

// Korean sentences: fill-in-the-blank
const KOREAN_SENTENCES: QuestionTemplate[] = [
  { id: 's_eat',    category: 'KOREAN_SENTENCES', prompt: '나는 ___을 먹어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '밥', hint: '나는 = I, 먹어요 = eat (formal)' },
  { id: 's_drink',  category: 'KOREAN_SENTENCES', prompt: '저는 ___을 마셔요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '물', hint: '저는 = I (humble), 마셔요 = drink' },
  { id: 's_school', category: 'KOREAN_SENTENCES', prompt: '저는 ___에 가요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '학교', hint: '에 가요 = going to (a place)' },
  { id: 's_friend', category: 'KOREAN_SENTENCES', prompt: '제 ___는 착해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '친구', hint: '착해요 = is kind/nice. 제 = my (humble)' },
  { id: 's_dog',    category: 'KOREAN_SENTENCES', prompt: '우리 집에 ___가 있어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '강아지', hint: '있어요 = there is/have. 우리 집 = our home' },
  { id: 's_book',   category: 'KOREAN_SENTENCES', prompt: '___을 읽어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '책', hint: '읽어요 = read (present tense)' },
  { id: 's_korean', category: 'KOREAN_SENTENCES', prompt: '한국어를 ___해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '공부', hint: '공부해요 = study. 한국어 = Korean language' },
  { id: 's_music',  category: 'KOREAN_SENTENCES', prompt: '음악을 ___어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '들', hint: '들어요 = listen. 음악 = music' },
  { id: 's_love',   category: 'KOREAN_SENTENCES', prompt: '당신을 ___해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '사랑', hint: '사랑해요 = I love you. 당신 = you (formal)' },
  { id: 's_happy',  category: 'KOREAN_SENTENCES', prompt: '저는 ___해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '행복', hint: '행복해요 = I am happy' },
  { id: 's_tired',  category: 'KOREAN_SENTENCES', prompt: '많이 ___해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '피곤', hint: '피곤해요 = tired. 많이 = a lot/very' },
  { id: 's_work',   category: 'KOREAN_SENTENCES', prompt: '회사에서 ___해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '일', hint: '회사 = company. 에서 = at/in' },
  { id: 's_cold',   category: 'KOREAN_SENTENCES', prompt: '오늘 날씨가 ___요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '추워', hint: '날씨 = weather. 추워요 = it\'s cold' },
  { id: 's_beautiful',category:'KOREAN_SENTENCES', prompt: '꽃이 ___요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '예뻐', hint: '예뻐요 = pretty/beautiful. 꽃 = flower' },
  { id: 's_fast',   category: 'KOREAN_SENTENCES', prompt: '기차가 ___요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '빨라', hint: '빨라요 = fast. 기차 = train' },
  { id: 's_big',    category: 'KOREAN_SENTENCES', prompt: '코끼리가 ___요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '커', hint: '커요 = big/large. 코끼리 = elephant' },
  { id: 's_cat',    category: 'KOREAN_SENTENCES', prompt: '___이 자고 있어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '고양이', hint: '자고 있어요 = is sleeping' },
  { id: 's_sing',   category: 'KOREAN_SENTENCES', prompt: '노래방에서 ___을 불러요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '노래', hint: '노래방 = karaoke room. 불러요 = sing' },
  { id: 's_money',  category: 'KOREAN_SENTENCES', prompt: '___이 없어요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '돈', hint: '없어요 = don\'t have / there isn\'t' },
  { id: 's_phone',  category: 'KOREAN_SENTENCES', prompt: '___로 전화해요.', promptType: 'text', categoryHint: '문장 (Sentence)', correctAnswer: '핸드폰', hint: '전화해요 = call. 로 = using/with' },
];

// Hangul consonants
const HANGUL_CONSONANTS: QuestionTemplate[] = [
  { id: 'h_g',  category: 'HANGUL_LETTERS', prompt: 'ㄱ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'g/k', hint: 'Sounds like "g" at start, "k" at end of syllable' },
  { id: 'h_n',  category: 'HANGUL_LETTERS', prompt: 'ㄴ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'n' },
  { id: 'h_d',  category: 'HANGUL_LETTERS', prompt: 'ㄷ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'd/t' },
  { id: 'h_r',  category: 'HANGUL_LETTERS', prompt: 'ㄹ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'r/l', hint: 'Sounds like "r" between vowels, "l" at end of syllable' },
  { id: 'h_m',  category: 'HANGUL_LETTERS', prompt: 'ㅁ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'm' },
  { id: 'h_b',  category: 'HANGUL_LETTERS', prompt: 'ㅂ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'b/p' },
  { id: 'h_s',  category: 'HANGUL_LETTERS', prompt: 'ㅅ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 's' },
  { id: 'h_ng', category: 'HANGUL_LETTERS', prompt: 'ㅇ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'ng/-', hint: 'Silent at the start of a syllable; "ng" sound at the end' },
  { id: 'h_j',  category: 'HANGUL_LETTERS', prompt: 'ㅈ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'j' },
  { id: 'h_ch', category: 'HANGUL_LETTERS', prompt: 'ㅊ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'ch' },
  { id: 'h_k',  category: 'HANGUL_LETTERS', prompt: 'ㅋ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'k', hint: 'Aspirated k — strong puff of air' },
  { id: 'h_t',  category: 'HANGUL_LETTERS', prompt: 'ㅌ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 't', hint: 'Aspirated t' },
  { id: 'h_p',  category: 'HANGUL_LETTERS', prompt: 'ㅍ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'p', hint: 'Aspirated p' },
  { id: 'h_h',  category: 'HANGUL_LETTERS', prompt: 'ㅎ', promptType: 'hangul', categoryHint: '자음 (Consonant)', correctAnswer: 'h' },
];

// Hangul vowels
const HANGUL_VOWELS: QuestionTemplate[] = [
  { id: 'h_a',   category: 'HANGUL_LETTERS', prompt: 'ㅏ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'a', hint: 'Like "ah" in "father"' },
  { id: 'h_ya',  category: 'HANGUL_LETTERS', prompt: 'ㅑ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'ya' },
  { id: 'h_eo',  category: 'HANGUL_LETTERS', prompt: 'ㅓ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'eo', hint: 'Like "uh" in "uh-oh"' },
  { id: 'h_yeo', category: 'HANGUL_LETTERS', prompt: 'ㅕ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yeo' },
  { id: 'h_o',   category: 'HANGUL_LETTERS', prompt: 'ㅗ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'o' },
  { id: 'h_yo',  category: 'HANGUL_LETTERS', prompt: 'ㅛ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yo' },
  { id: 'h_u',   category: 'HANGUL_LETTERS', prompt: 'ㅜ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'u' },
  { id: 'h_yu',  category: 'HANGUL_LETTERS', prompt: 'ㅠ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'yu' },
  { id: 'h_eu',  category: 'HANGUL_LETTERS', prompt: 'ㅡ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'eu', hint: 'No English equivalent — like "uh" with rounded lips' },
  { id: 'h_i',   category: 'HANGUL_LETTERS', prompt: 'ㅣ', promptType: 'hangul', categoryHint: '모음 (Vowel)', correctAnswer: 'i', hint: 'Like "ee" in "see"' },
];

const ALL_TEMPLATES: QuestionTemplate[] = [
  ...KOREAN_WORDS,
  ...KOREAN_VERBS,
  ...KOREAN_TO_ENGLISH,
  ...KOREAN_NUMBERS,
  ...KOREAN_SENTENCES,
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
      hint: template.hint,
    },
    correctAnswer: template.correctAnswer,
  };
}

export function generateRoundQuestions(category: GameCategory, count: number): Array<{ question: PublicQuestion; correctAnswer: string }> {
  const pool = ALL_TEMPLATES.filter(t => t.category === category);
  const selected = shuffle(pool).slice(0, count);
  return selected.map(t => buildQuestion(t, pool));
}
