import { describe, it, expect, vi } from 'vitest';
import { RoomManager } from '../src/game/RoomManager.js';

function makeManager() {
  const broadcast = vi.fn();
  const mgr = new RoomManager(broadcast);
  return { mgr, broadcast };
}

describe('RoomManager', () => {
  it('creates a room with a 4-char room code', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    expect(room.roomCode).toHaveLength(4);
  });

  it('allows a player to join a lobby', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    const result = mgr.joinRoom(room.roomCode, 'player1', 'Alice');
    expect(result.ok).toBe(true);
  });

  it('rejects join when game has already started', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'player1', 'Alice');
    mgr.startGame(room.roomId, 'host1');
    const result = mgr.joinRoom(room.roomCode, 'player2', 'Bob');
    expect(result.ok).toBe(false);
  });

  it('rejects start when no non-host players are present', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    const result = mgr.startGame(room.roomId, 'host1');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/player/i);
  });

  it('ends round immediately when all non-host players answer', () => {
    const { mgr, broadcast } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.joinRoom(room.roomCode, 'p2', 'Bob');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    broadcast.mockClear();
    mgr.submitAnswer(room.roomId, 'p1', q.id, 'wrong');
    expect(mgr.toDTO(room).status).toBe('ROUND_ACTIVE'); // still active, p2 hasn't answered
    mgr.submitAnswer(room.roomId, 'p2', q.id, 'wrong');
    expect(mgr.toDTO(room).status).toBe('ROUND_RESULT'); // all answered → result
  });

  it('does not count host in allAnswered check', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    mgr.submitAnswer(room.roomId, 'p1', q.id, 'anything');
    expect(mgr.toDTO(room).status).toBe('ROUND_RESULT'); // only 1 non-host player, answered → result
  });

  it('ignores answer submission from host', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    mgr.submitAnswer(room.roomId, 'host1', q.id, q.options[0]); // host tries to submit
    expect(mgr.toDTO(room).status).toBe('ROUND_ACTIVE'); // should remain active
  });

  it('promotes a new host when host disconnects during game', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');
    mgr.disconnect('host1');

    const dto = mgr.toDTO(room);
    expect(dto.hostId).toBe('p1');
    const newHost = dto.players.find(p => p.id === 'p1');
    expect(newHost?.isHost).toBe(true);
  });

  it('removes a player on leaveRoom', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.leaveRoom(room.roomId, 'p1');

    const players = mgr.toDTO(room).players;
    expect(players.find(p => p.id === 'p1')).toBeUndefined();
  });

  it('transfers host when host leaves during game', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');
    mgr.leaveRoom(room.roomId, 'host1');

    const dto = mgr.toDTO(room);
    expect(dto.hostId).toBe('p1');
  });
});
