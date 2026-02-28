import type { Difficulty, MiniGameType, QuestionDTO } from "@hangul-quest/shared";
import type { ChapterConfig } from "../story.js";

export type MiniGameReward = {
  xp: number;
  progressDelta: number;
};

export type MiniGameContext = {
  miniGameType: MiniGameType;
  difficulty: Difficulty;
  chapter: ChapterConfig;
  questTitle: string;
  optionCount: number;
};

export interface MiniGamePlugin {
  type: MiniGameType;
  generateQuestion: (context: MiniGameContext) => QuestionDTO;
  validateAnswer: (question: QuestionDTO, input: string) => boolean;
  calculateReward: (question: QuestionDTO, isCorrect: boolean) => MiniGameReward;
}
