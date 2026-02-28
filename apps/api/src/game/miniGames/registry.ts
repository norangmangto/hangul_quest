import { nanoid } from "nanoid";
import type { MiniGameType, QuestionDTO } from "@hangul-quest/shared";
import { validateAnswer as validateHangulAnswer } from "../validation.js";
import type { MiniGameContext, MiniGamePlugin, MiniGameReward } from "./types.js";

const CONSONANTS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"];
const WORDS = ["사과", "바다", "학교", "사람", "우유", "하늘", "토끼"];
const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ"
];

const FORGE_PARTS: Array<{ consonant: string; vowel: string }> = [
  { consonant: "ㄱ", vowel: "ㅏ" },
  { consonant: "ㄴ", vowel: "ㅏ" },
  { consonant: "ㅁ", vowel: "ㅜ" },
  { consonant: "ㅂ", vowel: "ㅏ" },
  { consonant: "ㅅ", vowel: "ㅣ" },
  { consonant: "ㅎ", vowel: "ㅏ" }
];

const SENTENCE_GAPS: Array<{ sentence: string; expected: string; choices: string[] }> = [
  { sentence: "저는 ___ 을 먹어요.", expected: "사과", choices: ["사과", "바위", "학교"] },
  { sentence: "나는 ___ 에 가요.", expected: "학교", choices: ["학교", "물", "보"] },
  { sentence: "하늘이 ___ .", expected: "맑아요", choices: ["맑아요", "가위", "바나나"] }
];

const ELEMENT_RULES = {
  불: "종이",
  종이: "물",
  물: "불"
} as const;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function composeSyllable(consonant: string, vowel: string): string {
  const choseongIndex = CHOSEONG.indexOf(consonant);
  const jungseongIndex = JUNGSEONG.indexOf(vowel);
  if (choseongIndex < 0 || jungseongIndex < 0) {
    return `${consonant}${vowel}`;
  }

  const codePoint = 0xac00 + (choseongIndex * 21 + jungseongIndex) * 28;
  return String.fromCharCode(codePoint);
}

function defaultValidate(question: QuestionDTO, input: string) {
  return validateHangulAnswer(question.expected, input, "EXACT");
}

function defaultReward(_question: QuestionDTO, isCorrect: boolean): MiniGameReward {
  return isCorrect ? { xp: 10, progressDelta: 10 } : { xp: 0, progressDelta: 0 };
}

function createPlugin(
  type: MiniGameType,
  generateQuestion: (context: MiniGameContext) => QuestionDTO,
  validateAnswer: (question: QuestionDTO, input: string) => boolean = defaultValidate,
  calculateReward: (question: QuestionDTO, isCorrect: boolean) => MiniGameReward = defaultReward
): MiniGamePlugin {
  return { type, generateQuestion, validateAnswer, calculateReward };
}

export class MiniGameRegistry {
  private readonly plugins = new Map<MiniGameType, MiniGamePlugin>();

  register(plugin: MiniGamePlugin) {
    this.plugins.set(plugin.type, plugin);
  }

  generateQuestion(type: MiniGameType, context: MiniGameContext): QuestionDTO {
    const plugin = this.plugins.get(type);
    if (!plugin) throw new Error(`missing_minigame_plugin:${type}`);
    return plugin.generateQuestion(context);
  }

  validateAnswer(question: QuestionDTO, input: string): boolean {
    const plugin = this.plugins.get(question.miniGameType);
    if (!plugin) return defaultValidate(question, input);
    return plugin.validateAnswer(question, input);
  }

  calculateReward(question: QuestionDTO, isCorrect: boolean): MiniGameReward {
    const plugin = this.plugins.get(question.miniGameType);
    if (!plugin) return defaultReward(question, isCorrect);
    return plugin.calculateReward(question, isCorrect);
  }
}

export function createDefaultMiniGameRegistry(customPlugins: MiniGamePlugin[] = []) {
  const registry = new MiniGameRegistry();

  registry.register(
    createPlugin("LETTER_RECOGNITION", ({ difficulty, chapter, questTitle, optionCount }) => {
      const letterPool = difficulty === "ADVANCED" ? [...CONSONANTS, ...VOWELS] : CONSONANTS;
      const expected = letterPool[Math.floor(Math.random() * letterPool.length)];
      const options = shuffle([expected, ...shuffle(letterPool.filter((x) => x !== expected)).slice(0, optionCount - 1)]);

      return {
        id: nanoid(),
        type: "LETTER",
        miniGameType: "LETTER_RECOGNITION",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "RECOGNITION",
        prompt: `Bridge of Echoes: 다음 글자를 고르세요 (${expected})`,
        options,
        expected,
        mode: "CLICK"
      };
    })
  );

  registry.register(
    createPlugin("SPIRIT_CATCH", ({ difficulty, chapter, questTitle, optionCount }) => {
      const target = Math.random() > 0.5 ? "CONSONANT" : "VOWEL";
      const targetPool = target === "CONSONANT" ? CONSONANTS : VOWELS;
      const distractorPool = target === "CONSONANT" ? VOWELS : CONSONANTS;
      const expected = targetPool[Math.floor(Math.random() * targetPool.length)];
      const options = shuffle([expected, ...shuffle(distractorPool).slice(0, optionCount - 1)]);

      return {
        id: nanoid(),
        type: "LETTER",
        miniGameType: "SPIRIT_CATCH",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "TIMED_REACTION",
        prompt: `Spirit Catch: ${target === "CONSONANT" ? "자음" : "모음"}만 잡으세요`,
        options,
        expected,
        mode: "CLICK"
      };
    })
  );

  registry.register(
    createPlugin("ECHO_SHRINE", ({ difficulty, chapter, questTitle, optionCount }) => {
      const consonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
      const expected = composeSyllable(consonant, VOWELS[Math.floor(Math.random() * VOWELS.length)]);
      const vowelVariants = shuffle(VOWELS)
        .slice(0, Math.max(2, optionCount - 1))
        .map((vowel) => composeSyllable(consonant, vowel));
      const options = shuffle([expected, ...vowelVariants.filter((item) => item !== expected).slice(0, optionCount - 1)]);

      return {
        id: nanoid(),
        type: "WORD",
        miniGameType: "ECHO_SHRINE",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "MATCHING",
        prompt: `Echo Shrine: 소리를 듣고 알맞은 음절을 고르세요 (재생: ${expected})`,
        promptType: "SPELL",
        word: expected,
        syllables: expected.split(""),
        options,
        expected
      };
    })
  );

  registry.register(
    createPlugin("SYLLABLE_FORGE", ({ difficulty, chapter, questTitle, optionCount }) => {
      const parts = FORGE_PARTS[Math.floor(Math.random() * FORGE_PARTS.length)];
      const expected = composeSyllable(parts.consonant, parts.vowel);
      const options = shuffle([
        expected,
        ...shuffle(FORGE_PARTS.map((item) => composeSyllable(item.consonant, item.vowel)).filter((item) => item !== expected)).slice(
          0,
          optionCount - 1
        )
      ]);

      return {
        id: nanoid(),
        type: "WORD",
        miniGameType: "SYLLABLE_FORGE",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "CONSTRUCTION",
        prompt: `Syllable Forge: ${parts.consonant} + ${parts.vowel} 조합을 완성하세요`,
        promptType: "SPELL",
        word: expected,
        syllables: [parts.consonant, parts.vowel],
        options,
        expected
      };
    })
  );

  registry.register(
    createPlugin("MARKET_RESTORATION", ({ difficulty, chapter, questTitle, optionCount }) => {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      const options = shuffle([word, ...shuffle(WORDS.filter((item) => item !== word)).slice(0, optionCount - 1)]);
      return {
        id: nanoid(),
        type: "WORD",
        miniGameType: "MARKET_RESTORATION",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "MATCHING",
        prompt: "Market Restoration: 이미지에 맞는 단어 라벨을 고르세요",
        promptType: "IMAGE",
        imageUrl: `/images/${word}.png`,
        word,
        syllables: word.split(""),
        options,
        expected: word
      };
    })
  );

  registry.register(
    createPlugin("SYLLABLE_UNSCRAMBLE", ({ difficulty, chapter, questTitle }) => {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      const scrambled = shuffle(word.split(""));
      if (scrambled.join("") === word) scrambled.reverse();

      return {
        id: nanoid(),
        type: "WORD",
        miniGameType: "SYLLABLE_UNSCRAMBLE",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "CONSTRUCTION",
        prompt: `Syllable Unscramble: ${scrambled.join(" ")} 순서를 바르게 맞추세요`,
        promptType: "UNSCRAMBLE",
        word,
        syllables: scrambled,
        options: [word],
        expected: word
      };
    })
  );

  registry.register(
    createPlugin("ARENA_WORDS", ({ difficulty, chapter, questTitle }) => {
      const useElementSet = difficulty === "ADVANCED" && Math.random() > 0.5;
      if (useElementSet) {
        const choices = Object.keys(ELEMENT_RULES) as Array<keyof typeof ELEMENT_RULES>;
        const opponent = choices[Math.floor(Math.random() * choices.length)];
        const expected = ELEMENT_RULES[opponent];
        return {
          id: nanoid(),
          type: "LOGIC",
          miniGameType: "ARENA_WORDS",
          difficulty,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          questTitle,
          miniGameCategory: "LOGIC",
          prompt: `Arena of Words: 상대가 ${opponent}를 냈어요. 이기는 단어를 입력하세요`,
          rule: "RPS_COUNTER",
          expected,
          context: { opponent, ruleset: "elements" }
        };
      }

      const opponent = ["가위", "바위", "보"][Math.floor(Math.random() * 3)] as "가위" | "바위" | "보";
      const expected = { 가위: "바위", 바위: "보", 보: "가위" }[opponent];
      return {
        id: nanoid(),
        type: "LOGIC",
        miniGameType: "ARENA_WORDS",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "LOGIC",
        prompt: `Arena of Words: 상대가 ${opponent}를 냈어요. 이기는 단어를 입력하세요`,
        rule: "RPS_COUNTER",
        expected,
        context: { opponent, ruleset: "rps" }
      };
    })
  );

  registry.register(
    createPlugin("SENTENCE_RESTORATION", ({ difficulty, chapter, questTitle }) => {
      const gap = SENTENCE_GAPS[Math.floor(Math.random() * SENTENCE_GAPS.length)];
      return {
        id: nanoid(),
        type: "LOGIC",
        miniGameType: "SENTENCE_RESTORATION",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "COOP_ASSEMBLY",
        prompt: `Sentence Restoration: ${gap.sentence}`,
        rule: "SENTENCE_FILL",
        expected: gap.expected,
        context: { sentence: gap.sentence, choices: gap.choices.join(",") }
      };
    })
  );

  for (const plugin of customPlugins) {
    registry.register(plugin);
  }

  return registry;
}
