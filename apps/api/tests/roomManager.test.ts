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
    const room = mgr.createRoom('host1', 'Host');
    expect(room.roomCode).toHaveLength(4);
  });

  it('allows a player to join a lobby', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    const result = mgr.joinRoom(room.roomCode, 'player1', 'Alice');
    expect(result.ok).toBe(true);
  });

  it('rejects join when game has already started', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'player1', 'Alice');
    mgr.startGame(room.roomId, 'host1');
    const result = mgr.joinRoom(room.roomCode, 'player2', 'Bob');
    expect(result.ok).toBe(false);
  });

  it('rejects start when no non-host players are present', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    const result = mgr.startGame(room.roomId, 'host1');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/player/i);
  });

  it('ends round immediately when all non-host players answer', () => {
    const { mgr, broadcast } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
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
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    mgr.submitAnswer(room.roomId, 'p1', q.id, 'anything');
    expect(mgr.toDTO(room).status).toBe('ROUND_RESULT'); // only 1 non-host player, answered → result
  });

  it('ignores answer submission from host', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    mgr.submitAnswer(room.roomId, 'host1', q.id, q.options[0]); // host tries to submit
    expect(mgr.toDTO(room).status).toBe('ROUND_ACTIVE'); // should remain active
  });

  it('promotes a new host when host disconnects during game', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
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
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.leaveRoom(room.roomId, 'p1');

    const players = mgr.toDTO(room).players;
    expect(players.find(p => p.id === 'p1')).toBeUndefined();
  });

  it('transfers host when host leaves during game', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');
    mgr.leaveRoom(room.roomId, 'host1');

    const dto = mgr.toDTO(room);
    expect(dto.hostId).toBe('p1');
  });

  it('host name is set correctly on createRoom', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'GameMaster');
    const dto = mgr.toDTO(room);
    const host = dto.players.find(p => p.isHost);
    expect(host?.name).toBe('GameMaster');
  });

  it('streak increments on consecutive correct answers', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    // Answer round 1 correctly
    const q1 = mgr.toDTO(room).currentQuestion!;
    const correctAnswer1 = room.rounds[0].correctAnswer;
    mgr.submitAnswer(room.roomId, 'p1', q1.id, correctAnswer1);
    // Advance to round 2
    mgr.advanceRound(room.roomId, 'host1');

    // Answer round 2 correctly
    const q2 = mgr.toDTO(room).currentQuestion!;
    const correctAnswer2 = room.rounds[1].correctAnswer;
    mgr.submitAnswer(room.roomId, 'p1', q2.id, correctAnswer2);

    const dto = mgr.toDTO(room);
    const player = dto.players.find(p => p.id === 'p1')!;
    expect(player.streak).toBe(2);
    // Round 1: streak=1 (+1) + speed bonus (+2 max since answered immediately) = 3
    // Round 2: streak=2 (+2) + speed bonus (+2) = 4; total = 7
    expect(player.score).toBe(7);
  });

  it('streak resets on wrong answer', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.startGame(room.roomId, 'host1');

    const q = mgr.toDTO(room).currentQuestion!;
    mgr.submitAnswer(room.roomId, 'p1', q.id, '__wrong__');

    const player = mgr.toDTO(room).players.find(p => p.id === 'p1')!;
    expect(player.streak).toBe(0);
  });

  it('host can kick a non-host player', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');

    const result = mgr.kickPlayer(room.roomId, 'host1', 'p1');
    expect(result.ok).toBe(true);
    const players = mgr.toDTO(room).players;
    expect(players.find(p => p.id === 'p1')).toBeUndefined();
  });

  it('non-host cannot kick players', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    mgr.joinRoom(room.roomCode, 'p1', 'Alice');
    mgr.joinRoom(room.roomCode, 'p2', 'Bob');

    const result = mgr.kickPlayer(room.roomId, 'p1', 'p2');
    expect(result.ok).toBe(false);
  });

  it('exposes maxPlayers in DTO', () => {
    const { mgr } = makeManager();
    const room = mgr.createRoom('host1', 'Host');
    const dto = mgr.toDTO(room);
    expect(dto.maxPlayers).toBe(8);
  });
});
