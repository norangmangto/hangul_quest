'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generatePracticeQuestions, type PracticeQuestion } from '../../lib/practiceQuestions';
import { getWeakSpots, recordWrong } from '../../lib/weakSpots';
import { playCorrect, playWrong } from '../../lib/sounds';
import { useLangStore, useT, type Lang } from '../../lib/i18n';

function LangPill() {
  const { lang, setLang, hydrate } = useLangStore();
  useEffect(() => { hydrate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ko', label: '한' },
    { code: 'de', label: 'DE' },
  ];
  return (
    <div className="sky-card rounded-full px-2 py-1.5 flex gap-1">
      {LANGS.map(({ code, label }) => (
        <button key={code} onClick={() => setLang(code)}
          className={`px-3 py-1.5 rounded-full text-sm font-black transition-all ${lang === code ? 'bg-yellow-400 text-slate-900' : 'text-white/70 hover:text-white'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

type Category = 'KOREAN_WORDS' | 'HANGUL_LETTERS' | 'KOREAN_VERBS' | 'KOREAN_TO_ENGLISH' | 'KOREAN_NUMBERS' | 'KOREAN_SENTENCES';

// Big vibrant answer colors
const ANSWER_COLORS = [
  { idle: 'bg-gradient-to-b from-rose-400 to-red-600',    correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-amber-300 to-yellow-500', correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-sky-400 to-blue-600',    correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-violet-400 to-purple-600', correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
];

function btnClass(idx: number, opt: string, selected: string | null, correct: string, revealed: boolean): string {
  const c = ANSWER_COLORS[idx % 4];
  if (!revealed) return opt === selected ? `${c.idle} ring-4 ring-white/60 scale-95` : c.idle;
  if (opt === correct) return c.correct;
  if (opt === selected) return c.wrong;
  return c.dim;
}

function Stars({ pct }: { pct: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {[33, 66, 85].map((threshold, i) => (
        <span key={i} className={`text-6xl transition-all ${pct > threshold ? 'drop-shadow-lg' : 'opacity-20 grayscale'}`}>⭐</span>
      ))}
    </div>
  );
}

function Sky({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 flex flex-col relative overflow-hidden">
      {/* Sun */}
      <div className="pointer-events-none select-none absolute top-5 right-6 z-0">
        <div className="w-20 h-20 rounded-full sun-glow"
             style={{ background: 'radial-gradient(circle, #fffde7 0%, #ffd600 55%, #ffb300 100%)' }} />
      </div>
      {/* Cloud */}
      <div className="pointer-events-none absolute top-10 left-4 cloud-b opacity-70 z-0">
        <div className="relative">
          <div className="w-32 h-12 bg-white/80 rounded-full" />
          <div className="absolute -top-6 left-6 w-20 h-16 bg-white/80 rounded-full" />
        </div>
      </div>
      {children}
      <div className="h-12 bg-gradient-to-b from-lime-400 to-green-600 w-full mt-auto"
           style={{ boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)' }} />
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const t = useT();
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [weakOnly, setWeakOnly] = useState(false);
  const [weakSpots, setWeakSpots] = useState<ReturnType<typeof getWeakSpots>>([]);

  useEffect(() => { setWeakSpots(getWeakSpots()); }, []);

  const start = (cat: Category, fromWeak = false) => {
    setCategory(cat); setWeakOnly(fromWeak);
    let qs: PracticeQuestion[];
    if (fromWeak) {
      const all = generatePracticeQuestions(cat, 30);
      const ws = new Set(weakSpots.filter(w => w.category === cat).map(w => w.prompt));
      qs = all.filter(q => ws.has(q.prompt));
      if (!qs.length) qs = all.slice(0, 10);
    } else {
      qs = generatePracticeQuestions(cat, 15);
    }
    setQuestions(qs); setCurrent(0); setSelected(null);
    setRevealed(false); setScore(0); setDone(false);
  };

  const q = questions[current];

  const submit = (opt: string) => {
    if (revealed) return;
    setSelected(opt); setRevealed(true);
    if (opt === q.answer) { setScore(s => s + 1); playCorrect(); }
    else { playWrong(); recordWrong(q.prompt, q.answer, q.category); }
  };

  const next = () => {
    if (current + 1 >= questions.length) setDone(true);
    else { setCurrent(c => c + 1); setSelected(null); setRevealed(false); }
  };

  const CAT_CONFIG: { id: Category; emoji: string; label: string; color: string; delay: string }[] = [
    { id: 'KOREAN_WORDS',      emoji: '🇰🇷', label: t.cat_korean_words,    color: 'from-rose-400 to-red-600',       delay: '0s' },
    { id: 'HANGUL_LETTERS',    emoji: '🔤',  label: t.cat_hangul_letters,  color: 'from-sky-400 to-blue-600',       delay: '0.3s' },
    { id: 'KOREAN_VERBS',      emoji: '🏃',  label: '🏃 Korean Verbs',     color: 'from-emerald-400 to-green-600',  delay: '0.6s' },
    { id: 'KOREAN_TO_ENGLISH', emoji: '📝',  label: '📝 Korean → English', color: 'from-violet-400 to-purple-600',  delay: '0.9s' },
    { id: 'KOREAN_NUMBERS',    emoji: '🔢',  label: '🔢 Korean Numbers',   color: 'from-amber-400 to-orange-500',   delay: '1.2s' },
    { id: 'KOREAN_SENTENCES',  emoji: '💬',  label: '💬 Sentences',        color: 'from-teal-400 to-cyan-600',      delay: '1.5s' },
  ];

  // ── Category select ────────────────────────────────────────────────────────
  if (!category) {
    const weakCats = new Set(weakSpots.map(w => w.category));
    return (
      <Sky>
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => router.push('/')} className="sky-card rounded-full px-5 py-3 text-white font-black text-xl gummy-btn">←</button>
          <LangPill />
        </div>

        <div className="relative z-10 text-center py-3">
          <div className="text-[4rem] leading-none bird-bob inline-block select-none">📖</div>
          <h2 className="text-3xl font-black text-white kid-title mt-1">{t.solo_practice}</h2>
        </div>

        {/* 3×2 category grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 px-4 pb-4 flex-1 content-start">
          {CAT_CONFIG.map(c => (
            <button key={c.id} onClick={() => start(c.id)}
              className={`relative bg-gradient-to-b ${c.color} rounded-[2rem] flex flex-col items-center justify-center gap-2 py-6 gummy-btn`}>
              {weakCats.has(c.id) && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-black text-sm" style={{ boxShadow: '0 3px 0 rgba(0,0,0,0.3)' }}>!</div>
              )}
              <span className="text-5xl leading-none select-none" style={{ animation: `birdBob 2.2s ease-in-out infinite`, animationDelay: c.delay }}>{c.emoji}</span>
              <span className="text-sm font-black text-white kid-label text-center px-3 leading-tight">{c.label.replace(/^\S+\s/, '')}</span>
              {weakCats.has(c.id) && (
                <button onClick={e => { e.stopPropagation(); start(c.id, true); }}
                  className="bg-yellow-400 text-slate-900 font-black text-xs px-3 py-1 rounded-full mt-1 active:scale-95 transition-all">
                  🔴 Weak Spots
                </button>
              )}
            </button>
          ))}
        </div>
      </Sky>
    );
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Sky>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-[7rem] leading-none pop-in select-none">
            {pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪'}
          </div>

          <Stars pct={pct} />

          <div className="bubble-card px-12 py-6 text-center">
            <p className="text-5xl font-black text-slate-800">
              {score}<span className="text-2xl text-slate-400">/{questions.length}</span>
            </p>
            <p className="text-yellow-500 font-black text-2xl mt-1">{pct}%</p>
          </div>

          <button onClick={() => start(category, weakOnly)}
            className="w-full max-w-xs bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-2xl py-6 rounded-2xl gummy-btn">
            {t.practice_again}
          </button>
          <button onClick={() => setCategory(null)}
            className="w-full max-w-xs bg-gradient-to-b from-amber-300 to-yellow-500 text-yellow-900 font-black text-xl py-5 rounded-2xl gummy-btn">
            {t.change_category}
          </button>
          <button onClick={() => router.push('/')} className="text-white/60 hover:text-white font-bold text-base underline transition-colors">
            {t.back_home}
          </button>
        </div>
      </Sky>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100;
  return (
    <Sky>
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setCategory(null)} className="sky-card rounded-full w-12 h-12 flex items-center justify-center text-white font-black text-xl gummy-btn">✕</button>

        {/* Progress dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: questions.length }, (_, i) => (
            <div key={i} className={`rounded-full transition-all ${
              i < current + (revealed ? 1 : 0) ? 'bg-yellow-400 w-6 h-3' : i === current ? 'bg-white w-6 h-3' : 'bg-white/30 w-3 h-3'
            }`} />
          ))}
        </div>

        <div className="sky-card rounded-full px-4 py-2 text-yellow-300 font-black text-lg flex items-center gap-1">
          ⭐ {score}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-4 bg-black/20 mx-4 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all duration-300"
             style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(255,220,0,0.8)' }} />
      </div>

      {/* Question */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-3 gap-3">
        <span className="sky-card rounded-full px-5 py-2 text-white/90 text-base font-black">{q.categoryHint}</span>

        {q.promptType === 'text' ? (
          <div className="bubble-card px-8 py-6 max-w-sm w-full text-center">
            <p className="text-slate-800 text-4xl font-black">{q.prompt}</p>
          </div>
        ) : (
          <div className="text-[9rem] leading-none select-none drop-shadow-2xl">{q.prompt}</div>
        )}

        {revealed && (
          <div className="text-center pop-in">
            <p className="text-white/70 text-sm font-black uppercase tracking-widest">{t.correct_answer}</p>
            <p className="text-white text-5xl font-black kid-label mt-1">{q.answer}</p>
            {q.hint && <p className="text-white/50 text-base mt-1">{q.hint}</p>}
          </div>
        )}
      </div>

      {/* Answer buttons — big 2×2 grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 px-4 pb-3">
        {q.options.map((opt, idx) => (
          <button key={opt} onClick={() => submit(opt)} disabled={revealed}
            className={`py-10 rounded-[2rem] font-black text-2xl text-white gummy-btn kid-label transition-all ${btnClass(idx, opt, selected, q.answer, revealed)}`}>
            {opt}
          </button>
        ))}
      </div>

      {/* Next button */}
      {revealed && (
        <div className="relative z-10 px-4 pb-4">
          <button onClick={next}
            className="w-full bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-2xl py-5 rounded-2xl gummy-btn">
            {current + 1 >= questions.length ? `🏁 ${t.see_results}` : t.next}
          </button>
        </div>
      )}
    </Sky>
  );
}
