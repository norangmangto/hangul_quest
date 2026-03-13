import { randomBytes } from 'crypto';
import type { GameCategory, GameSettings, PlayerState, PublicQuestion, RoomStateDTO, RoomStatus } from '@hangul-quest/shared';
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
  roundTimer: ReturnType<typeof setTimeout> | null;
}

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

  createRoom(hostId: string, settings?: Partial<GameSettings>): Room {
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
        name: '',
        score: 0,
        connected: true,
        isHost: true,
        answeredThisRound: false,
      }]]),
      status: 'LOBBY',
      settings: mergedSettings,
      currentRound: 0,
      rounds: [],
      roundWinner: null,
      roundExpiresAt: null,
      roundTimer: null,
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
    if (playerCount >= 8) return { ok: false, error: 'Room is full' };

    const trimmedName = playerName.trim().slice(0, 20);

    room.players.set(playerId, {
      id: playerId,
      name: trimmedName,
      score: 0,
      connected: true,
      isHost: false,
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
      // During an active game, promote a new host if the host disconnects
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

    room.roundTimer = setTimeout(() => this.handleRoundTimeout(room.roomId), room.settings.timeLimit * 1000);
    this.broadcast(room);
  }

  submitAnswer(roomId: string, playerId: string, questionId: string, answer: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ROUND_ACTIVE') return;

    const player = room.players.get(playerId);
    if (!player || player.isHost || player.answeredThisRound) return;

    const roundData = room.rounds[room.currentRound];
    if (!roundData || roundData.question.id !== questionId) return;

    player.answeredThisRound = true;

    if (answer === roundData.correctAnswer && !room.roundWinner) {
      room.roundWinner = { id: playerId, name: player.name };
      player.score += 1;
    }

    const connectedPlayers = [...room.players.values()].filter(p => p.connected && !p.isHost);
    const allAnswered = connectedPlayers.every(p => p.answeredThisRound);
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
    room.status = 'ROUND_RESULT';
    room.roundExpiresAt = null;
    this.broadcast(room);
  }

  advanceRound(roomId: string, requesterId: string): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.hostId !== requesterId) return { ok: false, error: 'Only the host can advance' };
    if (room.status !== 'ROUND_RESULT') return { ok: false, error: 'Not in result phase' };

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
      p.answeredThisRound = false;
    }
    room.currentRound = 0;
    room.rounds = [];
    room.roundWinner = null;
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
    this.codeToId.delete(room.roomCode);
    this.rooms.delete(roomId);
  }

  private broadcast(room: Room): void {
    this.onStateChange(room.roomId, this.toDTO(room));
  }

  toDTO(room: Room): RoomStateDTO {
    const roundData = room.rounds[room.currentRound];
    const revealAnswer = room.status === 'ROUND_RESULT' || room.status === 'GAME_OVER';
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: [...room.players.values()].map(({ answeredThisRound: _, ...p }) => p),
      status: room.status,
      settings: room.settings,
      currentRound: room.currentRound + 1,
      currentQuestion: roundData?.question,
      roundWinner: room.roundWinner,
      correctAnswer: revealAnswer ? roundData?.correctAnswer : undefined,
      roundExpiresAt: room.roundExpiresAt ?? undefined,
    };
  }
}
