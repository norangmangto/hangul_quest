import { describe, expect, it } from "vitest";
import { createDefaultMiniGameRegistry } from "../src/game/miniGames/registry.js";
import { createTurboLetterRecognitionPlugin } from "../src/game/miniGames/examples/TurboLetterRecognitionPlugin.js";
import { getChapterForLevel } from "../src/game/story.js";

describe("mini-game registry", () => {
  it("contains plugins for all core mini-game types", () => {
    const registry = createDefaultMiniGameRegistry();
    const chapter = getChapterForLevel(1);
    const types = [
      "LETTER_RECOGNITION",
      "SPIRIT_CATCH",
      "ECHO_SHRINE",
      "SYLLABLE_FORGE",
      "MARKET_RESTORATION",
      "SYLLABLE_UNSCRAMBLE",
      "ARENA_WORDS",
      "SENTENCE_RESTORATION"
    ] as const;

    for (const type of types) {
      const question = registry.generateQuestion(type, {
        miniGameType: type,
        difficulty: "BEGINNER",
        chapter,
        questTitle: "Test Quest",
        optionCount: 4
      });

      expect(question.miniGameType).toBe(type);
      expect(question.prompt.length).toBeGreaterThan(0);
    }
  });

  it("can be overridden by a custom plugin", () => {
    const registry = createDefaultMiniGameRegistry([createTurboLetterRecognitionPlugin()]);
    const chapter = getChapterForLevel(1);

    const question = registry.generateQuestion("LETTER_RECOGNITION", {
      miniGameType: "LETTER_RECOGNITION",
      difficulty: "BEGINNER",
      chapter,
      questTitle: "Test Quest",
      optionCount: 2
    });

    expect(question.prompt.startsWith("Turbo Bridge:")).toBe(true);

    const reward = registry.calculateReward({ ...question, expected: "ㄱ" }, true);
    expect(reward.progressDelta).toBe(12);
  });
});
