'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../lib/store';

export default function HomePage() {
  const router = useRouter();
  const { setMyName, setMyId, setRoomState } = useGameStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [category, setCategory] = useState<'KOREAN_WORDS' | 'HANGUL_LETTERS'>('KOREAN_WORDS');
  const [rounds, setRounds] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedName = name.trim();

  const createRoom = () => {
    if (!trimmedName) { setError('Please enter your name'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();
    socket.connect();
    socket.once('connect', () => {
      setMyId(socket.id!);
      setMyName(trimmedName);
      socket.once('room:state', setRoomState);
      socket.emit('room:create', {
        hostName: trimmedName,
        settings: { category, totalRounds: rounds, timeLimit },
      }, (res) => {
        setLoading(false);
        if ('error' in res) {
          socket.off('room:state', setRoomState);
          setError(res.error);
          return;
        }
        router.push(`/room/${res.roomId}`);
      });
    });
    socket.once('connect_error', () => {
      setLoading(false);
      setError('Cannot connect to server. Is it running?');
    });
  };

  const joinRoom = () => {
    if (!trimmedName) { setError('Please enter your name'); return; }
    if (!roomCode.trim()) { setError('Please enter a room code'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();
    socket.connect();
    socket.once('connect', () => {
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
        router.push(`/room/${res.roomId}`);
      });
    });
    socket.once('connect_error', () => {
      setLoading(false);
      setError('Cannot connect to server. Is it running?');
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-3">🎮</div>
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">한글 퀘스트</h1>
          <p className="text-sky-100 text-lg mt-2">Learn Korean while playing!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {/* Tab */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              🏠 Create Room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              🚀 Join Room
            </button>
          </div>

          {/* Name input (shared) */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Your Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-indigo-400"
            />
          </div>

          {tab === 'create' && (
            <>
              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCategory('KOREAN_WORDS')}
                    className={`p-3 rounded-2xl border-2 font-semibold text-sm transition-all ${category === 'KOREAN_WORDS' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    <div className="text-2xl mb-1">📖</div>
                    Korean Words
                  </button>
                  <button
                    onClick={() => setCategory('HANGUL_LETTERS')}
                    className={`p-3 rounded-2xl border-2 font-semibold text-sm transition-all ${category === 'HANGUL_LETTERS' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    <div className="text-2xl mb-1">🔤</div>
                    Hangul Letters
                  </button>
                </div>
              </div>

              {/* Rounds */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Rounds: <span className="text-indigo-600">{rounds}</span>
                </label>
                <input
                  type="range" min={5} max={30} step={5}
                  value={rounds}
                  onChange={e => setRounds(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
                </div>
              </div>

              {/* Time limit */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Time per round: <span className="text-indigo-600">{timeLimit}s</span>
                </label>
                <input
                  type="range" min={10} max={30} step={5}
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10s</span><span>15s</span><span>20s</span><span>25s</span><span>30s</span>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
              <button
                onClick={createRoom}
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                {loading ? '⏳ Connecting...' : '🏠 Create Room'}
              </button>
            </>
          )}

          {tab === 'join' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Room Code</label>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCD"
                  maxLength={4}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-3xl font-extrabold tracking-widest text-center focus:outline-none focus:border-indigo-400 uppercase"
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
              <button
                onClick={joinRoom}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                {loading ? '⏳ Connecting...' : '🚀 Join Room'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
