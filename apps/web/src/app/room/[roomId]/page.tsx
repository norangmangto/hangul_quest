'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { RoomStateDTO, GameSettings } from '@hangul-quest/shared';
import { getSocket } from '../../../lib/socket';
import { useGameStore } from '../../../lib/store';
import { toast } from 'sonner';
import { playCorrect, playWrong, playRoundEnd, playGameOver, playTimerTick } from '../../../lib/sounds';
import { recordWrong } from '../../../lib/weakSpots';

// ─── Reaction types ───────────────────────────────────────────────────────────

interface FloatingReaction {
  id: number;
  emoji: string;
  playerName: string;
  x: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryLabel(cat: GameSettings['category']): string {
  switch (cat) {
    case 'KOREAN_WORDS': return '📖 Korean Words';
    case 'HANGUL_LETTERS': return '🔤 Hangul Letters';
    case 'KOREAN_VERBS': return '🏃 Korean Verbs';
    case 'KOREAN_TO_ENGLISH': return '🌐 Korean → English';
    case 'KOREAN_NUMBERS': return '🔢 Korean Numbers';
    case 'KOREAN_SENTENCES': return '💬 Korean Sentences';
  }
}

function speakKorean(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ko-KR';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Scoreboard({ players, highlightId, showTeams }: {
  players: RoomStateDTO['players'];
  highlightId?: string;
  showTeams?: boolean;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full space-y-2">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            p.id === highlightId ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-white/60 dark:bg-gray-700/60'
          } ${!p.connected ? 'opacity-50' : ''} ${p.eliminated ? 'opacity-40' : ''}`}
        >
          <span className="text-2xl font-black text-gray-400 w-8">{i + 1}</span>
          {showTeams && p.team && (
            <span className={`w-3 h-3 rounded-full ${p.team === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
          )}
          <span className={`flex-1 font-bold text-lg truncate ${p.eliminated ? 'line-through text-gray-400' : ''}`}>
            {p.name}{p.isHost ? ' 👑' : ''}
          </span>
          {p.streak >= 2 && !p.eliminated && (
            <span className="text-sm font-black text-orange-500">🔥{p.streak}</span>
          )}
          {p.eliminated && <span className="text-xs text-red-400 font-bold">OUT</span>}
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">{p.score}</span>
        </div>
      ))}
    </div>
  );
}

function TimerBar({ expiresAt, timeLimit }: { expiresAt: number; timeLimit: number }) {
  const [pct, setPct] = useState(100);
  const [secs, setSecs] = useState(timeLimit);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      const fraction = remaining / (timeLimit * 1000);
      setPct(fraction * 100);
      setSecs(Math.ceil(remaining / 1000));
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [expiresAt, timeLimit]);

  const color = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-100 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-center text-sm font-bold mt-1 ${pct < 25 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
        {secs}s
      </p>
    </div>
  );
}

function AutoAdvanceCountdown({ autoAdvanceAt }: { autoAdvanceAt: number }) {
  const [secs, setSecs] = useState(Math.ceil((autoAdvanceAt - Date.now()) / 1000));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, autoAdvanceAt - Date.now());
      setSecs(Math.ceil(remaining / 1000));
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [autoAdvanceAt]);

  return <span className="text-white/60 text-sm ml-2">(auto in {secs}s)</span>;
}

function ReactionsOverlay({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map(r => (
        <div
          key={r.id}
          className="absolute bottom-24 animate-bounce"
          style={{ left: `${r.x}%`, animation: 'floatUp 2s ease-out forwards' }}
        >
          <div className="text-center">
            <div className="text-4xl">{r.emoji}</div>
            <div className="text-xs text-white font-bold bg-black/40 rounded-full px-2 py-0.5 mt-1">{r.playerName}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReactionBar({ onReact }: { onReact: (emoji: string) => void }) {
  const EMOJIS = ['👍', '🎉', '😱', '❤️', '😂', '🔥'];
  return (
    <div className="flex gap-2 justify-center mt-3">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => onReact(e)}
          className="text-2xl bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center transition-all active:scale-90"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function TeamScoresBanner({ teamScores }: { teamScores: { red: number; blue: number } }) {
  return (
    <div className="flex gap-3 justify-center px-4 mb-2">
      <div className="flex items-center gap-2 bg-red-500/80 rounded-xl px-4 py-1.5 text-white font-bold">
        <span className="text-lg">🔴</span>
        <span>{teamScores.red}</span>
      </div>
      <div className="text-white font-bold self-center text-sm opacity-60">vs</div>
      <div className="flex items-center gap-2 bg-blue-500/80 rounded-xl px-4 py-1.5 text-white font-bold">
        <span className="text-lg">🔵</span>
        <span>{teamScores.blue}</span>
      </div>
    </div>
  );
}

/** 3-2-1 overlay — shown for 3s at start of each ROUND_ACTIVE */
function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [count, onDone]);

  if (count <= 0) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <span
        key={count}
        className="text-[12rem] font-black text-white drop-shadow-2xl"
        style={{ animation: 'pingOnce 0.8s ease-out' }}
      >
        {count}
      </span>
    </div>
  );
}

/** Reconnect overlay — shown when socket disconnects */
function ReconnectOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-2xl max-w-xs mx-4">
        <div className="text-6xl mb-4 animate-spin">⏳</div>
        <p className="text-xl font-extrabold text-gray-800 dark:text-white">Reconnecting...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Hang tight, we&apos;ll get you back in!</p>
      </div>
    </div>
  );
}

// ─── Host view ────────────────────────────────────────────────────────────────

function HostLobby({ state, roomId, onLeave }: { state: RoomStateDTO; roomId: string; onLeave: () => void }) {
  const socket = getSocket();
  const [category, setCategory] = useState<GameSettings['category']>(state.settings.category);
  const [rounds, setRounds] = useState(state.settings.totalRounds);
  const [timeLimit, setTimeLimit] = useState(state.settings.timeLimit);
  const [autoAdvance, setAutoAdvance] = useState(state.settings.autoAdvanceDelay ?? 0);
  const [gameMode, setGameMode] = useState<GameSettings['gameMode']>(state.settings.gameMode ?? 'standard');
  const [inputMode, setInputMode] = useState<GameSettings['inputMode']>(state.settings.inputMode ?? 'buttons');
  const [copied, setCopied] = useState(false);

  const updateSettings = (patch: Partial<GameSettings>) => {
    socket.emit('room:settings:update', { roomId, settings: patch });
  };

  const start = () => {
    socket.emit('room:start', { roomId }, (res) => {
      if ('error' in res) toast.error(res.error);
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/?code=${state.roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const nonHostPlayers = state.players.filter(p => !p.isHost);
  const ALL_CATEGORIES: GameSettings['category'][] = [
    'KOREAN_WORDS', 'HANGUL_LETTERS', 'KOREAN_VERBS', 'KOREAN_TO_ENGLISH', 'KOREAN_NUMBERS', 'KOREAN_SENTENCES',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 gap-6">
      {/* Room code banner */}
      <div className="bg-white rounded-3xl shadow-xl px-8 py-5 text-center">
        <p className="text-gray-500 text-sm font-semibold">Room Code</p>
        <p className="text-6xl font-black tracking-widest text-indigo-600 mt-1">{state.roomCode}</p>
        <button
          onClick={copyLink}
          className="mt-2 text-sm font-semibold text-indigo-500 hover:text-indigo-700 transition-all"
        >
          {copied ? '✓ Link copied!' : '🔗 Copy invite link'}
        </button>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 gap-4">
        {/* Settings */}
        <div className="bg-white/20 rounded-3xl p-5 text-white">
          <h2 className="font-bold text-lg mb-3">⚙️ Settings</h2>

          {/* Category */}
          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); updateSettings({ category: cat }); }}
                  className={`py-2 px-3 rounded-xl font-semibold text-sm transition-all ${category === cat ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode */}
          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">Game Mode</p>
            <div className="flex gap-2">
              {(['standard', 'teams', 'elimination'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setGameMode(mode); updateSettings({ gameMode: mode }); }}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${gameMode === mode ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}
                >
                  {mode === 'standard' ? '🎮 Standard' : mode === 'teams' ? '🔴🔵 Teams' : '💀 Elimination'}
                </button>
              ))}
            </div>
          </div>

          {/* Input Mode */}
          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">Answer Mode</p>
            <div className="flex gap-2">
              {(['buttons', 'typed'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); updateSettings({ inputMode: mode }); }}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${inputMode === mode ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}
                >
                  {mode === 'buttons' ? '🔲 Buttons' : '⌨️ Typed'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold">Rounds: {rounds}</label>
              <input type="range" min={5} max={30} step={5} value={rounds}
                onChange={e => { setRounds(Number(e.target.value)); updateSettings({ totalRounds: Number(e.target.value) }); }}
                className="w-full mt-1 accent-yellow-400" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold">Time: {timeLimit}s</label>
              <input type="range" min={10} max={30} step={5} value={timeLimit}
                onChange={e => { setTimeLimit(Number(e.target.value)); updateSettings({ timeLimit: Number(e.target.value) }); }}
                className="w-full mt-1 accent-yellow-400" />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-sm font-semibold">
              Auto-advance: {autoAdvance === 0 ? 'Off' : `${autoAdvance}s`}
            </label>
            <input type="range" min={0} max={10} step={1} value={autoAdvance}
              onChange={e => { setAutoAdvance(Number(e.target.value)); updateSettings({ autoAdvanceDelay: Number(e.target.value) }); }}
              className="w-full mt-1 accent-yellow-400" />
            <p className="text-xs text-white/60 mt-1">Automatically start next round after result</p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white/20 rounded-3xl p-5 text-white">
          <h2 className="font-bold text-lg mb-3">
            👥 Players ({nonHostPlayers.filter(p => p.connected).length}/{state.maxPlayers})
          </h2>

          {gameMode === 'teams' && nonHostPlayers.length > 0 && (
            <p className="text-xs text-white/60 mb-2">Assign teams before starting:</p>
          )}

          <div className="flex flex-wrap gap-2">
            {nonHostPlayers.map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  p.connected ? (
                    p.team === 'red' ? 'bg-red-400/80' :
                    p.team === 'blue' ? 'bg-blue-400/80' :
                    'bg-white/30'
                  ) : 'bg-white/10 opacity-50'
                }`}>
                  {p.name}
                </span>
                {gameMode === 'teams' && (
                  <>
                    <button
                      onClick={() => socket.emit('room:assign-team', { roomId, targetId: p.id, team: 'red' })}
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-all ${p.team === 'red' ? 'bg-red-400 text-white' : 'bg-white/20 hover:bg-red-300'}`}
                      title="Red team"
                    >R</button>
                    <button
                      onClick={() => socket.emit('room:assign-team', { roomId, targetId: p.id, team: 'blue' })}
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-all ${p.team === 'blue' ? 'bg-blue-400 text-white' : 'bg-white/20 hover:bg-blue-300'}`}
                      title="Blue team"
                    >B</button>
                  </>
                )}
                <button
                  onClick={() => socket.emit('room:kick', { roomId, targetId: p.id })}
                  className="text-white/50 hover:text-red-300 text-xs font-bold transition-all"
                  title={`Kick ${p.name}`}
                >✕</button>
              </div>
            ))}
            {nonHostPlayers.length === 0 && (
              <p className="text-white/50 text-sm">Waiting for players to join...</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={start}
        disabled={nonHostPlayers.length < 1}
        className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-400 text-gray-900 font-extrabold text-2xl px-16 py-5 rounded-3xl shadow-xl transition-all active:scale-95"
      >
        🎮 Start Game!
      </button>

      <button
        onClick={onLeave}
        className="text-white/70 hover:text-white text-sm font-semibold underline transition-all"
      >
        ✕ Close Room
      </button>
    </div>
  );
}

function HostGame({ state, roomId, onLeave }: { state: RoomStateDTO; roomId: string; onLeave: () => void }) {
  const socket = getSocket();
  const isTeams = state.settings.gameMode === 'teams';

  const nextRound = () => socket.emit('room:next-round', { roomId });
  const playAgain = () => socket.emit('room:play-again', { roomId });

  const q = state.currentQuestion;
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';

  // Audio pronunciation on round result
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if (prevStatusRef.current !== 'ROUND_RESULT' && state.status === 'ROUND_RESULT') {
      if (state.correctAnswer) {
        // Small delay so the result is visible first
        setTimeout(() => speakKorean(state.correctAnswer!), 600);
      }
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.correctAnswer]);

  const promptDisplay = q ? (
    q.promptType === 'text' ? (
      <div className="bg-white/20 rounded-2xl px-8 py-5 max-w-sm text-center">
        <p className="text-white text-2xl font-bold">{q.prompt}</p>
      </div>
    ) : (
      <div className={`text-[10rem] leading-none select-none transition-all duration-300 ${isResult ? 'opacity-70 scale-90' : 'drop-shadow-2xl'}`}>
        {q.prompt}
      </div>
    )
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-800 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div className="bg-white/20 rounded-xl px-4 py-2">
          <span className="font-bold">Round {state.currentRound} / {state.settings.totalRounds}</span>
        </div>
        <div className="text-center">
          <span className="font-bold text-lg">{categoryLabel(state.settings.category)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <span className="font-mono font-bold">{state.roomCode}</span>
          </div>
          <button
            onClick={onLeave}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl transition-all text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Team scores */}
      {isTeams && state.teamScores && <TeamScoresBanner teamScores={state.teamScores} />}

      {/* Main content */}
      <div className="flex-1 flex gap-4 px-6 pb-6">
        {/* Left: question display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {!isOver && q && (
            <>
              <p className="text-white/70 text-xl font-semibold mb-2">{q.categoryHint}</p>
              {promptDisplay}

              {isResult && (
                <div className="mt-6 text-center animate-bounce">
                  {state.roundWinner ? (
                    <>
                      <p className="text-yellow-300 text-3xl font-black">🏆 {state.roundWinner.name}!</p>
                      <p className="text-white text-5xl font-black mt-2">{state.correctAnswer}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-orange-300 text-2xl font-bold">⏰ Time&apos;s up!</p>
                      <p className="text-white text-5xl font-black mt-2">{state.correctAnswer}</p>
                    </>
                  )}
                  {q.hint && (
                    <p className="text-white/60 text-sm mt-2">{q.hint}</p>
                  )}
                  <button
                    onClick={() => speakKorean(state.correctAnswer ?? '')}
                    className="mt-3 text-white/70 hover:text-white text-sm font-semibold transition-all"
                    title="Pronounce"
                  >
                    🔊 Pronounce
                  </button>
                </div>
              )}

              {!isResult && state.roundExpiresAt && (
                <div className="w-64 mt-8">
                  <TimerBar expiresAt={state.roundExpiresAt} timeLimit={state.settings.timeLimit} />
                </div>
              )}

              {isResult && (
                <div className="mt-8 text-center">
                  <button onClick={nextRound} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg transition-all active:scale-95">
                    Next Round →
                  </button>
                  {state.autoAdvanceAt && <AutoAdvanceCountdown autoAdvanceAt={state.autoAdvanceAt} />}
                </div>
              )}
            </>
          )}

          {isOver && (
            <div className="text-center text-white w-full max-w-sm">
              <p className="text-5xl font-black mb-1">🎉 Game Over!</p>
              {isTeams && state.teamScores ? (
                <div className="mb-4">
                  <p className="text-xl text-white/70 mb-2">Team Scores</p>
                  <div className="flex gap-4 justify-center">
                    <div className="bg-red-500/60 rounded-2xl px-6 py-3 text-center">
                      <p className="text-lg font-bold">🔴 Red</p>
                      <p className="text-3xl font-black">{state.teamScores.red}</p>
                    </div>
                    <div className="bg-blue-500/60 rounded-2xl px-6 py-3 text-center">
                      <p className="text-lg font-bold">🔵 Blue</p>
                      <p className="text-3xl font-black">{state.teamScores.blue}</p>
                    </div>
                  </div>
                  {state.teamScores.red > state.teamScores.blue ? (
                    <p className="text-yellow-300 text-2xl font-black mt-2">🔴 Red Wins!</p>
                  ) : state.teamScores.blue > state.teamScores.red ? (
                    <p className="text-yellow-300 text-2xl font-black mt-2">🔵 Blue Wins!</p>
                  ) : (
                    <p className="text-yellow-300 text-2xl font-black mt-2">🤝 Tie!</p>
                  )}
                </div>
              ) : (
                <p className="text-xl text-white/70 mb-6">Final Rankings</p>
              )}
              <div className="bg-white/10 rounded-3xl p-4 mb-6 space-y-2">
                {[...state.players].filter(p => !p.isHost).sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl">
                    <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    {isTeams && p.team && (
                      <span className={`w-3 h-3 rounded-full ${p.team === 'red' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    )}
                    <span className="flex-1 font-bold text-lg truncate text-left">{p.name}</span>
                    <span className="text-2xl font-black text-yellow-300">{p.score}</span>
                  </div>
                ))}
              </div>
              <button onClick={playAgain} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg transition-all">
                🔄 Play Again
              </button>
            </div>
          )}
        </div>

        {/* Right: scoreboard */}
        <div className="w-72 bg-white/10 rounded-3xl p-4 flex flex-col gap-2">
          <h2 className="text-white font-bold text-lg text-center mb-2">🏆 Scores</h2>
          <Scoreboard
            players={state.players.filter(p => !p.isHost)}
            highlightId={state.roundWinner?.id}
            showTeams={isTeams}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Player view ──────────────────────────────────────────────────────────────

function PlayerLobby({ state, myId, onLeave }: { state: RoomStateDTO; myId: string; onLeave: () => void }) {
  const me = state.players.find(p => p.id === myId);
  const host = state.players.find(p => p.isHost);
  const nonHostPlayers = state.players.filter(p => !p.isHost);
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col items-center justify-center p-6 gap-6 text-white">
      <div className="text-7xl">🎮</div>
      <div className="text-center">
        <p className="text-2xl font-bold">{me?.name ?? 'Player'}</p>
        <p className="text-sky-200 text-sm">waiting for host to start...</p>
        {host && <p className="text-sky-100 text-xs mt-1">Hosted by {host.name}</p>}
      </div>
      <div className="bg-white/20 rounded-3xl px-8 py-4 text-center">
        <p className="text-sm font-semibold text-sky-100">Room Code</p>
        <p className="text-4xl font-black tracking-widest">{state.roomCode}</p>
      </div>
      <div className="bg-white/10 rounded-3xl p-4 w-full max-w-xs">
        <p className="font-semibold text-center mb-3">
          Players ({nonHostPlayers.length}/{state.maxPlayers})
        </p>
        {nonHostPlayers.map(p => (
          <p key={p.id} className={`text-center py-1 rounded-lg ${p.id === myId ? 'bg-white/30 font-bold px-2' : ''}`}>
            {p.name}{p.id === myId ? ' 👤' : ''}
            {state.settings.gameMode === 'teams' && p.team && (
              <span className={`ml-2 text-xs font-bold ${p.team === 'red' ? 'text-red-200' : 'text-blue-200'}`}>
                {p.team === 'red' ? '🔴' : '🔵'}
              </span>
            )}
          </p>
        ))}
      </div>
      <div className="flex gap-2 animate-pulse">
        <div className="w-2 h-2 bg-white rounded-full" />
        <div className="w-2 h-2 bg-white rounded-full delay-100" />
        <div className="w-2 h-2 bg-white rounded-full delay-200" />
      </div>
      <button
        onClick={onLeave}
        className="text-white/70 hover:text-white text-sm font-semibold underline transition-all"
      >
        ← Leave
      </button>
    </div>
  );
}

function PlayerGame({ state, roomId, myId, onLeave, disconnected }: {
  state: RoomStateDTO;
  roomId: string;
  myId: string;
  onLeave: () => void;
  disconnected: boolean;
}) {
  const socket = getSocket();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const reactionCounterRef = useRef(0);
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';
  const isTyped = state.settings.inputMode === 'typed';
  const isTeams = state.settings.gameMode === 'teams';
  const q = state.currentQuestion;
  const me = state.players.find(p => p.id === myId);
  const prevRoundRef = useRef(state.currentRound);
  const prevStatusRef = useRef(state.status);

  // Reset on new round + show 3-2-1 countdown
  useEffect(() => {
    if (state.currentRound !== prevRoundRef.current || (prevStatusRef.current !== 'ROUND_ACTIVE' && state.status === 'ROUND_ACTIVE')) {
      setSelected(null);
      setAnswered(false);
      setTypedAnswer('');
      if (state.status === 'ROUND_ACTIVE') {
        setShowCountdown(true);
      }
      prevRoundRef.current = state.currentRound;
    }
    prevStatusRef.current = state.status;
  }, [state.currentRound, state.status]);

  const handleCountdownDone = useCallback(() => setShowCountdown(false), []);

  // Confetti on game over
  useEffect(() => {
    if (state.status === 'GAME_OVER') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      });
    }
  }, [state.status]);

  // Sound: round result
  useEffect(() => {
    if (prevStatusRef.current !== state.status) {
      if (state.status === 'ROUND_RESULT') {
        const correct = selected === state.correctAnswer;
        if (correct) playCorrect();
        else playRoundEnd();
        // Audio pronunciation
        if (state.correctAnswer) {
          setTimeout(() => speakKorean(state.correctAnswer!), 700);
        }
        // Spaced repetition: record wrong answer
        if (!correct && q && state.correctAnswer) {
          recordWrong(q.prompt, state.correctAnswer, state.settings.category);
        }
      } else if (state.status === 'GAME_OVER') {
        playGameOver();
      }
    }
  }, [state.status, state.correctAnswer, selected, q, state.settings.category]);

  // Sound: timer tick when <= 3s remaining
  const prevSecsRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'ROUND_ACTIVE' || !state.roundExpiresAt) return;
    const secs = Math.ceil((state.roundExpiresAt - Date.now()) / 1000);
    if (secs <= 3 && secs > 0 && secs !== prevSecsRef.current) {
      prevSecsRef.current = secs;
      playTimerTick();
    }
    if (state.status !== 'ROUND_ACTIVE') prevSecsRef.current = null;
  });

  // Listen for reactions
  useEffect(() => {
    const handler = ({ playerId: pid, playerName, emoji }: { playerId: string; playerName: string; emoji: string }) => {
      void pid;
      const id = reactionCounterRef.current++;
      const x = 10 + Math.random() * 80;
      setReactions(prev => [...prev, { id, emoji, playerName, x }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2200);
    };
    socket.on('reaction:broadcast', handler);
    return () => { socket.off('reaction:broadcast', handler); };
  }, [socket]);

  const submitAnswer = (answer: string) => {
    if (answered || !q || state.status !== 'ROUND_ACTIVE') return;
    setSelected(answer);
    setAnswered(true);
    socket.emit('answer:submit', { roomId, questionId: q.id, answer });
    playTimerTick();
  };

  const submitTyped = () => {
    const ans = typedAnswer.trim();
    if (!ans) return;
    submitAnswer(ans);
  };

  const sendReaction = (emoji: string) => {
    socket.emit('reaction:send', { roomId, emoji });
  };

  const optionColor = (opt: string) => {
    if (!isResult) {
      if (opt === selected) return 'bg-indigo-500 text-white ring-4 ring-indigo-300 scale-95';
      if (answered) return 'bg-gray-200 text-gray-400';
      return 'bg-white text-gray-800 hover:bg-indigo-50 active:scale-95';
    }
    if (opt === state.correctAnswer) return 'bg-emerald-400 text-white ring-4 ring-emerald-200';
    if (opt === selected && opt !== state.correctAnswer) return 'bg-red-400 text-white';
    return 'bg-gray-100 text-gray-400';
  };

  // Elimination: show eliminated screen
  if (me?.eliminated && !isOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-700 to-gray-900 flex flex-col items-center justify-center p-6 text-white gap-5">
        <div className="text-8xl">💀</div>
        <p className="text-4xl font-extrabold">Eliminated!</p>
        <p className="text-lg text-gray-300 text-center">You answered incorrectly.</p>
        <p className="text-gray-400 text-sm text-center">Watch the rest of the game...</p>
        <div className="bg-white/10 rounded-3xl p-4 w-full max-w-xs">
          <p className="font-semibold text-center mb-2 text-sm">Remaining Players</p>
          {state.players
            .filter(p => !p.isHost && !p.eliminated)
            .sort((a, b) => b.score - a.score)
            .map(p => (
              <p key={p.id} className="text-center py-1 text-sm">{p.name} — {p.score} pts</p>
            ))}
        </div>
        <button
          onClick={onLeave}
          className="text-white/70 hover:text-white text-sm font-semibold underline transition-all mt-2"
        >
          ← Leave
        </button>
      </div>
    );
  }

  if (isOver) {
    const sorted = [...state.players].filter(p => !p.isHost).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === myId) + 1;
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 text-white gap-4">
        {isTeams && state.teamScores ? (
          <>
            <div className="text-6xl">{
              (me?.team === 'red' && state.teamScores.red > state.teamScores.blue) ||
              (me?.team === 'blue' && state.teamScores.blue > state.teamScores.red) ? '🏆' : '🎮'
            }</div>
            <p className="text-3xl font-black">Game Over!</p>
            <TeamScoresBanner teamScores={state.teamScores} />
            {state.teamScores.red > state.teamScores.blue ? (
              <p className="text-2xl font-black text-yellow-300">🔴 Red Team Wins!</p>
            ) : state.teamScores.blue > state.teamScores.red ? (
              <p className="text-2xl font-black text-yellow-300">🔵 Blue Team Wins!</p>
            ) : (
              <p className="text-2xl font-black text-yellow-300">🤝 Tie!</p>
            )}
          </>
        ) : (
          <>
            <div className="text-6xl">{myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎮'}</div>
            <p className="text-3xl font-black">Game Over!</p>
            <p className="text-xl">You finished #{myRank}</p>
            <p className="text-4xl font-black">{me?.score ?? 0} pts</p>
          </>
        )}
        <div className="bg-white/10 rounded-3xl p-4 w-full max-w-xs mt-4">
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex justify-between py-2 px-3 rounded-xl ${p.id === myId ? 'bg-white/20' : ''}`}>
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {p.name}</span>
              <span className="font-bold">{p.score}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onLeave}
          className="text-white/70 hover:text-white text-sm font-semibold underline transition-all mt-2"
        >
          ← Leave
        </button>
      </div>
    );
  }

  const promptDisplay = q ? (
    q.promptType === 'text' ? (
      <div className="bg-white/20 rounded-2xl px-6 py-4 max-w-sm text-center w-full">
        <p className="text-white text-xl font-bold">{q.prompt}</p>
      </div>
    ) : (
      <div className="text-[8rem] leading-none select-none">{q.prompt}</div>
    )
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col">
      <ReactionsOverlay reactions={reactions} />
      {showCountdown && <CountdownOverlay onDone={handleCountdownDone} />}
      <ReconnectOverlay visible={disconnected} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">{me?.name ?? ''}</div>
          <button
            onClick={onLeave}
            className="text-white/60 hover:text-white text-xs font-semibold underline transition-all"
          >
            ← Leave
          </button>
        </div>
        <div className="text-sm font-bold">Round {state.currentRound}/{state.settings.totalRounds}</div>
        <div className="text-sm font-bold flex items-center gap-1">
          {me && me.streak >= 2 && <span className="text-orange-300">🔥{me.streak}</span>}
          ⭐ {me?.score ?? 0} pts
        </div>
      </div>

      {/* Team scores */}
      {isTeams && state.teamScores && <TeamScoresBanner teamScores={state.teamScores} />}

      {/* Timer */}
      {state.status === 'ROUND_ACTIVE' && state.roundExpiresAt && (
        <div className="px-4">
          <TimerBar expiresAt={state.roundExpiresAt} timeLimit={state.settings.timeLimit} />
        </div>
      )}

      {/* Question prompt */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 gap-4">
        {q && (
          <>
            <p className="text-white/80 text-sm font-semibold">{q.categoryHint}</p>
            {promptDisplay}

            {/* Result banner + correct answer callout */}
            {isResult && (
              <>
                <div className={`text-center py-3 px-6 rounded-2xl font-black text-xl ${
                  selected === state.correctAnswer ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white'
                }`}>
                  {state.roundWinner?.id === myId
                    ? '🏆 You got it!'
                    : state.roundWinner
                      ? `${state.roundWinner.name} got it!`
                      : "⏰ Time's up!"}
                </div>
                {state.correctAnswer && (
                  <div className="text-center">
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Correct Answer</p>
                    <p className="text-white text-4xl font-black">{state.correctAnswer}</p>
                    {q.hint && <p className="text-white/60 text-sm mt-1">{q.hint}</p>}
                    <button
                      onClick={() => speakKorean(state.correctAnswer ?? '')}
                      className="mt-2 text-white/70 hover:text-white text-sm font-semibold transition-all"
                    >
                      🔊 Pronounce
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Answer input */}
            {isTyped ? (
              <div className="w-full max-w-sm flex flex-col gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitTyped(); }}
                  disabled={answered || isResult}
                  placeholder="Type your answer..."
                  className="w-full border-2 border-white/40 bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 text-xl font-bold text-center focus:outline-none focus:border-white disabled:opacity-50"
                />
                {!answered && !isResult && (
                  <button
                    onClick={submitTyped}
                    disabled={!typedAnswer.trim()}
                    className="bg-white text-indigo-700 font-extrabold py-3 rounded-2xl disabled:opacity-50 transition-all"
                  >
                    Submit
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => submitAnswer(opt)}
                    disabled={answered || isResult}
                    className={`py-5 px-2 rounded-2xl font-black text-xl shadow-lg transition-all ${optionColor(opt)}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {answered && !isResult && (
              <p className="text-white/80 text-sm animate-pulse mt-2">Waiting for others...</p>
            )}

            {isResult && (
              <p className="text-white/70 text-sm animate-pulse mt-1">
                Waiting for host...
                {state.autoAdvanceAt && <AutoAdvanceCountdown autoAdvanceAt={state.autoAdvanceAt} />}
              </p>
            )}

            {/* Reaction bar */}
            <ReactionBar onReact={sendReaction} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { myId, myName, setMyId, setRoomState, roomState } = useGameStore();
  const [state, setState] = useState<RoomStateDTO | null>(roomState);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    if (socket.id && !myId) setMyId(socket.id);

    const onState = (s: RoomStateDTO) => {
      setState(s);
      setRoomState(s);
    };
    const onDisconnect = () => setDisconnected(true);
    const onConnect = () => setDisconnected(false);

    socket.on('room:state', onState);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    socket.on('error:event', ({ message }) => {
      toast.error(message);
      router.push('/');
    });

    const token = localStorage.getItem(`rct:${roomId}`);
    if (token) {
      const doRejoin = () => {
        socket.emit('room:rejoin', { roomId, token }, (res) => {
          if ('error' in res) {
            localStorage.removeItem(`rct:${roomId}`);
            router.push('/');
          }
        });
      };
      if (socket.connected) doRejoin();
      else socket.once('connect', doRejoin);
    } else {
      const doSync = () => socket.emit('room:sync', { roomId });
      if (socket.connected) doSync();
      else socket.once('connect', doSync);
    }

    return () => {
      socket.off('room:state', onState);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.off('connect');
    };
  }, [myId, setMyId, setRoomState, router, roomId]);

  useEffect(() => {
    const socket = getSocket();
    const handleConnect = () => setMyId(socket.id!);
    socket.on('connect', handleConnect);
    return () => { socket.off('connect', handleConnect); };
  }, [setMyId]);

  const leaveRoom = () => {
    getSocket().emit('room:leave', { roomId });
    localStorage.removeItem(`rct:${roomId}`);
    router.push('/');
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">⏳</div>
          <p className="text-xl font-bold">Connecting...</p>
          {!myName && (
            <p className="text-sm text-indigo-200 mt-2">
              If you refreshed the page, <button className="underline" onClick={() => router.push('/')}>go back home</button>
            </p>
          )}
        </div>
      </div>
    );
  }

  const effectiveId = myId || getSocket().id || '';
  const amHost = state.hostId === effectiveId;

  if (state.status === 'LOBBY') {
    return amHost
      ? <HostLobby state={state} roomId={roomId} onLeave={leaveRoom} />
      : <PlayerLobby state={state} myId={effectiveId} onLeave={leaveRoom} />;
  }

  return amHost
    ? <HostGame state={state} roomId={roomId} onLeave={leaveRoom} />
    : <PlayerGame state={state} roomId={roomId} myId={effectiveId} onLeave={leaveRoom} disconnected={disconnected} />;
}
