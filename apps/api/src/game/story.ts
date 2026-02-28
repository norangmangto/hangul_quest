import type { ChapterId, MiniGameType } from "@hangul-quest/shared";

export type QuestConfig = {
  questId: string;
  title: string;
  miniGamePool: MiniGameType[];
  requiredSuccesses: number;
};

export type ChapterConfig = {
  id: ChapterId;
  title: string;
  learningGoal: string;
  storyGoal: string;
  quests: QuestConfig[];
  levelStart: number;
  levelEnd: number;
  questEffect:
    | "bridge_open"
    | "lake_calm"
    | "forge_ignited"
    | "market_restored"
    | "arena_shield_break"
    | "archive_unsealed";
};

export const CHAPTERS: ChapterConfig[] = [
  {
    id: "CH1_CONSONANTS",
    title: "Chapter 1: Forest of Consonants",
    learningGoal: "기본 자음을 인식하고 발음하기",
    storyGoal: "흩어진 자음 정령을 회수하여 다리를 복구한다",
    quests: [
      {
        questId: "forest_bridge_01",
        title: "Bridge of Echoes",
        miniGamePool: ["LETTER_RECOGNITION", "SPIRIT_CATCH"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 1,
    levelEnd: 2,
    questEffect: "bridge_open"
  },
  {
    id: "CH2_VOWELS",
    title: "Chapter 2: Lake of Vowels",
    learningGoal: "기본 모음을 구분하고 매칭하기",
    storyGoal: "호수의 울림을 되찾아 봉인된 길을 연다",
    quests: [
      {
        questId: "lake_echo_01",
        title: "Echo Shrine",
        miniGamePool: ["ECHO_SHRINE", "LETTER_RECOGNITION"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 3,
    levelEnd: 4,
    questEffect: "lake_calm"
  },
  {
    id: "CH3_SYLLABLE_FORGE",
    title: "Chapter 3: Syllable Forge",
    learningGoal: "자음+모음으로 음절 블록 만들기",
    storyGoal: "용광로를 재가동해 잃어버린 글자를 단련한다",
    quests: [
      {
        questId: "forge_assembly_01",
        title: "The Syllable Forge",
        miniGamePool: ["SYLLABLE_FORGE", "SPIRIT_CATCH"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 5,
    levelEnd: 6,
    questEffect: "forge_ignited"
  },
  {
    id: "CH4_WORD_MARKET",
    title: "Chapter 4: Market of Words",
    learningGoal: "기초 단어를 읽고 상황에 맞게 선택하기",
    storyGoal: "상인의 표지판을 복원하여 시장을 되살린다",
    quests: [
      {
        questId: "market_restore_01",
        title: "Market Restoration",
        miniGamePool: ["MARKET_RESTORATION", "SYLLABLE_UNSCRAMBLE"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 7,
    levelEnd: 8,
    questEffect: "market_restored"
  },
  {
    id: "CH5_LOGIC_ARENA",
    title: "Chapter 5: Arena of Logic",
    learningGoal: "단어 규칙 논리를 적용해 반격하기",
    storyGoal: "가면 군단의 패턴을 해독해 방어막을 부순다",
    quests: [
      {
        questId: "arena_logic_01",
        title: "Arena of Words",
        miniGamePool: ["ARENA_WORDS", "SYLLABLE_UNSCRAMBLE"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 9,
    levelEnd: 10,
    questEffect: "arena_shield_break"
  },
  {
    id: "CH6_ROYAL_ARCHIVE",
    title: "Final Chapter: Royal Archive",
    learningGoal: "짧은 문장을 복원하고 조사 선택하기",
    storyGoal: "침묵의 가면이 지운 문장을 복원해 봉인을 푼다",
    quests: [
      {
        questId: "archive_restore_01",
        title: "Sentence Restoration",
        miniGamePool: ["SENTENCE_RESTORATION", "ARENA_WORDS"],
        requiredSuccesses: 10
      }
    ],
    levelStart: 11,
    levelEnd: Number.MAX_SAFE_INTEGER,
    questEffect: "archive_unsealed"
  }
];

export function getChapterForLevel(level: number): ChapterConfig {
  return CHAPTERS.find((chapter) => level >= chapter.levelStart && level <= chapter.levelEnd) ?? CHAPTERS[CHAPTERS.length - 1];
}

export function getQuestTitleForLevel(chapter: ChapterConfig, level: number): string {
  if (chapter.quests.length === 0) {
    return "Main Quest";
  }

  const offset = Math.max(0, level - chapter.levelStart);
  return chapter.quests[offset % chapter.quests.length].title;
}

export function getQuestForLevel(chapter: ChapterConfig, level: number): QuestConfig {
  if (chapter.quests.length === 0) {
    return {
      questId: `${chapter.id.toLowerCase()}_default`,
      title: "Main Quest",
      miniGamePool: ["LETTER_RECOGNITION"],
      requiredSuccesses: 10
    };
  }

  const offset = Math.max(0, level - chapter.levelStart);
  return chapter.quests[offset % chapter.quests.length];
}

export function getFestivalChapter(): ChapterConfig {
  const eligible = CHAPTERS.filter((chapter) => chapter.id !== "CH6_ROYAL_ARCHIVE");
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function getFestivalQuestPool(): QuestConfig {
  return {
    questId: "festival_arcade_01",
    title: "Village Festival",
    miniGamePool: [
      "LETTER_RECOGNITION",
      "SPIRIT_CATCH",
      "ECHO_SHRINE",
      "SYLLABLE_FORGE",
      "MARKET_RESTORATION",
      "SYLLABLE_UNSCRAMBLE",
      "ARENA_WORDS",
      "SENTENCE_RESTORATION"
    ],
    requiredSuccesses: 10
  };
}
