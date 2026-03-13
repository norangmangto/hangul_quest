import { describe, it, expect } from 'vitest';
import { generateRoundQuestions } from '../src/game/QuestionBank.js';

describe('generateRoundQuestions', () => {
  it('returns the requested number of questions', () => {
    const questions = generateRoundQuestions('KOREAN_WORDS', 5);
    expect(questions).toHaveLength(5);
  });

  it('each question has exactly 4 options', () => {
    const questions = generateRoundQuestions('HANGUL_LETTERS', 3);
    for (const { question } of questions) {
      expect(question.options).toHaveLength(4);
    }
  });

  it('correct answer is included in options', () => {
    const questions = generateRoundQuestions('KOREAN_WORDS', 10);
    for (const { question, correctAnswer } of questions) {
      expect(question.options).toContain(correctAnswer);
    }
  });

  it('only returns questions from the specified category', () => {
    const questions = generateRoundQuestions('HANGUL_LETTERS', 10);
    for (const { question } of questions) {
      expect(['hangul', 'romanization']).toContain(question.promptType);
    }
  });
});
