import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../src/lib/store';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('sets and gets myName', () => {
    useGameStore.getState().setMyName('Alice');
    expect(useGameStore.getState().myName).toBe('Alice');
  });

  it('sets and gets myId', () => {
    useGameStore.getState().setMyId('socket-123');
    expect(useGameStore.getState().myId).toBe('socket-123');
  });

  it('reset clears all state', () => {
    useGameStore.getState().setMyName('Bob');
    useGameStore.getState().setMyId('socket-456');
    useGameStore.getState().reset();
    const state = useGameStore.getState();
    expect(state.myName).toBe('');
    expect(state.myId).toBe('');
    expect(state.roomState).toBeNull();
  });

  it('setRoomState stores the state', () => {
    const mockState = { roomId: 'abc', status: 'LOBBY' } as any;
    useGameStore.getState().setRoomState(mockState);
    expect(useGameStore.getState().roomState).toEqual(mockState);
  });
});
