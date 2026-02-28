import { nanoid } from "nanoid";
import type {
  Difficulty,
  GameMode,
  GameStatus,
  MiniGameType,
  PlayerDTO,
  PlayerPerformanceDTO,
  QuestionDTO,
  RoomSettingsDTO,
  RoomStateDTO
} from "@hangul-quest/shared";
import { QuestionEngine } from "./QuestionEngine.js";
import { nextEligibleTurn } from "./TurnEngine.js";
import { getChapterForLevel, getFestivalChapter, getFestivalQuestPool, getQuestForLevel, type ChapterConfig, type QuestConfig } from "./story.js";

export type RoomPlayer = PlayerDTO;

export type RoomState = {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  mode: GameMode;
  settings: RoomSettingsDTO;
  status: GameStatus;
  players: RoomPlayer[];
  playerPerformance: Record<string, PlayerPerformanceDTO>;
  questId: string;
  requiredSuccesses: number;
  successfulMiniGames: number;
  consecutiveFailures: number;
  averageResponseMs: number;
  level: number;
  chapterId: RoomStateDTO["chapterId"];
  chapterTitle: string;
  questTitle: string;
  learningGoal: string;
  storyGoal: string;
  progressMeter: number;
  teamHealth: number;
  maxTeamHealth: number;
  turnIndex: number;
  activePlayerId: string | null;
  challengeId: string | null;
  currentQuestEffect:
    | "bridge_open"
    | "lake_calm"
    | "forge_ignited"
    | "market_restored"
    | "arena_shield_break"
    | "archive_unsealed";
  gameInstanceId: string;
  currentQuestion: QuestionDTO | null;
  failedPlayerIds: Set<string>;
  recentOutcomes: boolean[];
  recentResponseMs: number[];
  lastMiniGameType: MiniGameType | null;
  expiresAt: number | null;
  challengeStartedAt: number | null;
};

export type SerializedRoomState = Omit<RoomState, "failedPlayerIds"> & {
  failedPlayerIds: string[];
};

export class RoomManager {
  private readonly rooms = new Map<string, RoomState>();
  private readonly questionEngine = new QuestionEngine();

  constructor(private readonly turnTimeoutMs: number, private readonly maxPlayers: number) {}

  createRoom(
    hostName: string,
    options: { mode?: GameMode; noFailureCondition?: boolean; difficultyOverride?: Difficulty | null } = {}
  ) {
    const roomId = nanoid();
    const roomCode = nanoid(6).toUpperCase();
    const hostId = nanoid();
    const mode = options.mode ?? "STORY_CAMPAIGN";
    const settings: RoomSettingsDTO = {
      noFailureCondition: mode === "CLASSROOM" ? true : (options.noFailureCondition ?? false),
      difficultyOverride: options.difficultyOverride ?? null
    };

    const room: RoomState = {
      roomId,
      roomCode,
      hostUserId: hostId,
      mode,
      settings,
      status: "LOBBY",
      players: [{ userId: hostId, username: hostName, connected: true, seatIndex: 0 }],
      playerPerformance: {
        [hostId]: { userId: hostId, username: hostName, attempts: 0, correct: 0, timeouts: 0 }
      },
      questId: "forest_bridge_01",
      requiredSuccesses: 10,
      successfulMiniGames: 0,
      consecutiveFailures: 0,
      averageResponseMs: 0,
      level: 1,
      chapterId: "CH1_CONSONANTS",
      chapterTitle: "Chapter 1: Forest of Consonants",
      questTitle: "Bridge of Echoes",
      learningGoal: "기본 자음을 인식하고 발음하기",
      storyGoal: "흩어진 자음 정령을 회수하여 다리를 복구한다",
      progressMeter: 0,
      teamHealth: 3,
      maxTeamHealth: 3,
      turnIndex: 0,
      activePlayerId: null,
      challengeId: null,
      currentQuestEffect: "bridge_open",
      gameInstanceId: nanoid(),
      currentQuestion: null,
      failedPlayerIds: new Set(),
      recentOutcomes: [],
      recentResponseMs: [],
      lastMiniGameType: null,
      expiresAt: null,
      challengeStartedAt: null
    };

    this.rooms.set(roomId, room);
    return { room, playerId: hostId };
  }

  joinRoom(roomCode: string, username: string) {
    const room = [...this.rooms.values()].find((r) => r.roomCode === roomCode);
    if (!room) throw new Error("room_not_found");
    if (room.players.length >= this.maxPlayers) throw new Error("room_full");

    const playerId = nanoid();
    room.players.push({ userId: playerId, username, connected: true, seatIndex: room.players.length });
    room.playerPerformance[playerId] = { userId: playerId, username, attempts: 0, correct: 0, timeouts: 0 };
    room.status = room.players.length >= 2 ? "ROOM_READY" : "LOBBY";
    return { room, playerId };
  }

  updateSettings(roomId: string, settingsUpdate: Partial<RoomSettingsDTO>) {
    const room = this.getRoom(roomId);
    room.settings = {
      ...room.settings,
      ...settingsUpdate,
      noFailureCondition: room.mode === "CLASSROOM" ? true : (settingsUpdate.noFailureCondition ?? room.settings.noFailureCondition),
      difficultyOverride:
        settingsUpdate.difficultyOverride === undefined ? room.settings.difficultyOverride : settingsUpdate.difficultyOverride
    };
    return room;
  }

  getRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("room_not_found");
    return room;
  }

  hasRoom(roomId: string) {
    return this.rooms.has(roomId);
  }

  closeRoom(roomId: string) {
    return this.rooms.delete(roomId);
  }

  restoreRoom(serialized: SerializedRoomState) {
    const room: RoomState = {
      ...serialized,
      failedPlayerIds: new Set(serialized.failedPlayerIds)
    };
    this.rooms.set(room.roomId, room);
    return room;
  }

  startGame(roomId: string) {
    const room = this.getRoom(roomId);
    if (room.mode !== "CLASSROOM" && room.players.length < 2) throw new Error("not_enough_players");
    room.status = "TURN_START";
    room.turnIndex = 0;
    room.activePlayerId = room.players[0]?.userId ?? null;
    room.teamHealth = room.maxTeamHealth;
    room.progressMeter = 0;
    room.successfulMiniGames = 0;
    room.consecutiveFailures = 0;
    this.startChallenge(room);
    return room;
  }

  submitAnswer(roomId: string, playerId: string, answer: string) {
    const room = this.getRoom(roomId);
    const active = room.activePlayerId;
    if (!active || active !== playerId) throw new Error("not_your_turn");
    if (!room.currentQuestion || !room.challengeId) throw new Error("challenge_not_ready");

    const isCorrect = this.questionEngine.validateAnswer(room.currentQuestion, answer);
    const latencyMs = room.challengeStartedAt ? Math.max(0, Date.now() - room.challengeStartedAt) : 0;
    this.recordAttempt(room, playerId, isCorrect, false, latencyMs);

    if (isCorrect) {
      const reward = this.questionEngine.calculateReward(room.currentQuestion, true);
      room.status = "CHALLENGE_CLEARED";
      room.failedPlayerIds.clear();
      room.recentOutcomes = [...room.recentOutcomes, true].slice(-12);
      room.consecutiveFailures = 0;
      room.successfulMiniGames += 1;
      room.progressMeter = Math.min(100, room.progressMeter + reward.progressDelta);
      const questCompleted = room.progressMeter >= 100 || room.successfulMiniGames >= room.requiredSuccesses;
      return { isCorrect, room, challengeCleared: true, challengeFailed: false, questCompleted };
    }

    this.onFailedAttempt(room, playerId, answer);
    const nextIdx = nextEligibleTurn(room);

    if (nextIdx === null) {
      if (room.settings.noFailureCondition) {
        const connectedIdx = this.nextConnectedTurn(room);
        if (connectedIdx !== null) {
          room.failedPlayerIds.clear();
          room.turnIndex = connectedIdx;
          room.activePlayerId = room.players[connectedIdx].userId;
          room.status = "TURN_START";
          room.expiresAt = Date.now() + this.turnTimeoutMs;
          room.challengeStartedAt = Date.now();
          return { isCorrect, room, challengeCleared: false, challengeFailed: false, questCompleted: false };
        }
      }

      room.status = "CHALLENGE_FAILED";
      room.teamHealth = Math.max(0, room.teamHealth - 1);
      return { isCorrect, room, challengeCleared: false, challengeFailed: true, questCompleted: false };
    }

    room.turnIndex = nextIdx;
    room.activePlayerId = room.players[nextIdx].userId;
    room.status = "TURN_START";
    room.expiresAt = Date.now() + this.turnTimeoutMs;
    room.challengeStartedAt = Date.now();
    return { isCorrect, room, challengeCleared: false, challengeFailed: false, questCompleted: false };
  }

  timeoutActiveTurn(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    const active = room.activePlayerId;
    if (!active || active !== playerId) throw new Error("not_your_turn");
    if (!room.currentQuestion || !room.challengeId) throw new Error("challenge_not_ready");

    this.onFailedAttempt(room, playerId, "__TIMEOUT__", true);
    const nextIdx = nextEligibleTurn(room);

    if (nextIdx === null) {
      if (room.settings.noFailureCondition) {
        const connectedIdx = this.nextConnectedTurn(room);
        if (connectedIdx !== null) {
          room.failedPlayerIds.clear();
          room.turnIndex = connectedIdx;
          room.activePlayerId = room.players[connectedIdx].userId;
          room.status = "TURN_START";
          room.expiresAt = Date.now() + this.turnTimeoutMs;
          room.challengeStartedAt = Date.now();
          return { isCorrect: false, room, challengeCleared: false, challengeFailed: false, reason: "timeout" as const };
        }
      }

      room.status = "CHALLENGE_FAILED";
      room.teamHealth = Math.max(0, room.teamHealth - 1);
      return { isCorrect: false, room, challengeCleared: false, challengeFailed: true, reason: "timeout" as const };
    }

    room.turnIndex = nextIdx;
    room.activePlayerId = room.players[nextIdx].userId;
    room.status = "TURN_START";
    room.expiresAt = Date.now() + this.turnTimeoutMs;
    room.challengeStartedAt = Date.now();
    return { isCorrect: false, room, challengeCleared: false, challengeFailed: false, reason: "timeout" as const };
  }

  nextChallenge(roomId: string) {
    const room = this.getRoom(roomId);

    if (room.progressMeter >= 100 || room.successfulMiniGames >= room.requiredSuccesses) {
      room.level += 1;
      room.progressMeter = 0;
      room.successfulMiniGames = 0;
      room.consecutiveFailures = 0;
      room.failedPlayerIds.clear();
      room.lastMiniGameType = null;
    }

    const idx = (room.turnIndex + 1) % room.players.length;
    room.turnIndex = idx;
    room.activePlayerId = room.players[idx].userId;
    this.startChallenge(room);
    return room;
  }

  retryChallenge(roomId: string) {
    const room = this.getRoom(roomId);
    room.failedPlayerIds.clear();
    if (room.teamHealth <= 0) {
      room.teamHealth = room.maxTeamHealth;
      room.progressMeter = Math.max(0, room.progressMeter - 20);
      room.successfulMiniGames = Math.max(0, Math.floor(room.progressMeter / 10));
    }
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    room.activePlayerId = room.players[room.turnIndex].userId;
    room.status = "TURN_START";
    room.expiresAt = Date.now() + this.turnTimeoutMs;
    room.challengeStartedAt = Date.now();
    return room;
  }

  toDTO(room: RoomState): RoomStateDTO {
    const currentQuestion = room.currentQuestion ? this.sanitizeQuestion(room.currentQuestion) : null;

    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostUserId: room.hostUserId,
      mode: room.mode,
      settings: room.settings,
      status: room.status,
      players: room.players,
      playerPerformance: Object.values(room.playerPerformance),
      questId: room.questId,
      requiredSuccesses: room.requiredSuccesses,
      successfulMiniGames: room.successfulMiniGames,
      consecutiveFailures: room.consecutiveFailures,
      averageResponseMs: room.averageResponseMs,
      level: room.level,
      chapterId: room.chapterId,
      chapterTitle: room.chapterTitle,
      questTitle: room.questTitle,
      learningGoal: room.learningGoal,
      storyGoal: room.storyGoal,
      progressMeter: room.progressMeter,
      teamHealth: room.teamHealth,
      maxTeamHealth: room.maxTeamHealth,
      turnIndex: room.turnIndex,
      activePlayerId: room.activePlayerId,
      challengeId: room.challengeId,
      currentQuestion,
      failedPlayerIds: [...room.failedPlayerIds],
      expiresAt: room.expiresAt
    };
  }

  serialize(room: RoomState): SerializedRoomState {
    return {
      ...room,
      failedPlayerIds: [...room.failedPlayerIds]
    };
  }

  private startChallenge(room: RoomState) {
    const chapter = room.mode === "VILLAGE_FESTIVAL" ? getFestivalChapter() : getChapterForLevel(room.level);
    const quest = this.resolveQuest(room, chapter);

    room.chapterId = chapter.id;
    room.chapterTitle = chapter.title;
    room.questTitle = quest.title;
    room.questId = quest.questId;
    room.requiredSuccesses = quest.requiredSuccesses;
    room.learningGoal = chapter.learningGoal;
    room.storyGoal = chapter.storyGoal;
    room.currentQuestEffect = chapter.questEffect;

    const difficulty = this.getDifficulty(room);
    const miniGameType = this.pickMiniGameType(quest, room.lastMiniGameType);
    room.currentQuestion = this.questionEngine.generate(miniGameType, difficulty, chapter, quest.title);
    room.lastMiniGameType = miniGameType;
    room.challengeId = nanoid();
    room.failedPlayerIds.clear();
    room.challengeStartedAt = Date.now();
    room.expiresAt = Date.now() + this.turnTimeoutMs;
    room.status = "TURN_START";
  }

  private resolveQuest(room: RoomState, chapter: ChapterConfig): QuestConfig {
    if (room.mode === "VILLAGE_FESTIVAL") {
      return getFestivalQuestPool();
    }
    return getQuestForLevel(chapter, room.level);
  }

  private pickMiniGameType(quest: QuestConfig, lastType: MiniGameType | null): MiniGameType {
    const available = quest.miniGamePool.filter((type) => type !== lastType);
    const pool = available.length > 0 ? available : quest.miniGamePool;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getDifficulty(room: RoomState): Difficulty {
    if (room.settings.difficultyOverride) {
      return room.settings.difficultyOverride;
    }

    const baseline: Difficulty = room.level < 3 ? "BEGINNER" : room.level < 7 ? "INTERMEDIATE" : "ADVANCED";
    if (room.recentOutcomes.length < 3) return baseline;

    const accuracy = room.recentOutcomes.filter(Boolean).length / room.recentOutcomes.length;
    const fastAnswers = room.averageResponseMs > 0 && room.averageResponseMs <= 6000;

    if (accuracy <= 0.5 || room.consecutiveFailures >= 2) {
      return "BEGINNER";
    }

    if (accuracy >= 0.85 && fastAnswers) {
      return baseline === "BEGINNER" ? "INTERMEDIATE" : "ADVANCED";
    }

    return baseline;
  }

  private onFailedAttempt(room: RoomState, playerId: string, answer: string, timedOut = false) {
    room.failedPlayerIds.add(playerId);
    room.recentOutcomes = [...room.recentOutcomes, false].slice(-12);
    room.consecutiveFailures += 1;
    this.recordAttempt(room, playerId, false, timedOut, this.turnTimeoutMs);

    const question = room.currentQuestion;
    if (question && question.miniGameType === "MARKET_RESTORATION" && "options" in question) {
      question.options = (question.options ?? []).filter((option) => option !== answer);
    }
  }

  private recordAttempt(room: RoomState, playerId: string, isCorrect: boolean, timedOut: boolean, latencyMs: number) {
    if (!room.playerPerformance[playerId]) {
      const player = room.players.find((item) => item.userId === playerId);
      room.playerPerformance[playerId] = {
        userId: playerId,
        username: player?.username ?? "Unknown",
        attempts: 0,
        correct: 0,
        timeouts: 0
      };
    }

    room.playerPerformance[playerId].attempts += 1;
    if (isCorrect) room.playerPerformance[playerId].correct += 1;
    if (timedOut) room.playerPerformance[playerId].timeouts += 1;

    room.recentResponseMs = [...room.recentResponseMs, Math.max(0, latencyMs)].slice(-12);
    room.averageResponseMs =
      room.recentResponseMs.length > 0
        ? Math.floor(room.recentResponseMs.reduce((sum, value) => sum + value, 0) / room.recentResponseMs.length)
        : 0;
  }

  private nextConnectedTurn(room: RoomState): number | null {
    const n = room.players.length;
    for (let step = 1; step <= n; step += 1) {
      const idx = (room.turnIndex + step) % n;
      if (room.players[idx].connected) {
        return idx;
      }
    }
    return null;
  }

  private sanitizeQuestion(question: QuestionDTO): Omit<QuestionDTO, "expected"> {
    const { expected, ...safeQuestion } = question;
    void expected;
    return safeQuestion;
  }
}
