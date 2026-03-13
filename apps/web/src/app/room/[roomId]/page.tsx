'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { RoomStateDTO, GameSettings } from '@hangul-quest/shared';
import { getSocket } from '../../../lib/socket';
import { useGameStore } from '../../../lib/store';

// ─── Shared sub-components ───────────────────────────────────────────────────

function Scoreboard({ players, highlightId }: { players: RoomStateDTO['players']; highlightId?: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full space-y-2">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            p.id === highlightId ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-white/60'
          } ${!p.connected ? 'opacity-50' : ''}`}
        >
          <span className="text-2xl font-black text-gray-400 w-8">{i + 1}</span>
          <span className="flex-1 font-bold text-lg truncate">{p.name}{p.isHost ? ' 👑' : ''}</span>
          <span className="text-2xl font-black text-indigo-600">{p.score}</span>
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

// ─── Host view ────────────────────────────────────────────────────────────────

function HostLobby({ state, roomId, onLeave }: { state: RoomStateDTO; roomId: string; onLeave: () => void }) {
  const socket = getSocket();
  const [category, setCategory] = useState<GameSettings['category']>(state.settings.category);
  const [rounds, setRounds] = useState(state.settings.totalRounds);
  const [timeLimit, setTimeLimit] = useState(state.settings.timeLimit);

  const updateSettings = (patch: Partial<GameSettings>) => {
    socket.emit('room:settings:update', { roomId, settings: patch });
  };

  const start = () => {
    socket.emit('room:start', { roomId }, (res) => {
      if ('error' in res) alert(res.error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 gap-6">
      {/* Room code banner */}
      <div className="bg-white rounded-3xl shadow-xl px-8 py-5 text-center">
        <p className="text-gray-500 text-sm font-semibold">Players join at this code</p>
        <p className="text-6xl font-black tracking-widest text-indigo-600 mt-1">{state.roomCode}</p>
        <p className="text-gray-400 text-xs mt-1">hangul-quest.app → Join Room</p>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 gap-4">
        {/* Settings */}
        <div className="bg-white/20 rounded-3xl p-5 text-white">
          <h2 className="font-bold text-lg mb-3">⚙️ Settings</h2>

          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {(['KOREAN_WORDS', 'HANGUL_LETTERS'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); updateSettings({ category: cat }); }}
                  className={`py-2 px-3 rounded-xl font-semibold text-sm transition-all ${category === cat ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}
                >
                  {cat === 'KOREAN_WORDS' ? '📖 Korean Words' : '🔤 Hangul Letters'}
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
        </div>

        {/* Players */}
        <div className="bg-white/20 rounded-3xl p-5 text-white">
          <h2 className="font-bold text-lg mb-3">
            👥 Players ({state.players.filter(p => !p.isHost && p.connected).length}/{state.players.filter(p => !p.isHost).length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {state.players.filter(p => !p.isHost).map(p => (
              <span key={p.id} className={`px-3 py-1 rounded-full text-sm font-semibold ${p.connected ? 'bg-white/30' : 'bg-white/10 opacity-50'}`}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={start}
        disabled={state.players.filter(p => !p.isHost).length < 1}
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

  const nextRound = () => socket.emit('room:next-round', { roomId });
  const playAgain = () => socket.emit('room:play-again', { roomId });

  const q = state.currentQuestion;
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-800 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div className="bg-white/20 rounded-xl px-4 py-2">
          <span className="font-bold">Round {state.currentRound} / {state.settings.totalRounds}</span>
        </div>
        <div className="text-center">
          <span className="font-bold text-lg">{state.settings.category === 'KOREAN_WORDS' ? '📖 Korean Words' : '🔤 Hangul Letters'}</span>
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

      {/* Main content */}
      <div className="flex-1 flex gap-4 px-6 pb-6">
        {/* Left: question display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {!isOver && q && (
            <>
              <p className="text-white/70 text-xl font-semibold mb-2">{q.categoryHint}</p>
              <div className={`text-[10rem] leading-none select-none transition-all duration-300 ${isResult ? 'opacity-70 scale-90' : 'drop-shadow-2xl'}`}>
                {q.prompt}
              </div>

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
                </div>
              )}

              {!isResult && state.roundExpiresAt && (
                <div className="w-64 mt-8">
                  <TimerBar expiresAt={state.roundExpiresAt} timeLimit={state.settings.timeLimit} />
                </div>
              )}

              {isResult && (
                <button onClick={nextRound} className="mt-8 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg transition-all active:scale-95">
                  Next Round →
                </button>
              )}
            </>
          )}

          {isOver && (
            <div className="text-center text-white w-full max-w-sm">
              <p className="text-5xl font-black mb-1">🎉 Game Over!</p>
              <p className="text-xl text-white/70 mb-6">Final Rankings</p>
              <div className="bg-white/10 rounded-3xl p-4 mb-6 space-y-2">
                {[...state.players].filter(p => !p.isHost).sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl">
                    <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
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
          <Scoreboard players={state.players.filter(p => !p.isHost)} highlightId={state.roundWinner?.id} />
        </div>
      </div>
    </div>
  );
}

// ─── Player view ──────────────────────────────────────────────────────────────

function PlayerLobby({ state, myId, onLeave }: { state: RoomStateDTO; myId: string; onLeave: () => void }) {
  const me = state.players.find(p => p.id === myId);
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col items-center justify-center p-6 gap-6 text-white">
      <div className="text-7xl">🎮</div>
      <div className="text-center">
        <p className="text-2xl font-bold">{me?.name ?? 'Player'}</p>
        <p className="text-sky-200 text-sm">waiting for host to start...</p>
      </div>
      <div className="bg-white/20 rounded-3xl px-8 py-4 text-center">
        <p className="text-sm font-semibold text-sky-100">Room Code</p>
        <p className="text-4xl font-black tracking-widest">{state.roomCode}</p>
      </div>
      <div className="bg-white/10 rounded-3xl p-4 w-full max-w-xs">
        <p className="font-semibold text-center mb-3">Players ({state.players.filter(p => !p.isHost).length})</p>
        {state.players.filter(p => !p.isHost).map(p => (
          <p key={p.id} className={`text-center py-1 rounded-lg ${p.id === myId ? 'bg-white/30 font-bold px-2' : ''}`}>
            {p.name}{p.id === myId ? ' 👤' : ''}
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

function PlayerGame({ state, roomId, myId, onLeave }: { state: RoomStateDTO; roomId: string; myId: string; onLeave: () => void }) {
  const socket = getSocket();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const isResult = state.status === 'ROUND_RESULT';
  const isOver = state.status === 'GAME_OVER';
  const q = state.currentQuestion;
  const me = state.players.find(p => p.id === myId);
  const prevRoundRef = useRef(state.currentRound);

  // Reset on new round
  useEffect(() => {
    if (state.currentRound !== prevRoundRef.current) {
      setSelected(null);
      setAnswered(false);
      prevRoundRef.current = state.currentRound;
    }
  }, [state.currentRound]);

  const submit = (answer: string) => {
    if (answered || !q || state.status !== 'ROUND_ACTIVE') return;
    setSelected(answer);
    setAnswered(true);
    socket.emit('answer:submit', { roomId, questionId: q.id, answer });
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

  if (isOver) {
    const sorted = [...state.players].filter(p => !p.isHost).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === myId) + 1;
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 text-white gap-4">
        <div className="text-6xl">{myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎮'}</div>
        <p className="text-3xl font-black">Game Over!</p>
        <p className="text-xl">You finished #{myRank}</p>
        <p className="text-4xl font-black">{me?.score ?? 0} pts</p>
        <div className="bg-white/10 rounded-3xl p-4 w-full max-w-xs mt-4">
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex justify-between py-2 px-3 rounded-xl ${p.id === myId ? 'bg-white/20' : ''}`}>
              <span>{i + 1}. {p.name}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col">
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
        <div className="text-sm font-bold">⭐ {me?.score ?? 0} pts</div>
      </div>

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
            <div className="text-[8rem] leading-none select-none">{q.prompt}</div>

            {/* Result banner */}
            {isResult && (
              <div className={`text-center py-3 px-6 rounded-2xl font-black text-xl ${
                selected === state.correctAnswer ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white'
              }`}>
                {state.roundWinner?.id === myId
                  ? '🏆 You got it!'
                  : state.roundWinner
                    ? `${state.roundWinner.name} got it!`
                    : "⏰ Time's up!"}
              </div>
            )}

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
              {q.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => submit(opt)}
                  disabled={answered || isResult}
                  className={`py-5 px-2 rounded-2xl font-black text-xl shadow-lg transition-all ${optionColor(opt)}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {answered && !isResult && (
              <p className="text-white/80 text-sm animate-pulse mt-2">Waiting for others...</p>
            )}
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

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    if (socket.id && !myId) setMyId(socket.id);

    const onState = (s: RoomStateDTO) => {
      setState(s);
      setRoomState(s);
    };

    socket.on('room:state', onState);
    socket.on('error:event', ({ message }) => {
      alert(message);
      router.push('/');
    });

    const token = sessionStorage.getItem(`rct:${roomId}`);
    if (token) {
      const doRejoin = () => {
        socket.emit('room:rejoin', { roomId, token }, (res) => {
          if ('error' in res) {
            sessionStorage.removeItem(`rct:${roomId}`);
            // Room gone or token invalid — go home
            router.push('/');
          }
        });
      };
      if (socket.connected) doRejoin();
      else socket.once('connect', doRejoin);
    } else {
      // Fallback for first navigation (state already in Zustand from home page)
      const doSync = () => socket.emit('room:sync', { roomId });
      if (socket.connected) doSync();
      else socket.once('connect', doSync);
    }

    return () => {
      socket.off('room:state', onState);
      socket.off('connect');
    };
  }, [myId, setMyId, setRoomState, router, roomId]);

  // If we land here without a socket id, go home
  useEffect(() => {
    const socket = getSocket();
    const handleConnect = () => setMyId(socket.id!);
    socket.on('connect', handleConnect);
    return () => { socket.off('connect', handleConnect); };
  }, [setMyId]);

  const leaveRoom = () => {
    getSocket().emit('room:leave', { roomId });
    sessionStorage.removeItem(`rct:${roomId}`);
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
    : <PlayerGame state={state} roomId={roomId} myId={effectiveId} onLeave={leaveRoom} />;
}
