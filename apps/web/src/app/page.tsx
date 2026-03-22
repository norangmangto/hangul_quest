'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../lib/store';
import { getWeakSpots } from '../lib/weakSpots';
import { useLangStore, useT, type Lang } from '../lib/i18n';

type Screen = 'menu' | 'multi' | 'join-code';

function Sun() {
  return (
    <div className="pointer-events-none select-none absolute top-5 right-6 z-0">
      <div className="w-24 h-24 rounded-full sun-glow"
           style={{ background: 'radial-gradient(circle, #fffde7 0%, #ffd600 55%, #ffb300 100%)' }} />
    </div>
  );
}

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`pointer-events-none select-none absolute z-0 ${className}`} style={style}>
      <div className="relative">
        <div className="w-36 h-14 bg-white/85 rounded-full" />
        <div className="absolute -top-8 left-7 w-24 bg-white/85 rounded-full" style={{ height: '4.5rem' }} />
        <div className="absolute -top-5 right-4 bg-white/85 rounded-full" style={{ width: '4.5rem', height: '3.5rem' }} />
      </div>
    </div>
  );
}

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMyName, setMyId, setRoomState } = useGameStore();
  const t = useT();

  const prefilledCode = searchParams.get('code') ?? '';
  const [screen, setScreen] = useState<Screen>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [weakCount, setWeakCount] = useState(0);

  useEffect(() => { setWeakCount(getWeakSpots().length); }, []);

  // Invite link with ?code= → go straight to join page
  useEffect(() => {
    if (prefilledCode) router.replace(`/room/join/${prefilledCode.toUpperCase()}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createRoom = () => {
    setError(''); setLoading(true);
    const socket = getSocket();
    const go = () => {
      setMyId(socket.id!);
      setMyName('Host');
      socket.once('room:state', setRoomState);
      socket.emit('room:create', { hostName: 'Host' }, (res) => {
        setLoading(false);
        if ('error' in res) { socket.off('room:state', setRoomState); setError(res.error); return; }
        localStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
        router.push(`/room/${res.roomId}`);
      });
    };
    socket.connected ? go() : (socket.connect(), socket.once('connect', go), socket.once('connect_error', () => { setLoading(false); setError(t.err_connect); }));
  };

  const goJoin = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setError(t.err_code_required); return; }
    router.push(`/room/join/${code}`);
  };

  const back = () => {
    if (screen === 'join-code') { setScreen('multi'); setRoomCode(''); setError(''); }
    else { setScreen('menu'); setError(''); }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 flex flex-col relative overflow-hidden">
      <Sun />
      <Cloud className="top-10 left-2 cloud-a" />
      <Cloud className="top-28 right-14 cloud-b" style={{ transform: 'scale(0.65)', opacity: 0.75 }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        {screen !== 'menu' ? (
          <button onClick={back} className="sky-card rounded-full px-5 py-3 text-white font-black text-xl gummy-btn">←</button>
        ) : (
          <div className="w-16" />
        )}
        <LangPill />
      </div>

      {/* Logo */}
      <div className="relative z-10 text-center pt-2 pb-4">
        <div className="text-[5.5rem] leading-none bird-bob inline-block select-none">🐦</div>
        <h1 className="text-6xl font-black text-white kid-title leading-tight">한글 퀘스트</h1>
      </div>

      {/* ── MENU: Solo / Multi ── */}
      {screen === 'menu' && (
        <div className="relative z-10 flex gap-4 flex-1 px-4 pb-8">
          <button onClick={() => router.push('/practice')}
            className="relative flex-1 bg-gradient-to-b from-rose-400 to-red-600 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 gummy-btn">
            {weakCount > 0 && (
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-black text-base"
                   style={{ boxShadow: '0 3px 0 rgba(0,0,0,0.3)' }}>{weakCount}</div>
            )}
            <span className="text-[6.5rem] leading-none drop-shadow-xl select-none" style={{ animation: 'birdBob 2.2s ease-in-out infinite' }}>🐦</span>
            <span className="text-3xl font-black text-white kid-label">{t.single_play}</span>
          </button>

          <button onClick={() => setScreen('multi')}
            className="flex-1 bg-gradient-to-b from-amber-300 to-yellow-500 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 gummy-btn">
            <span className="text-[6.5rem] leading-none drop-shadow-xl select-none" style={{ animation: 'birdBob 2.2s ease-in-out infinite', animationDelay: '0.6s' }}>🐣</span>
            <span className="text-3xl font-black text-yellow-900 kid-label">{t.multi_play}</span>
          </button>
        </div>
      )}

      {/* ── MULTI: Create / Join two big cards ── */}
      {screen === 'multi' && (
        <div className="relative z-10 flex gap-4 flex-1 px-4 pb-8">

          {/* Create Room */}
          <button onClick={createRoom} disabled={loading}
            className="flex-1 bg-gradient-to-b from-emerald-400 to-green-600 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 gummy-btn">
            <span className="text-[6.5rem] leading-none drop-shadow-xl select-none" style={{ animation: 'birdBob 2.2s ease-in-out infinite' }}>🏠</span>
            <span className="text-3xl font-black text-white kid-label text-center px-2">
              {loading ? '⏳' : t.create_room_tab}
            </span>
          </button>

          {/* Join Room */}
          <button onClick={() => setScreen('join-code')}
            className="flex-1 bg-gradient-to-b from-sky-400 to-blue-600 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 gummy-btn">
            <span className="text-[6.5rem] leading-none drop-shadow-xl select-none" style={{ animation: 'birdBob 2.2s ease-in-out infinite', animationDelay: '0.6s' }}>🚀</span>
            <span className="text-3xl font-black text-white kid-label text-center px-2">{t.join_room_tab}</span>
          </button>
        </div>
      )}

      {/* ── JOIN-CODE: enter room code ── */}
      {screen === 'join-code' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8 gap-5">
          <div className="bubble-card p-6 w-full max-w-sm flex flex-col gap-4">
            <p className="text-gray-500 text-lg font-black text-center">🔑 {t.room_code}</p>
            <input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') goJoin(); }}
              placeholder="ABCD"
              maxLength={4}
              autoFocus
              className="w-full bg-amber-50 border-4 border-amber-200 rounded-2xl px-4 py-5 text-5xl font-black text-amber-900 tracking-[0.45em] text-center focus:outline-none uppercase placeholder-amber-200 focus:border-amber-400"
            />

            {error && (
              <div className="bg-red-50 text-red-600 text-lg font-black text-center py-3 rounded-2xl"
                   style={{ border: '3px solid #fca5a5' }}>⚠️ {error}</div>
            )}

            <button onClick={goJoin}
              className="w-full bg-gradient-to-b from-sky-400 to-blue-600 text-white font-black text-2xl py-6 rounded-2xl gummy-btn">
              🚀 Enter Room →
            </button>
          </div>
        </div>
      )}

      {/* Ground */}
      <div className="relative z-10 h-12 bg-gradient-to-b from-lime-400 to-green-600 w-full"
           style={{ boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)' }} />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
