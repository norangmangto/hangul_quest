import { describe, it, expect } from 'vitest';

// Pure mapping logic extracted from room/join/[roomCode]/page.tsx
type ErrorType = 'full' | 'started' | 'notfound' | 'other';

function classifyJoinError(errorMessage: string): ErrorType {
  if (errorMessage === 'Room is full') return 'full';
  if (errorMessage === 'Game already started') return 'started';
  if (errorMessage === 'Room not found') return 'notfound';
  return 'other';
}

// User-facing message for each error type (mirrors the JSX in the join page)
function joinErrorMessage(type: ErrorType, raw: string): string {
  switch (type) {
    case 'full':    return '😔 Room is full — try another room';
    case 'started': return '⏳ Game already started — ask for next round!';
    case 'notfound': return '🔍 Room not found — check the code';
    case 'other':   return `⚠️ ${raw}`;
  }
}

describe('join error classification', () => {
  it('classifies "Room is full" correctly', () => {
    expect(classifyJoinError('Room is full')).toBe('full');
  });

  it('classifies "Game already started" correctly', () => {
    expect(classifyJoinError('Game already started')).toBe('started');
  });

  it('classifies "Room not found" correctly', () => {
    expect(classifyJoinError('Room not found')).toBe('notfound');
  });

  it('classifies unknown server errors as "other"', () => {
    expect(classifyJoinError('Name required')).toBe('other');
    expect(classifyJoinError('Cannot connect to server')).toBe('other');
    expect(classifyJoinError('')).toBe('other');
    expect(classifyJoinError('Unexpected error')).toBe('other');
  });

  it('is case-sensitive (partial match does not trigger)', () => {
    expect(classifyJoinError('room is full')).toBe('other');
    expect(classifyJoinError('ROOM IS FULL')).toBe('other');
    expect(classifyJoinError('room not found')).toBe('other');
  });
});

describe('join error user-facing messages', () => {
  it('shows friendly message for full room', () => {
    const msg = joinErrorMessage('full', 'Room is full');
    expect(msg).toContain('full');
    expect(msg).toContain('try another room');
  });

  it('shows helpful hint for started game', () => {
    const msg = joinErrorMessage('started', 'Game already started');
    expect(msg).toContain('started');
    expect(msg).toContain('next round');
  });

  it('prompts code check for not-found rooms', () => {
    const msg = joinErrorMessage('notfound', 'Room not found');
    expect(msg).toContain('not found');
    expect(msg).toContain('check the code');
  });

  it('surfaces raw server message for unknown errors', () => {
    const raw = 'Internal server error';
    const msg = joinErrorMessage('other', raw);
    expect(msg).toContain(raw);
  });

  it('each error type shows a distinct message', () => {
    const messages = [
      joinErrorMessage('full', ''),
      joinErrorMessage('started', ''),
      joinErrorMessage('notfound', ''),
      joinErrorMessage('other', 'err'),
    ];
    const unique = new Set(messages);
    expect(unique.size).toBe(4);
  });
});
