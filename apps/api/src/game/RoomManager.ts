import { randomBytes } from 'crypto';
import type { GameCategory, GameMode, GameSettings, PlayerState, PublicQuestion, RoomStateDTO, RoomStatus } from '@hangul-quest/shared';
import { generateRoundQuestions } from './QuestionBank.js';

interface RoomPlayer extends PlayerState {
  answeredThisRound: boolean;
}

interface RoundData {
  question: PublicQuestion;
  correctAnswer: string;
}

interface Room {
  roomId: string;
  roomCode: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  status: RoomStatus;
  settings: GameSettings;
  currentRound: number;
  rounds: RoundData[];
  roundWinner: { id: string; name: string } | null;
  roundExpiresAt: number | null;
  roundStartedAt: number | null;
  roundTimer: ReturnType<typeof setTimeout> | null;
  autoAdvanceTimer: ReturnType<typeof setTimeout> | null;
}

const MAX_PLAYERS = 8;

const DEFAULT_SETTINGS: GameSettings = {
  category: 'KOREAN_WORDS',
  totalRounds: 10,
  timeLimit: 15,
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateId(): string {
  return randomBytes(8).toString('hex');
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private codeToId = new Map<string, string>();
  private onStateChange: (roomId: string, state: RoomStateDTO) => void;

  constructor(onStateChange: (roomId: string, state: RoomStateDTO) => void) {
    this.onStateChange = onStateChange;
  }

  createRoom(hostId: string, hostName: string, settings?: Partial<GameSettings>): Room {
    const roomId = generateId();
    let roomCode: string;
    do { roomCode = generateRoomCode(); } while (this.codeToId.has(roomCode));

    const mergedSettings: GameSettings = { ...DEFAULT_SETTINGS, ...settings };
    const room: Room = {
      roomId,
      roomCode,
      hostId,
      players: new Map([[hostId, {
        id: hostId,
        name: hostName.trim().slice(0, 20) || 'Host',
        score: 0,
        connected: true,
        isHost: true,
        streak: 0,
        answeredThisRound: false,
      }]]),
      status: 'LOBBY',
      settings: mergedSettings,
      currentRound: 0,
      rounds: [],
      roundWinner: null,
      roundExpiresAt: null,
      roundStartedAt: null,
      roundTimer: null,
      autoAdvanceTimer: null,
    };

    this.rooms.set(roomId, room);
    this.codeToId.set(roomCode, roomId);
    return room;
  }

  joinRoom(roomCode: string, playerId: string, playerName: string): { ok: true; roomId: string } | { ok: false; error: string } {
    const roomId = this.codeToId.get(roomCode);
    if (!roomId) return { ok: false, error: 'Room not found' };
    const room = this.rooms.get(roomId)!;
    if (room.status !== 'LOBBY') return { ok: false, error: 'Game already started' };
    const playerCount = [...room.players.values()].filter(p => !p.isHost).length;
    if (playerCount >= MAX_PLAYERS) return { ok: false, error: 'Room is full' };

    const trimmedName = playerName.trim().slice(0, 20);

    // Auto-assign team for teams mode
    const team = room.settings.gameMode === 'teams'
      ? (playerCount % 2 === 0 ? 'red' : 'blue') as 'red' | 'blue'
      : undefined;

    room.players.set(playerId, {
      id: playerId,
      name: trimmedName,
      score: 0,
      connected: true,
      isHost: false,
      streak: 0,
      team,
      answeredThisRound: false,
    });
    this.broadcast(room);
    return { ok: true, roomId };
  }

  reconnect(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const player = room.players.get(playerId);
    if (!player) return false;
    player.connected = true;
    this.broadcast(room);
    return true;
  }

  disconnect(playerId: string): void {
    for (const room of this.rooms.values()) {
      const player = room.players.get(playerId);
      if (!player) continue;
      player.connected = false;
      if (room.status === 'LOBBY' && player.isHost) {
        this.closeRoom(room.roomId);
        return;
      }
      if (player.isHost && room.status !== 'LOBBY') {
        const newHost = [...room.players.values()].find(p => p.connected && !p.isHost);
        if (newHost) {
          player.isHost = false;
          newHost.isHost = true;
          room.hostId = newHost.id;
        } else {
          this.closeRoom(room.roomId);
          return;
        }
      }
      this.broadcast(room);
    }
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;

    if (player.isHost) {
      const newHost = [...room.players.values()].find(p => p.connected && !p.isHost);
      if (newHost) {
        player.isHost = false;
        newHost.isHost = true;
        room.hostId = newHost.id;
      } else {
        this.closeRoom(roomId);
        return;
      }
    }

    room.players.delete(playerId);
    this.broadcast(room);
  }

  kickPlayer(roomId: string, requesterId: string, targetId: string): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can kick players' };
    if (requesterId === targetId) return { ok: false, error: 'Cannot kick yourself' };
    if (!room.players.has(targetId)) return { ok: false, error: 'Player not found' };

    room.players.delete(targetId);
    this.broadcast(room);
    return { ok: true };
  }

  assignTeam(roomId: string, requesterId: string, targetId: string, team: 'red' | 'blue'): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can assign teams' };
    if (room.status !== 'LOBBY') return { ok: false, error: 'Can only assign teams in lobby' };
    const player = room.players.get(targetId);
    if (!player) return { ok: false, error: 'Player not found' };
    player.team = team;
    this.broadcast(room);
    return { ok: true };
  }

  startGame(roomId: string, requesterId: string): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can start' };
    if (room.status !== 'LOBBY') return { ok: false, error: 'Game already started' };
    const nonHostCount = [...room.players.values()].filter(p => !p.isHost).length;
    if (nonHostCount < 1) return { ok: false, error: 'Need at least 1 player' };

    room.rounds = generateRoundQuestions(room.settings.category, room.settings.totalRounds);
    room.currentRound = 0;
    this.startRound(room);
    return { ok: true };
  }

  private startRound(room: Room): void {
    const roundIndex = room.currentRound;
    if (roundIndex >= room.rounds.length) {
      this.endGame(room);
      return;
    }

    for (const p of room.players.values()) p.answeredThisRound = false;
    room.roundWinner = null;
    room.status = 'ROUND_ACTIVE';
    room.roundExpiresAt = Date.now() + room.settings.timeLimit * 1000;
    room.roundStartedAt = Date.now();

    room.roundTimer = setTimeout(() => this.handleRoundTimeout(room.roomId), room.settings.timeLimit * 1000);
    this.broadcast(room);
  }

  submitAnswer(roomId: string, playerId: string, questionId: string, answer: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ROUND_ACTIVE') return;

    const player = room.players.get(playerId);
    if (!player || player.isHost || player.answeredThisRound || player.eliminated) return;

    const roundData = room.rounds[room.currentRound];
    if (!roundData || roundData.question.id !== questionId) return;

    player.answeredThisRound = true;

    // Case-insensitive matching for typed mode
    const isCorrect = room.settings.inputMode === 'typed'
      ? answer.trim().toLowerCase() === roundData.correctAnswer.toLowerCase()
      : answer === roundData.correctAnswer;

    if (isCorrect) {
      if (!room.roundWinner) {
        room.roundWinner = { id: playerId, name: player.name };
      }
      player.streak += 1;

      // Speed bonus: +2 if answered in first 33% of time, +1 in first 66%
      const elapsed = Date.now() - (room.roundStartedAt ?? Date.now());
      const fraction = elapsed / (room.settings.timeLimit * 1000);
      const speedBonus = fraction < 0.33 ? 2 : fraction < 0.66 ? 1 : 0;

      player.score += Math.min(player.streak, 3) + speedBonus;
    } else {
      player.streak = 0;
      // Elimination mode: wrong answer eliminates the player
      if (room.settings.gameMode === 'elimination') {
        player.eliminated = true;
      }
    }

    // Check if game should end due to elimination (only 1 or 0 active players remain)
    if (room.settings.gameMode === 'elimination') {
      const activePlayers = [...room.players.values()].filter(p => !p.isHost && !p.eliminated && p.connected);
      if (activePlayers.length <= 1) {
        this.endRound(room);
        return;
      }
    }

    const activePlayers = [...room.players.values()].filter(p => p.connected && !p.isHost && !p.eliminated);
    const allAnswered = activePlayers.every(p => p.answeredThisRound);
    if (allAnswered) this.endRound(room);
    else this.broadcast(room);
  }

  private handleRoundTimeout(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ROUND_ACTIVE') return;
    this.endRound(room);
  }

  private endRound(room: Room): void {
    if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null; }

    // Reset streak for non-eliminated players who didn't answer
    for (const p of room.players.values()) {
      if (!p.isHost && !p.answeredThisRound && !p.eliminated) {
        p.streak = 0;
      }
    }

    room.status = 'ROUND_RESULT';
    room.roundExpiresAt = null;

    // Check if elimination game is over (≤1 active player)
    if (room.settings.gameMode === 'elimination') {
      const survivors = [...room.players.values()].filter(p => !p.isHost && !p.eliminated);
      if (survivors.length <= 1) {
        // Brief delay then end game
        setTimeout(() => {
          const r = this.rooms.get(room.roomId);
          if (r && r.status === 'ROUND_RESULT') this.endGame(r);
        }, 3000);
      }
    }

    // Auto-advance if configured
    const delay = room.settings.autoAdvanceDelay;
    if (delay && delay > 0) {
      room.autoAdvanceTimer = setTimeout(() => {
        const r = this.rooms.get(room.roomId);
        if (r && r.status === 'ROUND_RESULT') {
          this.advanceRound(r.roomId, r.hostId);
        }
      }, delay * 1000);
    }

    this.broadcast(room);
  }

  advanceRound(roomId: string, requesterId: string): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can advance' };
    if (room.status !== 'ROUND_RESULT') return { ok: false, error: 'Not in result phase' };

    if (room.autoAdvanceTimer) { clearTimeout(room.autoAdvanceTimer); room.autoAdvanceTimer = null; }

    room.currentRound += 1;
    if (room.currentRound >= room.rounds.length) {
      this.endGame(room);
    } else {
      this.startRound(room);
    }
    return { ok: true };
  }

  private endGame(room: Room): void {
    room.status = 'GAME_OVER';
    room.roundExpiresAt = null;
    this.broadcast(room);
  }

  playAgain(roomId: string, requesterId: string): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can restart' };
    if (room.status !== 'GAME_OVER') return { ok: false, error: 'Game not over yet' };

    for (const p of room.players.values()) {
      p.score = 0;
      p.streak = 0;
      p.eliminated = undefined;
      p.answeredThisRound = false;
    }
    room.currentRound = 0;
    room.rounds = [];
    room.roundWinner = null;
    room.roundStartedAt = null;
    room.status = 'LOBBY';
    this.broadcast(room);
    return { ok: true };
  }

  updateSettings(roomId: string, requesterId: string, settings: Partial<GameSettings>): void {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== requesterId || room.status !== 'LOBBY') return;
    room.settings = { ...room.settings, ...settings };
    this.broadcast(room);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(roomCode: string): Room | undefined {
    const id = this.codeToId.get(roomCode);
    return id ? this.rooms.get(id) : undefined;
  }

  private closeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.roundTimer) clearTimeout(room.roundTimer);
    if (room.autoAdvanceTimer) clearTimeout(room.autoAdvanceTimer);
    this.codeToId.delete(room.roomCode);
    this.rooms.delete(roomId);
  }

  private broadcast(room: Room): void {
    this.onStateChange(room.roomId, this.toDTO(room));
  }

  toDTO(room: Room): RoomStateDTO {
    const roundData = room.rounds[room.currentRound];
    const revealAnswer = room.status === 'ROUND_RESULT' || room.status === 'GAME_OVER';
    const delay = room.settings.autoAdvanceDelay;

    // Compute team scores
    let teamScores: { red: number; blue: number } | undefined;
    if (room.settings.gameMode === 'teams') {
      teamScores = { red: 0, blue: 0 };
      for (const p of room.players.values()) {
        if (!p.isHost && p.team) teamScores[p.team] += p.score;
      }
    }

    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: [...room.players.values()].map(({ answeredThisRound: _, ...p }) => p),
      status: room.status,
      settings: room.settings,
      currentRound: room.currentRound + 1,
      maxPlayers: MAX_PLAYERS,
      currentQuestion: roundData?.question,
      roundWinner: room.roundWinner,
      correctAnswer: revealAnswer ? roundData?.correctAnswer : undefined,
      roundExpiresAt: room.roundExpiresAt ?? undefined,
      roundStartedAt: room.roundStartedAt ?? undefined,
      autoAdvanceAt: (room.status === 'ROUND_RESULT' && delay && delay > 0)
        ? Date.now() + delay * 1000
        : undefined,
      teamScores,
    };
  }
}
