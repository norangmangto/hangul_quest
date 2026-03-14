'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generatePracticeQuestions, type PracticeQuestion } from '../../lib/practiceQuestions';
import { getWeakSpots, recordWrong } from '../../lib/weakSpots';
import { playCorrect, playWrong } from '../../lib/sounds';

type Category = 'KOREAN_WORDS' | 'HANGUL_LETTERS';

function optionColor(opt: string, selected: string | null, correct: string, revealed: boolean) {
  if (!revealed) {
    if (opt === selected) return 'bg-indigo-500 text-white ring-4 ring-indigo-300';
    return 'bg-white dark:bg-gray-700 dark:text-white text-gray-800 hover:bg-indigo-50 active:scale-95';
  }
  if (opt === correct) return 'bg-emerald-400 text-white ring-4 ring-emerald-200';
  if (opt === selected) return 'bg-red-400 text-white';
  return 'bg-gray-100 dark:bg-gray-600 dark:text-gray-300 text-gray-400';
}

export default function PracticePage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [weakOnly, setWeakOnly] = useState(false);
  const weakSpots = getWeakSpots();

  const startPractice = (cat: Category, fromWeak = false) => {
    setCategory(cat);
    setWeakOnly(fromWeak);
    let qs: PracticeQuestion[];
    if (fromWeak) {
      // Generate questions only for weak spot prompts
      const all = generatePracticeQuestions(cat, 30);
      const weakPrompts = new Set(weakSpots.filter(w => w.category === cat).map(w => w.prompt));
      qs = all.filter(q => weakPrompts.has(q.prompt));
      if (qs.length === 0) qs = all.slice(0, 10);
    } else {
      qs = generatePracticeQuestions(cat, 15);
    }
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setDone(false);
  };

  const q = questions[current];

  const submit = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const correct = opt === q.answer;
    if (correct) {
      setScore(s => s + 1);
      playCorrect();
    } else {
      playWrong();
      recordWrong(q.prompt, q.answer, q.category);
    }
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  // Category select screen
  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col items-center justify-center p-6 text-white gap-6">
        <button onClick={() => router.push('/')} className="absolute top-4 left-4 text-white/70 hover:text-white font-semibold text-sm underline">
          ← Back
        </button>
        <div className="text-7xl">📖</div>
        <h1 className="text-4xl font-extrabold">Solo Practice</h1>
        <p className="text-sky-100 text-center max-w-xs">Practice Korean at your own pace — no pressure, no timer!</p>

        {weakSpots.length > 0 && (
          <div className="bg-orange-400/80 rounded-2xl px-5 py-3 text-center max-w-xs">
            <p className="font-bold text-sm">🔴 You have {weakSpots.length} weak spots</p>
            <p className="text-xs text-white/80 mt-1">Practice weak spots to improve your accuracy</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
          {weakSpots.some(w => w.category === 'KOREAN_WORDS') && (
            <button onClick={() => startPractice('KOREAN_WORDS', true)}
              className="bg-orange-400 hover:bg-orange-300 text-white font-bold py-3 px-6 rounded-2xl transition-all text-left">
              🔴 Weak Spots: Korean Words
            </button>
          )}
          {weakSpots.some(w => w.category === 'HANGUL_LETTERS') && (
            <button onClick={() => startPractice('HANGUL_LETTERS', true)}
              className="bg-orange-400 hover:bg-orange-300 text-white font-bold py-3 px-6 rounded-2xl transition-all text-left">
              🔴 Weak Spots: Hangul Letters
            </button>
          )}
          <button onClick={() => startPractice('KOREAN_WORDS')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-2xl transition-all text-left">
            📖 Korean Words (15 rounds)
          </button>
          <button onClick={() => startPractice('HANGUL_LETTERS')}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-2xl transition-all text-left">
            🔤 Hangul Letters (15 rounds)
          </button>
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 text-white gap-6">
        <div className="text-7xl">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
        <p className="text-4xl font-extrabold">Practice Done!</p>
        <p className="text-2xl font-bold">{score} / {questions.length} correct</p>
        <p className="text-xl text-indigo-200">{pct}%</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => startPractice(category, weakOnly)}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold py-4 rounded-2xl transition-all">
            🔄 Practice Again
          </button>
          <button onClick={() => setCategory(null)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-2xl transition-all">
            ← Change Category
          </button>
          <button onClick={() => router.push('/')}
            className="text-white/70 hover:text-white text-sm underline transition-all text-center">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button onClick={() => setCategory(null)} className="text-white/70 hover:text-white text-sm font-semibold underline">
          ← Exit
        </button>
        <span className="font-bold text-sm">{current + 1} / {questions.length}</span>
        <span className="font-bold text-sm">⭐ {score}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/20 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${((current + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
        <p className="text-white/80 text-sm font-semibold">{q.categoryHint}</p>

        {q.promptType === 'text' ? (
          <div className="bg-white/20 rounded-2xl px-6 py-4 max-w-sm text-center">
            <p className="text-white text-2xl font-bold">{q.prompt}</p>
          </div>
        ) : (
          <div className="text-[8rem] leading-none select-none">{q.prompt}</div>
        )}

        {revealed && (
          <div className="text-center animate-bounce">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Correct Answer</p>
            <p className="text-white text-4xl font-black">{q.answer}</p>
            {q.hint && <p className="text-white/60 text-sm mt-1">{q.hint}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => submit(opt)}
              disabled={revealed}
              className={`py-5 px-2 rounded-2xl font-black text-xl shadow-lg transition-all ${optionColor(opt, selected, q.answer, revealed)}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {revealed && (
          <button
            onClick={next}
            className="mt-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            {current + 1 >= questions.length ? 'See Results' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
