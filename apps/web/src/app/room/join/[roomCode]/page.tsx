'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '../../../../lib/socket';
import { useGameStore } from '../../../../lib/store';
import { useT } from '../../../../lib/i18n';

const ADJECTIVES = ['Happy', 'Fast', 'Cool', 'Super', 'Wild', 'Brave', 'Lucky', 'Swift', 'Tiny', 'Mega'];
const BIRDS = ['Bird', 'Chick', 'Eagle', 'Duck', 'Owl', 'Robin', 'Hawk', 'Wren', 'Puffin', 'Crane'];

function randomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const bird = BIRDS[Math.floor(Math.random() * BIRDS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${bird}${num}`;
}

export default function JoinPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();
  const { setMyName, setMyId, setRoomState } = useGameStore();
  const t = useT();
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'full' | 'started' | 'notfound' | 'other'>('other');
  const joined = useRef(false);

  useEffect(() => {
    if (joined.current) return;
    joined.current = true;

    const name = randomName();
    const socket = getSocket();

    const go = () => {
      setMyId(socket.id!);
      setMyName(name);
      socket.once('room:state', setRoomState);
      socket.emit('room:join', { playerName: name, roomCode: roomCode.toUpperCase() }, (res) => {
        if ('error' in res) {
          socket.off('room:state', setRoomState);
          setError(res.error);
          if (res.error === 'Room is full') setErrorType('full');
          else if (res.error === 'Game already started') setErrorType('started');
          else if (res.error === 'Room not found') setErrorType('notfound');
          else setErrorType('other');
          return;
        }
        localStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
        router.push(`/room/${res.roomId}`);
      });
    };

    socket.connected
      ? go()
      : (socket.connect(), socket.once('connect', go), socket.once('connect_error', () => setError(t.err_connect)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-600 flex flex-col relative overflow-hidden">
      {/* Sun */}
      <div className="pointer-events-none select-none absolute top-5 right-6 z-0">
        <div className="w-24 h-24 rounded-full sun-glow"
             style={{ background: 'radial-gradient(circle, #fffde7 0%, #ffd600 55%, #ffb300 100%)' }} />
      </div>

      <div className="relative z-10 px-4 pt-4">
        <button onClick={() => router.back()}
          className="sky-card rounded-full px-5 py-3 text-white font-black text-xl gummy-btn">←</button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-6">
        {error ? (
          <>
            <div className="text-[5rem] select-none">
              {errorType === 'full' ? '🚫' : errorType === 'started' ? '⏳' : errorType === 'notfound' ? '🔍' : '😵'}
            </div>
            <div className="bubble-card px-8 py-6 text-center">
              <p className="text-red-500 text-xl font-black">
                {errorType === 'full' && '😔 Room is full — try another room'}
                {errorType === 'started' && '⏳ Game already started — ask for next round!'}
                {errorType === 'notfound' && '🔍 Room not found — check the code'}
                {errorType === 'other' && `⚠️ ${error}`}
              </p>
            </div>
            <button onClick={() => router.back()}
              className="bg-gradient-to-b from-sky-400 to-blue-600 text-white font-black text-2xl px-10 py-5 rounded-2xl gummy-btn">
              ← Back
            </button>
          </>
        ) : (
          <>
            <div className="text-[6rem] leading-none bird-bob select-none">🐣</div>
            <div className="text-center">
              <p className="text-white/70 text-sm font-black uppercase tracking-widest">{t.room_code_label}</p>
              <p className="text-8xl font-black text-white tracking-[0.12em] mt-1 kid-title">{roomCode}</p>
            </div>
            <div className="flex gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-4 h-4 bg-white/60 rounded-full animate-bounce"
                     style={{ animationDelay: `${i * 0.22}s` }} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-12 bg-gradient-to-b from-lime-400 to-green-600 w-full"
           style={{ boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.25)' }} />
    </main>
  );
}
