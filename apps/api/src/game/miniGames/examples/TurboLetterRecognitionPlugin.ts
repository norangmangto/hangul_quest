import { nanoid } from "nanoid";
import type { MiniGamePlugin } from "../types.js";

const LETTERS = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function createTurboLetterRecognitionPlugin(): MiniGamePlugin {
  return {
    type: "LETTER_RECOGNITION",
    generateQuestion: ({ difficulty, chapter, questTitle, optionCount }) => {
      const expected = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      const boostedOptionCount = Math.min(8, optionCount + 2);
      const options = shuffle([expected, ...shuffle(LETTERS.filter((item) => item !== expected)).slice(0, boostedOptionCount - 1)]);

      return {
        id: nanoid(),
        type: "LETTER",
        miniGameType: "LETTER_RECOGNITION",
        difficulty,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        questTitle,
        miniGameCategory: "RECOGNITION",
        prompt: `Turbo Bridge: 다음 글자를 빠르게 선택하세요 (${expected})`,
        options,
        expected,
        mode: "CLICK"
      };
    },
    validateAnswer: (question, input) => question.expected.trim() === input.trim(),
    calculateReward: (_question, isCorrect) => (isCorrect ? { xp: 12, progressDelta: 12 } : { xp: 0, progressDelta: 0 })
  };
}
