'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../lib/store';
import { getWeakSpots } from '../lib/weakSpots';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMyName, setMyId, setRoomState } = useGameStore();

  const prefilledCode = searchParams.get('code') ?? '';
  const [tab, setTab] = useState<'create' | 'join'>(prefilledCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(prefilledCode.toUpperCase());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const weakSpots = getWeakSpots();

  // Sync dark mode with html class
  useEffect(() => {
    const stored = localStorage.getItem('hq:darkMode');
    if (stored === '1') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hq:darkMode', '1');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('hq:darkMode');
    }
  };

  const createRoom = () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter your name'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();

    const doCreate = () => {
      setMyId(socket.id!);
      setMyName(trimmedName);
      socket.once('room:state', setRoomState);
      socket.emit('room:create', { hostName: trimmedName }, (res) => {
        setLoading(false);
        if ('error' in res) {
          socket.off('room:state', setRoomState);
          setError(res.error);
          return;
        }
        localStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
        router.push(`/room/${res.roomId}`);
      });
    };

    if (socket.connected) {
      doCreate();
    } else {
      socket.connect();
      socket.once('connect', doCreate);
      socket.once('connect_error', () => {
        setLoading(false);
        setError('Cannot connect to server. Is it running?');
      });
    }
  };

  const joinRoom = () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter your name'); return; }
    if (!roomCode.trim()) { setError('Please enter a room code'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();

    const doJoin = () => {
      setMyId(socket.id!);
      setMyName(trimmedName);
      socket.once('room:state', setRoomState);
      socket.emit('room:join', {
        playerName: trimmedName,
        roomCode: roomCode.trim().toUpperCase(),
      }, (res) => {
        setLoading(false);
        if ('error' in res) {
          socket.off('room:state', setRoomState);
          setError(res.error);
          return;
        }
        localStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
        router.push(`/room/${res.roomId}`);
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.connect();
      socket.once('connect', doJoin);
      socket.once('connect_error', () => {
        setLoading(false);
        setError('Cannot connect to server. Is it running?');
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="fixed top-4 right-4 bg-white/20 hover:bg-white/30 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-all shadow"
        title="Toggle dark mode"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Practice mode link */}
      <button
        onClick={() => router.push('/practice')}
        className="fixed top-4 left-4 bg-white/20 hover:bg-white/30 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-full px-3 py-2 text-sm font-semibold transition-all shadow"
      >
        📖 Practice
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-3">🎮</div>
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">한글 퀘스트</h1>
          <p className="text-sky-100 dark:text-gray-300 text-lg mt-2">Learn Korean while playing!</p>
        </div>

        {/* Weak spots banner */}
        {weakSpots.length > 0 && (
          <button
            onClick={() => router.push('/practice')}
            className="w-full mb-4 bg-orange-400/80 hover:bg-orange-400 text-white rounded-2xl px-4 py-3 text-sm font-bold text-left transition-all"
          >
            🔴 You have {weakSpots.length} weak spot{weakSpots.length !== 1 ? 's' : ''} — practice to improve! →
          </button>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6">
          {/* Tab */}
          <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            <button
              onClick={() => { setTab('create'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'create' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
            >
              🏠 Create Room
            </button>
            <button
              onClick={() => { setTab('join'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'join' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
            >
              🚀 Join Room
            </button>
          </div>

          {/* Name field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Your Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') tab === 'create' ? createRoom() : joinRoom(); }}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-indigo-400"
            />
          </div>

          {tab === 'join' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Room Code</label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') joinRoom(); }}
                placeholder="e.g. ABCD"
                maxLength={4}
                className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl px-4 py-3 text-3xl font-extrabold tracking-widest text-center focus:outline-none focus:border-indigo-400 uppercase"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

          {tab === 'create' ? (
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              {loading ? '⏳ Connecting...' : '🏠 Create Room'}
            </button>
          ) : (
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              {loading ? '⏳ Connecting...' : '🚀 Join Room'}
            </button>
          )}
        </div>
      </div>
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
