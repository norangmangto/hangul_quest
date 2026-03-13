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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createRoom = () => {
    setError('');
    setLoading(true);
    const socket = getSocket();

    const doCreate = () => {
      setMyId(socket.id!);
      socket.once('room:state', setRoomState);
      socket.emit('room:create', {}, (res) => {
        setLoading(false);
        if ('error' in res) {
          socket.off('room:state', setRoomState);
          setError(res.error);
          return;
        }
        sessionStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
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
        sessionStorage.setItem(`rct:${res.roomId}`, res.reconnectToken);
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
              onClick={() => { setTab('create'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              🏠 Create Room
            </button>
            <button
              onClick={() => { setTab('join'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              🚀 Join Room
            </button>
          </div>

          {tab === 'join' && (
            <>
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
            </>
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
