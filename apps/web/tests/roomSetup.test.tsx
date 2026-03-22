import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ── socket mock ────────────────────────────────────────────────────────────
const mockEmit = vi.fn();
const mockSocket = {
  connected: true,
  id: 'socket-test-id',
  emit: mockEmit,
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  connect: vi.fn(),
};
vi.mock('../src/lib/socket', () => ({ getSocket: () => mockSocket }));

// ── store mock ─────────────────────────────────────────────────────────────
const mockSetMyId = vi.fn();
vi.mock('../src/lib/store', () => ({
  useGameStore: () => ({ setMyId: mockSetMyId }),
}));

// ── import hook under test (after mocks) ──────────────────────────────────
import { useRoomSetup } from '../src/lib/useRoomSetup';

// ── helpers ────────────────────────────────────────────────────────────────
const ROOM_ID = 'room-abc-test';

function rejoinCalls() {
  return mockEmit.mock.calls.filter(([event]) => event === 'room:rejoin');
}
function syncCalls() {
  return mockEmit.mock.calls.filter(([event]) => event === 'room:sync');
}

// ── tests ──────────────────────────────────────────────────────────────────
describe('useRoomSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSocket.connected = true;
    mockSocket.id = 'socket-test-id';
    mockSocket.emit = mockEmit;
  });

  // ── StrictMode double-invocation guard ────────────────────────────────

  it('calls room:rejoin exactly once (StrictMode guard) when token exists', () => {
    // StrictMode runs effects twice: mount → cleanup → remount.
    // Without the syncInitiatedRef guard, the second run calls room:rejoin
    // with an already-rotated token → "Invalid token" → router.push('/').
    localStorage.setItem(`rct:${ROOM_ID}`, 'stored-token-xyz');
    const onError = vi.fn();

    renderHook(() => useRoomSetup(ROOM_ID, onError), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });

    expect(rejoinCalls()).toHaveLength(1);
    expect(rejoinCalls()[0][1]).toMatchObject({ roomId: ROOM_ID, token: 'stored-token-xyz' });
  });

  it('calls room:sync exactly once (StrictMode guard) when no token', () => {
    // No token → new player should send room:sync once, not twice.
    renderHook(() => useRoomSetup(ROOM_ID, vi.fn()), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });

    expect(syncCalls()).toHaveLength(1);
    expect(syncCalls()[0][1]).toMatchObject({ roomId: ROOM_ID });
  });

  // ── error / success paths ─────────────────────────────────────────────

  it('calls onRejoinError and removes token when server rejects rejoin', () => {
    localStorage.setItem(`rct:${ROOM_ID}`, 'bad-token');
    const onError = vi.fn();

    mockEmit.mockImplementation((event, _payload, callback) => {
      if (event === 'room:rejoin' && callback) callback({ error: 'Invalid token' });
    });

    renderHook(() => useRoomSetup(ROOM_ID, onError));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`rct:${ROOM_ID}`)).toBeNull();
  });

  it('stores the rotated token after a successful rejoin', () => {
    localStorage.setItem(`rct:${ROOM_ID}`, 'original-token');
    const onError = vi.fn();

    mockEmit.mockImplementation((event, _payload, callback) => {
      if (event === 'room:rejoin' && callback) callback({ ok: true, reconnectToken: 'new-token-456' });
    });

    renderHook(() => useRoomSetup(ROOM_ID, onError));

    expect(localStorage.getItem(`rct:${ROOM_ID}`)).toBe('new-token-456');
    expect(onError).not.toHaveBeenCalled();
  });

  it('does not call onRejoinError when rejoin succeeds', () => {
    localStorage.setItem(`rct:${ROOM_ID}`, 'good-token');
    const onError = vi.fn();

    mockEmit.mockImplementation((event, _payload, callback) => {
      if (event === 'room:rejoin' && callback) callback({ ok: true, reconnectToken: 'rotated' });
    });

    renderHook(() => useRoomSetup(ROOM_ID, onError));

    expect(onError).not.toHaveBeenCalled();
  });

  // ── connection state ──────────────────────────────────────────────────

  it('queues rejoin via socket.once when socket is not yet connected', () => {
    mockSocket.connected = false;
    localStorage.setItem(`rct:${ROOM_ID}`, 'tok');

    renderHook(() => useRoomSetup(ROOM_ID, vi.fn()));

    // Should not emit immediately — waits for the connect event
    expect(rejoinCalls()).toHaveLength(0);
    // Should have registered a once('connect') handler
    expect(mockSocket.once).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('calls socket.connect() when socket is disconnected', () => {
    mockSocket.connected = false;

    renderHook(() => useRoomSetup(ROOM_ID, vi.fn()));

    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });
});
