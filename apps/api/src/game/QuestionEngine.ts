import type { Difficulty, MiniGameType, QuestionDTO } from "@hangul-quest/shared";
import { env } from "../config.js";
import type { ChapterConfig } from "./story.js";
import { createDefaultMiniGameRegistry } from "./miniGames/registry.js";
import type { MiniGameReward } from "./miniGames/types.js";
import { createTurboLetterRecognitionPlugin } from "./miniGames/examples/TurboLetterRecognitionPlugin.js";

export class QuestionEngine {
  private readonly miniGameRegistry = createDefaultMiniGameRegistry(
    env.ENABLE_TURBO_PLUGIN ? [createTurboLetterRecognitionPlugin()] : []
  );

  generate(miniGameType: MiniGameType, difficulty: Difficulty, chapter: ChapterConfig, questTitle: string): QuestionDTO {
    return this.miniGameRegistry.generateQuestion(miniGameType, {
      miniGameType,
      difficulty,
      chapter,
      questTitle,
      optionCount: this.getOptionCount(difficulty)
    });
  }

  validateAnswer(question: QuestionDTO, input: string): boolean {
    return this.miniGameRegistry.validateAnswer(question, input);
  }

  calculateReward(question: QuestionDTO, isCorrect: boolean): MiniGameReward {
    return this.miniGameRegistry.calculateReward(question, isCorrect);
  }

  private getOptionCount(difficulty: Difficulty): number {
    if (difficulty === "BEGINNER") return 2;
    if (difficulty === "INTERMEDIATE") return 4;
    return 6;
  }
}
