'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { RoomStateDTO, GameSettings } from '@hangul-quest/shared';
import { getSocket } from '../../../lib/socket';
import { useGameStore } from '../../../lib/store';
import { useRoomSetup } from '../../../lib/useRoomSetup';
import { toast } from 'sonner';
import { playCorrect, playRoundEnd, playGameOver, playTimerTick } from '../../../lib/sounds';
import { recordWrong } from '../../../lib/weakSpots';
import { useT, useLangStore, type Lang } from '../../../lib/i18n';

function LangPill() {
  const { lang, setLang } = useLangStore();
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

interface FloatingReaction { id: number; emoji: string; playerName: string; x: number; }

function speakKorean(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR'; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// Sky wrapper used by every sub-view
function Sky({ children, ground = true }: { children: React.ReactNode; ground?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 flex flex-col relative overflow-hidden">
      {/* Sun */}
      <div className="pointer-events-none select-none absolute top-5 right-6 z-0">
        <div className="w-20 h-20 rounded-full sun-glow"
             style={{ background: 'radial-gradient(circle, #fffde7 0%, #ffd600 55%, #ffb300 100%)' }} />
      </div>
      {/* Cloud */}
      <div className="pointer-events-none absolute top-12 left-2 cloud-a opacity-70 z-0">
        <div className="relative">
          <div className="w-32 h-12 bg-white/80 rounded-full" />
          <div className="absolute -top-6 left-6 w-20 h-16 bg-white/80 rounded-full" />
        </div>
      </div>
      {children}
      {ground && (
        <div className="h-12 bg-gradient-to-b from-lime-400 to-green-600 w-full mt-auto"
             style={{ boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)' }} />
      )}
    </div>
  );
}

// Big vibrant answer button colors
const ANSWER_COLORS = [
  { idle: 'bg-gradient-to-b from-rose-400 to-red-600',     correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-amber-300 to-yellow-500', correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-sky-400 to-blue-600',     correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
  { idle: 'bg-gradient-to-b from-violet-400 to-purple-600', correct: 'bg-gradient-to-b from-emerald-400 to-green-600 ring-4 ring-white/50', wrong: 'bg-gradient-to-b from-gray-500 to-gray-700', dim: 'bg-gradient-to-b from-gray-400 to-gray-500 opacity-40' },
];

function answerClass(idx: number, opt: string, sel: string | null, correct: string | null | undefined, isResult: boolean, answered: boolean) {
  const c = ANSWER_COLORS[idx % 4];
  if (!isResult) {
    if (opt === sel) return `${c.idle} ring-4 ring-white/60 scale-95`;
    if (answered) return c.dim;
    return c.idle;
  }
  if (opt === correct) return c.correct;
  if (opt === sel) return c.wrong;
  return c.dim;
}

function Stars({ pct }: { pct: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {[33, 66, 85].map((t, i) => (
        <span key={i} className={`text-5xl ${pct > t ? 'drop-shadow-lg' : 'opacity-20 grayscale'}`}>⭐</span>
      ))}
    </div>
  );
}

function TimerBar({ expiresAt, timeLimit }: { expiresAt: number; timeLimit: number }) {
  const [pct, setPct] = useState(100);
  const [secs, setSecs] = useState(timeLimit);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const rem = Math.max(0, expiresAt - Date.now());
      setPct((rem / (timeLimit * 1000)) * 100);
      setSecs(Math.ceil(rem / 1000));
      if (rem > 0) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [expiresAt, timeLimit]);
  const color = pct > 50 ? 'from-emerald-400 to-green-600' : pct > 25 ? 'from-amber-300 to-yellow-500' : 'from-rose-400 to-red-600';
  return (
    <div className="px-4 py-2">
      <div className="h-5 bg-black/20 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} transition-all duration-100 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-center text-lg font-black kid-label mt-0.5 ${pct < 25 ? 'text-red-200 animate-pulse' : 'text-white'}`}>{secs}s</p>
    </div>
  );
}

function AutoAdv({ autoAdvanceAt, label }: { autoAdvanceAt: number; label: (n: number) => string }) {
  const [s, setS] = useState(Math.ceil((autoAdvanceAt - Date.now()) / 1000));
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => { setS(Math.ceil(Math.max(0, autoAdvanceAt - Date.now()) / 1000)); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [autoAdvanceAt]);
  return <span className="text-white/60 text-base ml-1">{label(s)}</span>;
}

function ReactionsOverlay({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map(r => (
        <div key={r.id} className="absolute bottom-24" style={{ left: `${r.x}%`, animation: 'floatUp 2s ease-out forwards' }}>
          <div className="text-5xl">{r.emoji}</div>
          <div className="text-xs text-white font-black bg-black/40 rounded-full px-2 mt-1 text-center">{r.playerName}</div>
        </div>
      ))}
    </div>
  );
}

function TeamBanner({ teamScores }: { teamScores: { red: number; blue: number } }) {
  return (
    <div className="flex gap-3 justify-center px-4 py-2">
      <div className="bg-gradient-to-b from-rose-400 to-red-600 rounded-2xl px-5 py-3 font-black text-white gummy-btn flex items-center gap-2 text-lg">🔴 {teamScores.red}</div>
      <div className="text-white/50 font-black self-center text-xl">vs</div>
      <div className="bg-gradient-to-b from-sky-400 to-blue-600 rounded-2xl px-5 py-3 font-black text-white gummy-btn flex items-center gap-2 text-lg">🔵 {teamScores.blue}</div>
    </div>
  );
}

function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n <= 0) { onDone(); return; }
    const t = setTimeout(() => setN(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [n, onDone]);
  if (n <= 0) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <span key={n} className="text-[12rem] font-black text-white kid-title drop-shadow-2xl" style={{ animation: 'pingOnce 0.8s ease-out' }}>{n}</span>
    </div>
  );
}

function ReconnectOverlay({ visible, title, hint }: { visible: boolean; title: string; hint: string }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bubble-card p-8 text-center max-w-xs mx-4">
        <div className="text-6xl mb-3 animate-spin">⏳</div>
        <p className="text-2xl font-black text-slate-800">{title}</p>
        <p className="text-base text-slate-500 mt-2">{hint}</p>
      </div>
    </div>
  );
}

// Colorful player bird badges
const PLAYER_EMOJIS = ['🐦', '🐧', '🦜', '🦆', '🐤', '🦅', '🦉', '🦚'];
const PLAYER_COLORS = [
  'from-rose-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-teal-500',
  'from-lime-400 to-green-500',
];

function PlayerBadge({ name, index, isMe, connected, team, eliminated, streak, score: pts, showTeams }: {
  name: string; index: number; isMe: boolean; connected?: boolean; team?: string; eliminated?: boolean;
  streak?: number; score?: number; showTeams?: boolean;
}) {
  const emoji = PLAYER_EMOJIS[index % PLAYER_EMOJIS.length];
  const color = isMe ? 'from-yellow-400 to-amber-500' : PLAYER_COLORS[index % PLAYER_COLORS.length];
  return (
    <div className={`flex items-center gap-2 bg-gradient-to-b ${color} rounded-2xl px-3 py-2.5 gummy-btn ${!connected ? 'opacity-40' : ''} ${eliminated ? 'opacity-30' : ''}`}>
      <span className="text-2xl select-none">{emoji}</span>
      <span className={`font-black text-white kid-label text-base ${eliminated ? 'line-through' : ''}`}>{name}</span>
      {showTeams && team && <span className={`w-3 h-3 rounded-full ml-1 ${team === 'red' ? 'bg-red-200' : 'bg-sky-200'}`} />}
      {streak && streak >= 2 && <span className="text-xs font-black text-white/90">🔥{streak}</span>}
      {pts !== undefined && <span className="font-black text-white/90 text-sm ml-auto">⭐{pts}</span>}
    </div>
  );
}

function Leaderboard({ players, myId, showTeams }: { players: RoomStateDTO['players']; myId?: string; showTeams?: boolean }) {
  const sorted = [...players].filter(p => !p.isHost).sort((a, b) => b.score - a.score);
  const MEDALS = ['🥇', '🥈', '🥉'];
  return (
    <div className="space-y-2 w-full">
      {sorted.map((p, i) => (
        <div key={p.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl ${p.id === myId ? 'bg-yellow-400/30 ring-2 ring-yellow-400/50' : 'bg-black/10'} ${p.eliminated ? 'opacity-30' : ''}`}>
          <span className="text-xl w-7 text-center">{i < 3 ? MEDALS[i] : `${i + 1}`}</span>
          {showTeams && p.team && <span className={`w-2.5 h-2.5 rounded-full ${p.team === 'red' ? 'bg-red-400' : 'bg-sky-400'}`} />}
          <span className={`flex-1 font-black text-base text-white kid-label ${p.eliminated ? 'line-through' : ''}`}>{p.name}</span>
          {p.streak >= 2 && <span className="text-sm font-black text-yellow-300">🔥{p.streak}</span>}
          <span className="font-black text-yellow-300 text-base kid-label">{p.score}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Host Lobby ───────────────────────────────────────────────────────────────

function HostLobby({ state, roomId, onLeave }: { state: RoomStateDTO; roomId: string; onLeave: () => void }) {
  const socket = getSocket();
  const t = useT();
  const [cat, setCat] = useState<GameSettings['category']>(state.settings.category);
  const [rounds, setRounds] = useState(state.settings.totalRounds);
  const [time, setTime] = useState(state.settings.timeLimit);
  const [autoAdv, setAutoAdv] = useState(state.settings.autoAdvanceDelay ?? 0);
  const [gameMode, setGameMode] = useState<GameSettings['gameMode']>(state.settings.gameMode ?? 'standard');
  const [inputMode, setInputMode] = useState<GameSettings['inputMode']>(state.settings.inputMode ?? 'buttons');
  const [copied, setCopied] = useState(false);
  const [showAdv, setShowAdv] = useState(false);

  const upd = (p: Partial<GameSettings>) => socket.emit('room:settings:update', { roomId, settings: p });
  const start = () => socket.emit('room:start', { roomId }, (r) => { if ('error' in r) toast.error(r.error); });
  const copy = () => { navigator.clipboard.writeText(`${window.location.origin}/?code=${state.roomCode}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const nonHost = state.players.filter(p => !p.isHost);
  const CATS: { id: GameSettings['category']; emoji: string }[] = [
    { id: 'KOREAN_WORDS', emoji: '🇰🇷' },
    { id: 'HANGUL_LETTERS', emoji: '🔤' },
    { id: 'KOREAN_VERBS', emoji: '🏃' },
    { id: 'KOREAN_TO_ENGLISH', emoji: '📝' },
    { id: 'KOREAN_NUMBERS', emoji: '🔢' },
    { id: 'KOREAN_SENTENCES', emoji: '📖' },
  ];

  return (
    <Sky>
      <div className="relative z-10 flex flex-col gap-4 p-4 flex-1 overflow-y-auto">

        {/* Language picker */}
        <div className="flex justify-end">
          <LangPill />
        </div>

        {/* Room code — big bubble card */}
        <div className="bubble-card p-6 text-center mt-2">
          <p className="text-gray-400 text-sm font-black uppercase tracking-widest">{t.room_code_label}</p>
          <p className="text-8xl font-black text-slate-800 tracking-[0.12em] mt-1 kid-title" style={{ WebkitTextStroke: '4px #b34500' }}>{state.roomCode}</p>
          <button onClick={copy} className="mt-2 text-sky-500 hover:text-sky-700 text-base font-black transition-colors">
            {copied ? '✓ ' + t.link_copied : t.copy_link}
          </button>
        </div>

        {/* Category — big emoji buttons */}
        <div className="sky-card p-4 rounded-[2rem]">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest mb-3 text-center">{t.category}</p>
          <div className="grid grid-cols-3 gap-2">
            {CATS.map(c => (
              <button key={c.id} onClick={() => { setCat(c.id); upd({ category: c.id }); }}
                className={`py-2 px-2 rounded-2xl font-black gummy-btn transition-all flex flex-row items-center justify-center gap-2 ${cat === c.id ? 'bg-yellow-400 text-slate-900 ring-2 ring-yellow-300' : 'bg-white/15 text-white'}`}>
                <span className="text-2xl leading-none">{c.emoji}</span>
                <span className="text-xs font-black leading-tight text-center">{t.cat_label(c.id).replace(/^\S+\s/, '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="sky-card p-4 rounded-[2rem]">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest mb-3 text-center">
            {t.players_label(nonHost.filter(p => p.connected).length, state.maxPlayers)}
          </p>
          <div className="flex flex-wrap gap-2">
            {nonHost.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1">
                <PlayerBadge name={p.name} index={i} isMe={false} connected={p.connected} team={p.team} showTeams={gameMode === 'teams'} />
                {gameMode === 'teams' && (
                  <>
                    <button onClick={() => socket.emit('room:assign-team', { roomId, targetId: p.id, team: 'red' })}
                      className={`text-sm font-black rounded-full w-8 h-8 flex items-center justify-center gummy-btn ${p.team === 'red' ? 'bg-rose-500 text-white' : 'bg-white/20 text-white/50'}`}>R</button>
                    <button onClick={() => socket.emit('room:assign-team', { roomId, targetId: p.id, team: 'blue' })}
                      className={`text-sm font-black rounded-full w-8 h-8 flex items-center justify-center gummy-btn ${p.team === 'blue' ? 'bg-sky-500 text-white' : 'bg-white/20 text-white/50'}`}>B</button>
                  </>
                )}
                <button onClick={() => socket.emit('room:kick', { roomId, targetId: p.id })} className="text-white/30 hover:text-red-300 text-base font-black ml-1">✕</button>
              </div>
            ))}
            {!nonHost.length && <p className="text-white/50 text-base font-black">{t.waiting_players}</p>}
          </div>
        </div>

        {/* Advanced settings toggle */}
        <button onClick={() => setShowAdv(v => !v)} className="text-white/60 hover:text-white text-base font-black text-center kid-label">
          {t.settings} {showAdv ? '▲' : '▼'}
        </button>

        {showAdv && (
          <div className="sky-card p-4 rounded-[2rem] flex flex-col gap-4">
            {/* Game mode */}
            <div>
              <p className="text-white/70 text-sm font-black uppercase tracking-widest mb-2 text-center">{t.game_mode}</p>
              <div className="flex gap-2">
                {(['standard', 'teams', 'elimination'] as const).map(m => (
                  <button key={m} onClick={() => { setGameMode(m); upd({ gameMode: m }); }}
                    className={`flex-1 py-3 rounded-2xl font-black text-sm gummy-btn ${gameMode === m ? 'bg-yellow-400 text-slate-900' : 'bg-white/15 text-white/70'}`}>
                    {m === 'standard' ? t.mode_standard : m === 'teams' ? t.mode_teams : t.mode_elimination}
                  </button>
                ))}
              </div>
            </div>
            {/* Input mode */}
            <div>
              <p className="text-white/70 text-sm font-black uppercase tracking-widest mb-2 text-center">{t.answer_mode}</p>
              <div className="flex gap-2">
                {(['buttons', 'typed'] as const).map(m => (
                  <button key={m} onClick={() => { setInputMode(m); upd({ inputMode: m }); }}
                    className={`flex-1 py-3 rounded-2xl font-black text-sm gummy-btn ${inputMode === m ? 'bg-yellow-400 text-slate-900' : 'bg-white/15 text-white/70'}`}>
                    {m === 'buttons' ? t.mode_buttons : t.mode_typed}
                  </button>
                ))}
              </div>
            </div>
            {/* Rounds & time sliders */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-white/70 text-sm font-black text-center">{t.rounds_label(rounds)}</p>
                <input type="range" min={5} max={30} step={5} value={rounds} onChange={e => { setRounds(+e.target.value); upd({ totalRounds: +e.target.value }); }} className="w-full mt-1 accent-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-white/70 text-sm font-black text-center">{t.time_label(time)}</p>
                <input type="range" min={10} max={30} step={5} value={time} onChange={e => { setTime(+e.target.value); upd({ timeLimit: +e.target.value }); }} className="w-full mt-1 accent-yellow-400" />
              </div>
            </div>
            <div>
              <p className="text-white/70 text-sm font-black text-center">{t.auto_advance_label(autoAdv)}</p>
              <input type="range" min={0} max={10} step={1} value={autoAdv} onChange={e => { setAutoAdv(+e.target.value); upd({ autoAdvanceDelay: +e.target.value }); }} className="w-full mt-1 accent-yellow-400" />
            </div>
          </div>
        )}

        {/* BIG Start button */}
        <button onClick={start} disabled={nonHost.length < 1}
          className="bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-3xl py-7 rounded-2xl gummy-btn">
          {t.start_game}
        </button>
        <button onClick={onLeave} className="text-white/40 hover:text-white text-base font-bold text-center underline transition-colors pb-2">{t.close_room}</button>
      </div>
    </Sky>
  );
}

// ─── Host Game ────────────────────────────────────────────────────────────────

function HostGame({ state, roomId, onLeave }: { state: RoomStateDTO; roomId: string; onLeave: () => void }) {
  const socket = getSocket();
  const t = useT();
  const isTeams = state.settings.gameMode === 'teams';
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';
  const q = state.currentQuestion;
  const prevStatus = useRef(state.status);

  useEffect(() => {
    if (prevStatus.current !== 'ROUND_RESULT' && state.status === 'ROUND_RESULT' && state.correctAnswer)
      setTimeout(() => speakKorean(state.correctAnswer!), 600);
    prevStatus.current = state.status;
  }, [state.status, state.correctAnswer]);

  return (
    <Sky ground={false}>
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="sky-card rounded-2xl px-3 py-1.5 font-black text-white text-base kid-label">{t.round_of(state.currentRound, state.settings.totalRounds)}</div>
        <span className="font-black text-white/80 text-base kid-label">{t.cat_label(state.settings.category)}</span>
        <div className="flex gap-2">
          <span className="sky-card rounded-2xl px-3 py-1.5 font-black text-white text-base tracking-widest kid-label">{state.roomCode}</span>
          <button onClick={onLeave} className="sky-card rounded-2xl px-3 py-1.5 font-black text-white text-base gummy-btn">✕</button>
        </div>
      </div>

      {isTeams && state.teamScores && <div className="relative z-10"><TeamBanner teamScores={state.teamScores} /></div>}

      <div className="relative z-10 flex-1 flex gap-3 px-4 pb-4">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {!isOver && q && (
            <>
              <span className="sky-card rounded-full px-5 py-2 text-white/80 text-base font-black">{q.categoryHint}</span>
              {q.promptType === 'text'
                ? <div className="bubble-card px-8 py-6 text-center w-full max-w-sm"><p className="text-slate-800 text-4xl font-black">{q.prompt}</p></div>
                : <div className={`text-[9rem] leading-none select-none transition-all ${isResult ? 'opacity-50 scale-90' : 'drop-shadow-2xl'}`}>{q.prompt}</div>
              }
              {isResult && (
                <div className="text-center pop-in">
                  {state.roundWinner
                    ? <p className="text-yellow-300 text-3xl font-black kid-label">🏆 {state.roundWinner.name}</p>
                    : <p className="text-orange-200 text-2xl font-black kid-label">{t.times_up}</p>}
                  <p className="text-white text-6xl font-black kid-title mt-2">{state.correctAnswer}</p>
                  <button onClick={() => speakKorean(state.correctAnswer ?? '')} className="mt-2 text-white/50 hover:text-white text-base font-black transition-colors">{t.pronounce}</button>
                </div>
              )}
              {!isResult && state.roundExpiresAt && <div className="w-full max-w-xs"><TimerBar expiresAt={state.roundExpiresAt} timeLimit={state.settings.timeLimit} /></div>}
              {isResult && (
                <div className="flex items-center gap-3">
                  <button onClick={() => socket.emit('room:next-round', { roomId })} className="bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-xl px-10 py-5 rounded-2xl gummy-btn">{t.next_round}</button>
                  {state.autoAdvanceAt && <AutoAdv autoAdvanceAt={state.autoAdvanceAt} label={t.auto_in} />}
                </div>
              )}
            </>
          )}
          {isOver && (
            <div className="text-center text-white w-full max-w-xs">
              <p className="text-6xl font-black kid-title mb-3">{t.game_over}</p>
              {isTeams && state.teamScores && (
                <>
                  <TeamBanner teamScores={state.teamScores} />
                  <p className="text-yellow-300 text-2xl font-black kid-label my-2">
                    {state.teamScores.red > state.teamScores.blue ? t.red_wins : state.teamScores.blue > state.teamScores.red ? t.blue_wins : t.tie}
                  </p>
                </>
              )}
              {!isTeams && <p className="text-white/60 text-base mb-3 kid-label">{t.final_rankings}</p>}
              <div className="sky-card rounded-3xl p-3 mb-5"><Leaderboard players={state.players} showTeams={isTeams} /></div>
              <button onClick={() => socket.emit('room:play-again', { roomId })} className="bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-xl px-10 py-5 rounded-2xl gummy-btn">{t.play_again}</button>
            </div>
          )}
        </div>

        {/* Scoreboard sidebar */}
        <div className="w-52 sky-card rounded-3xl p-3 flex flex-col">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest text-center mb-3">{t.scores}</p>
          <Leaderboard players={state.players} showTeams={isTeams} />
        </div>
      </div>
    </Sky>
  );
}

// ─── Player Lobby ─────────────────────────────────────────────────────────────

const CAT_EMOJIS: Record<string, string> = {
  KOREAN_WORDS: '🇰🇷', HANGUL_LETTERS: '🔤', KOREAN_VERBS: '🏃',
  KOREAN_TO_ENGLISH: '📝', KOREAN_NUMBERS: '🔢', KOREAN_SENTENCES: '📖',
};

function PlayerLobby({ state, roomId, myId, onLeave }: { state: RoomStateDTO; roomId: string; myId: string; onLeave: () => void }) {
  const socket = getSocket();
  const t = useT();
  const { setMyName } = useGameStore();
  const me = state.players.find(p => p.id === myId);
  const nonHost = state.players.filter(p => !p.isHost);
  const [nameInput, setNameInput] = useState(me?.name ?? '');
  const [nameSaved, setNameSaved] = useState(false);

  // Keep input in sync if server updates the name (e.g. first load)
  useEffect(() => {
    if (me?.name && !nameSaved) setNameInput(me.name);
  }, [me?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = () => {
    const n = nameInput.trim();
    if (!n || n === me?.name) return;
    socket.emit('player:rename', { roomId, newName: n }, (res) => {
      if ('error' in res) return;
      setMyName(n);
      setNameSaved(true);
    });
  };

  const { category, totalRounds, timeLimit, gameMode, autoAdvanceDelay } = state.settings;

  return (
    <Sky>
      <div className="relative z-10 flex flex-col gap-4 p-4 flex-1 overflow-y-auto">

        {/* Language picker */}
        <div className="flex justify-end">
          <LangPill />
        </div>

        {/* Room code */}
        <div className="text-center mt-2">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest">{t.room_code_label}</p>
          <p className="text-7xl font-black text-white tracking-[0.12em] kid-title">{state.roomCode}</p>
        </div>

        {/* Name editor */}
        <div className="bubble-card p-4 flex flex-col gap-3">
          <p className="text-gray-500 text-sm font-black uppercase tracking-widest text-center">🐣 Your Name</p>
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={e => { setNameInput(e.target.value); setNameSaved(false); }}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
              maxLength={20}
              className="flex-1 bg-amber-50 border-4 border-amber-200 rounded-2xl px-4 py-3 text-2xl font-black text-amber-900 text-center placeholder-amber-200 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={saveName}
              disabled={!nameInput.trim() || nameInput.trim() === me?.name}
              className="bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-xl px-5 rounded-2xl gummy-btn disabled:opacity-40"
            >✓</button>
          </div>
        </div>

        {/* Players */}
        <div className="sky-card p-4 rounded-[2rem]">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest text-center mb-3">
            {t.players_label(nonHost.filter(p => p.connected).length, state.maxPlayers)}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {nonHost.map((p, i) => (
              <PlayerBadge key={p.id} name={p.name} index={i} isMe={p.id === myId}
                connected={p.connected} team={p.team} showTeams={gameMode === 'teams'} />
            ))}
          </div>
        </div>

        {/* Game settings (read-only) */}
        <div className="sky-card p-4 rounded-[2rem]">
          <p className="text-white/70 text-sm font-black uppercase tracking-widest text-center mb-3">{t.settings}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-2xl p-3 flex flex-col items-center gap-1">
              <span className="text-3xl">{CAT_EMOJIS[category] ?? '📖'}</span>
              <span className="text-white text-xs font-black text-center kid-label leading-tight">{t.cat_label(category).replace(/^\S+\s/, '')}</span>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 flex flex-col items-center gap-1">
              <span className="text-3xl">🏁</span>
              <span className="text-white text-xs font-black kid-label">{t.rounds_label(totalRounds)}</span>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 flex flex-col items-center gap-1">
              <span className="text-3xl">⏱️</span>
              <span className="text-white text-xs font-black kid-label">{t.time_label(timeLimit)}</span>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-2 flex-wrap">
            <span className="bg-white/15 rounded-xl px-3 py-1 text-white text-xs font-black kid-label">
              {gameMode === 'standard' ? t.mode_standard : gameMode === 'teams' ? t.mode_teams : t.mode_elimination}
            </span>
            <span className="bg-white/15 rounded-xl px-3 py-1 text-white text-xs font-black kid-label">
              {t.auto_advance_label(autoAdvanceDelay ?? 0)}
            </span>
          </div>
        </div>

        {/* Waiting */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-4 h-4 bg-white/60 rounded-full animate-bounce"
                   style={{ animationDelay: `${i * 0.22}s` }} />
            ))}
          </div>
          <button onClick={onLeave} className="text-white/40 hover:text-white text-base font-bold underline transition-colors">{t.leave}</button>
        </div>

      </div>
    </Sky>
  );
}

// ─── Player Game ──────────────────────────────────────────────────────────────

function PlayerGame({ state, roomId, myId, onLeave, disconnected }: {
  state: RoomStateDTO; roomId: string; myId: string; onLeave: () => void; disconnected: boolean;
}) {
  const socket = getSocket();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [typed, setTyped] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [speedBonus, setSpeedBonus] = useState(0);
  const submitTimeRef = useRef<number | null>(null);
  const rid = useRef(0);
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';
  const isTyped = state.settings.inputMode === 'typed';
  const isTeams = state.settings.gameMode === 'teams';
  const q = state.currentQuestion;
  const me = state.players.find(p => p.id === myId);
  const prevRound = useRef(state.currentRound);
  const prevStatus = useRef(state.status);

  useEffect(() => {
    if (state.currentRound !== prevRound.current || (prevStatus.current !== 'ROUND_ACTIVE' && state.status === 'ROUND_ACTIVE')) {
      setSelected(null); setAnswered(false); setTyped(''); setSpeedBonus(0);
      submitTimeRef.current = null;
      if (state.status === 'ROUND_ACTIVE') setShowCountdown(true);
      prevRound.current = state.currentRound;
    }
    prevStatus.current = state.status;
  }, [state.currentRound, state.status]);

  const onCDone = useCallback(() => setShowCountdown(false), []);

  useEffect(() => {
    if (state.status === 'GAME_OVER') import('canvas-confetti').then(({ default: c }) => c({ particleCount: 200, spread: 120, origin: { y: 0.6 } }));
  }, [state.status]);

  useEffect(() => {
    if (prevStatus.current !== state.status) {
      if (state.status === 'ROUND_RESULT') {
        if (selected === state.correctAnswer) {
          playCorrect();
          // Calculate speed bonus to display
          if (submitTimeRef.current !== null && state.roundStartedAt) {
            const elapsed = submitTimeRef.current - state.roundStartedAt;
            const fraction = elapsed / (state.settings.timeLimit * 1000);
            const bonus = fraction < 0.33 ? 2 : fraction < 0.66 ? 1 : 0;
            if (bonus > 0) setSpeedBonus(bonus);
          }
        } else playRoundEnd();
        if (state.correctAnswer) setTimeout(() => speakKorean(state.correctAnswer!), 700);
        if (selected !== state.correctAnswer && q && state.correctAnswer) recordWrong(q.prompt, state.correctAnswer, state.settings.category);
      } else if (state.status === 'GAME_OVER') playGameOver();
    }
  }, [state.status, state.correctAnswer, selected, q, state.settings.category, state.roundStartedAt, state.settings.timeLimit]);

  const prevSecs = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'ROUND_ACTIVE' || !state.roundExpiresAt) return;
    const s = Math.ceil((state.roundExpiresAt - Date.now()) / 1000);
    if (s <= 3 && s > 0 && s !== prevSecs.current) { prevSecs.current = s; playTimerTick(); }
    if (state.status !== 'ROUND_ACTIVE') prevSecs.current = null;
  });

  useEffect(() => {
    const h = ({ playerId: pid, playerName, emoji }: { playerId: string; playerName: string; emoji: string }) => {
      void pid;
      const id = rid.current++;
      setReactions(p => [...p, { id, emoji, playerName, x: 10 + Math.random() * 80 }]);
      setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2200);
    };
    socket.on('reaction:broadcast', h);
    return () => { socket.off('reaction:broadcast', h); };
  }, [socket]);

  const submit = (ans: string) => {
    if (answered || !q || state.status !== 'ROUND_ACTIVE') return;
    submitTimeRef.current = Date.now();
    setSelected(ans); setAnswered(true);
    socket.emit('answer:submit', { roomId, questionId: q.id, answer: ans });
    playTimerTick();
  };

  // Eliminated screen
  if (me?.eliminated && !isOver) {
    return (
      <Sky>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-5">
          <div className="text-[7rem] select-none">💀</div>
          <p className="text-4xl font-black text-white kid-title">{t.eliminated_title}</p>
          <p className="text-white/60 text-center text-base kid-label">{t.eliminated_watch}</p>
          <div className="sky-card rounded-3xl p-4 w-full max-w-xs">
            {state.players.filter(p => !p.isHost && !p.eliminated).sort((a, b) => b.score - a.score).map(p => (
              <p key={p.id} className="text-center py-1 text-base text-white/70 font-black kid-label">{p.name} — {t.pts(p.score)}</p>
            ))}
          </div>
          <button onClick={onLeave} className="text-white/40 hover:text-white text-base font-bold underline transition-colors">{t.leave}</button>
        </div>
      </Sky>
    );
  }

  // Game over screen
  if (isOver) {
    const sorted = [...state.players].filter(p => !p.isHost).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === myId) + 1;
    const MEDALS = ['🥇', '🥈', '🥉'];
    const pct = me ? Math.round((me.score / Math.max(...sorted.map(p => p.score), 1)) * 100) : 0;
    return (
      <Sky>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 p-6">
          <div className="text-[7rem] leading-none pop-in select-none">{myRank <= 3 ? MEDALS[myRank - 1] : '🎮'}</div>
          <p className="text-5xl font-black text-white kid-title">{t.game_over}</p>
          {isTeams && state.teamScores ? (
            <>
              <TeamBanner teamScores={state.teamScores} />
              <p className="text-yellow-300 text-2xl font-black kid-label">
                {state.teamScores.red > state.teamScores.blue ? t.red_wins : state.teamScores.blue > state.teamScores.red ? t.blue_wins : t.tie}
              </p>
            </>
          ) : (
            <>
              <Stars pct={pct} />
              <div className="bubble-card px-10 py-5 text-center">
                <p className="text-gray-500 text-base font-black">{t.finished_rank(myRank)}</p>
                <p className="text-4xl font-black text-yellow-500 mt-1">{t.pts(me?.score ?? 0)}</p>
              </div>
            </>
          )}
          <div className="sky-card rounded-3xl p-3 w-full max-w-xs"><Leaderboard players={state.players} myId={myId} showTeams={isTeams} /></div>
          <button onClick={onLeave} className="text-white/50 hover:text-white text-base font-bold underline transition-colors">{t.leave}</button>
        </div>
      </Sky>
    );
  }

  return (
    <Sky ground={false}>
      <ReactionsOverlay reactions={reactions} />
      {showCountdown && <CountdownOverlay onDone={onCDone} />}
      <ReconnectOverlay visible={disconnected} title={t.reconnecting} hint={t.reconnect_hint} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="sky-card rounded-full px-4 py-2 text-white font-black text-base kid-label flex items-center gap-1.5">
            {isTeams && me?.team && (
              <span className={`w-3 h-3 rounded-full inline-block ${me.team === 'red' ? 'bg-red-400' : 'bg-blue-400'}`} />
            )}
            {me?.name}
          </span>
          <button onClick={onLeave} className="text-white/30 hover:text-white text-sm font-bold underline transition-colors">{t.leave}</button>
        </div>
        <span className="sky-card rounded-full px-4 py-2 text-white/80 font-black text-base kid-label">{t.round_of(state.currentRound, state.settings.totalRounds)}</span>
        <div className="bg-gradient-to-b from-amber-300 to-yellow-500 rounded-full px-4 py-2 font-black text-slate-900 text-base gummy-btn flex items-center gap-1">
          {me?.streak && me.streak >= 2 && <span>🔥{me.streak} </span>}⭐ {t.pts(me?.score ?? 0)}
        </div>
      </div>

      {isTeams && state.teamScores && <div className="relative z-10"><TeamBanner teamScores={state.teamScores} /></div>}
      {state.status === 'ROUND_ACTIVE' && state.roundExpiresAt && (
        <div className="relative z-10"><TimerBar expiresAt={state.roundExpiresAt} timeLimit={state.settings.timeLimit} /></div>
      )}

      {/* Question area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-2 gap-3" style={{ flex: '0 0 auto' }}>
        {q && (
          <>
            <span className="sky-card rounded-full px-5 py-2 text-white/80 text-base font-black kid-label">{q.categoryHint}</span>
            {q.promptType === 'text'
              ? <div className="bubble-card px-6 py-5 w-full max-w-sm text-center"><p className="text-slate-800 text-4xl font-black">{q.prompt}</p></div>
              : <div className="text-[9rem] leading-none select-none drop-shadow-2xl">{q.prompt}</div>
            }
            {isResult && (
              <div className="text-center pop-in">
                <div className={`inline-block px-5 py-3 rounded-2xl font-black text-xl kid-label gummy-btn ${selected === state.correctAnswer ? 'bg-gradient-to-b from-emerald-400 to-green-600 text-white' : 'bg-gradient-to-b from-rose-400 to-red-600 text-white'}`}>
                  {state.roundWinner?.id === myId ? t.you_got_it : state.roundWinner ? t.player_got_it(state.roundWinner.name) : t.times_up}
                </div>
                {speedBonus > 0 && (
                  <div className="mt-2 pop-in inline-flex items-center gap-1 bg-yellow-400 text-slate-900 font-black text-base px-4 py-1.5 rounded-full gummy-btn">
                    ⚡ +{speedBonus} Speed Bonus!
                  </div>
                )}
                {state.correctAnswer && (
                  <div className="mt-3">
                    <p className="text-white/60 text-sm font-black uppercase tracking-widest">{t.correct_answer}</p>
                    <p className="text-white text-5xl font-black kid-title mt-1">{state.correctAnswer}</p>
                    {q.hint && <p className="text-white/50 text-base mt-1">{q.hint}</p>}
                    <button onClick={() => speakKorean(state.correctAnswer ?? '')} className="mt-1 text-white/50 hover:text-white text-base font-black transition-colors">{t.pronounce}</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Answer buttons — BIG 2×2 grid */}
      {q && (
        isTyped ? (
          <div className="relative z-10 px-4 pb-3 flex flex-col gap-3 flex-1 justify-end">
            <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) submit(typed.trim()); }}
              disabled={answered || isResult} placeholder={t.type_placeholder}
              className="w-full bg-amber-50 border-4 border-amber-200 rounded-2xl px-4 py-5 text-2xl font-black text-amber-900 text-center placeholder-amber-200 focus:outline-none disabled:opacity-50" />
            {!answered && !isResult && (
              <button onClick={() => typed.trim() && submit(typed.trim())} disabled={!typed.trim()}
                className="bg-gradient-to-b from-emerald-400 to-green-600 text-white font-black text-2xl py-5 rounded-2xl gummy-btn disabled:opacity-40">{t.submit}</button>
            )}
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-2 gap-3 px-4 pb-2 flex-1 content-end">
            {q.options.map((opt, idx) => (
              <button key={opt} onClick={() => submit(opt)} disabled={answered || isResult}
                className={`py-10 rounded-[2rem] font-black text-2xl text-white gummy-btn kid-label transition-all ${answerClass(idx, opt, selected, state.correctAnswer, isResult, answered)}`}>
                {opt}
              </button>
            ))}
          </div>
        )
      )}

      {answered && !isResult && (
        <p className="relative z-10 text-white/60 text-base font-black text-center animate-pulse py-2 kid-label">{t.waiting_others}</p>
      )}
      {isResult && (
        <p className="relative z-10 text-white/60 text-base font-black text-center py-1 kid-label">
          {t.waiting_host}{state.autoAdvanceAt && <AutoAdv autoAdvanceAt={state.autoAdvanceAt} label={t.auto_in} />}
        </p>
      )}

      {/* Reaction buttons */}
      {q && (
        <div className="relative z-10 flex gap-2 justify-center py-2 pb-3">
          {['👍','🎉','😱','❤️','😂','🔥'].map(e => (
            <button key={e} onClick={() => socket.emit('reaction:send', { roomId, emoji: e })}
              className="text-2xl bg-white/20 hover:bg-white/30 rounded-full w-12 h-12 flex items-center justify-center active:scale-90 transition-all gummy-btn">{e}</button>
          ))}
        </div>
      )}
    </Sky>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const t = useT();
  const { myId, myName, setMyId, setRoomState, roomState } = useGameStore();
  const [state, setState] = useState<RoomStateDTO | null>(roomState);
  const [disconnected, setDisconnected] = useState(false);

  useRoomSetup(roomId, () => router.push('/'));

  // Effect 2: socket event listeners — safe to re-register on re-render
  useEffect(() => {
    const socket = getSocket();
    const onS = (s: RoomStateDTO) => { setState(s); setRoomState(s); };
    const onD = () => setDisconnected(true);
    const onC = () => { setDisconnected(false); setMyId(socket.id!); };
    const onErr = ({ message }: { message: string }) => { toast.error(message); router.push('/'); };
    socket.on('room:state', onS);
    socket.on('disconnect', onD);
    socket.on('connect', onC);
    socket.on('error:event', onErr);
    return () => {
      socket.off('room:state', onS);
      socket.off('disconnect', onD);
      socket.off('connect', onC);
      socket.off('error:event', onErr);
    };
  }, [setMyId, setRoomState, router]);

  const leave = () => { getSocket().emit('room:leave', { roomId }); localStorage.removeItem(`rct:${roomId}`); router.push('/'); };

  if (!state) {
    return (
      <Sky>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
          <div className="text-[7rem] animate-spin select-none">⏳</div>
          <p className="text-3xl font-black text-white kid-title">{t.connecting_msg}</p>
          {!myName && (
            <button className="text-white/50 hover:text-white text-base underline transition-colors mt-2" onClick={() => router.push('/')}>
              {t.go_back_home}
            </button>
          )}
        </div>
      </Sky>
    );
  }

  const eid = myId || getSocket().id || '';
  const amHost = state.hostId === eid;
  if (state.status === 'LOBBY') return amHost ? <HostLobby state={state} roomId={roomId} onLeave={leave} /> : <PlayerLobby state={state} roomId={roomId} myId={eid} onLeave={leave} />;
  return amHost ? <HostGame state={state} roomId={roomId} onLeave={leave} /> : <PlayerGame state={state} roomId={roomId} myId={eid} onLeave={leave} disconnected={disconnected} />;
}
