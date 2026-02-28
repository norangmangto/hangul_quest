import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import jwt from "@fastify/jwt";
import { Server, type Socket } from "socket.io";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { nanoid } from "nanoid";
import type {
  ClientToServerEvents,
  Difficulty,
  GameMode,
  GameStatus,
  QuestionDTO,
  ServerToClientEvents
} from "@hangul-quest/shared";
import { env } from "./config.js";
import { signGameToken } from "./auth.js";
import { registerRestRoutes } from "./routes/rest.js";
import { RoomManager, type SerializedRoomState } from "./game/RoomManager.js";
import { prisma } from "./prisma.js";

const app = Fastify({ logger: true });
const redis = new Redis(env.REDIS_URL);
const redisPub = new Redis(env.REDIS_URL);
const redisSub = redisPub.duplicate();
const roomManager = new RoomManager(env.TURN_TIMEOUT_MS, env.MAX_PLAYERS_PER_ROOM);
const timeoutZSetKey = "turn:timeouts";
const timeoutMetaPrefix = "turn:timeout:meta";
const timeoutLockPrefix = "turn:timeout:lock";
let timeoutWorker: NodeJS.Timeout | null = null;
const roomCloseTimers = new Map<string, NodeJS.Timeout>();
const roomCloseDelayMs = 5000;

await app.register(sensible);
await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
await app.register(jwt, { secret: env.JWT_SECRET });
await registerRestRoutes(app);

app.log.info({ turboPluginEnabled: env.ENABLE_TURBO_PLUGIN }, "Turbo mini-game plugin configuration");

const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true }
});
io.adapter(createAdapter(redisPub, redisSub));

type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const questEffects: ReadonlyArray<SerializedRoomState["currentQuestEffect"]> = [
  "bridge_open",
  "lake_calm",
  "forge_ignited",
  "market_restored",
  "arena_shield_break",
  "archive_unsealed"
];

const miniGameTypes: ReadonlyArray<NonNullable<SerializedRoomState["lastMiniGameType"]>> = [
  "LETTER_RECOGNITION",
  "SPIRIT_CATCH",
  "ECHO_SHRINE",
  "SYLLABLE_FORGE",
  "MARKET_RESTORATION",
  "SYLLABLE_UNSCRAMBLE",
  "ARENA_WORDS",
  "SENTENCE_RESTORATION"
];

function isQuestEffect(value: unknown): value is SerializedRoomState["currentQuestEffect"] {
  return typeof value === "string" && questEffects.includes(value as SerializedRoomState["currentQuestEffect"]);
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "Unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message) || "Unknown error";
  }
  return "Unknown error occurred";
}

function assertAuthenticated(socket: IOSocket): { userId: string; username: string } {
  const userId = socket.data.userId as string | undefined;
  const username = socket.data.username as string | undefined;
  if (!userId || !username) {
    throw new Error("unauthorized");
  }
  return { userId, username };
}

function assertRoomMember(socket: IOSocket, roomId: string) {
  const room = roomManager.getRoom(roomId);
  const { userId } = assertAuthenticated(socket);
  const isMember = room.players.some((player) => player.userId === userId);
  if (!isMember) throw new Error("forbidden_room_access");
}

function assertRoomHost(socket: IOSocket, roomId: string) {
  const room = roomManager.getRoom(roomId);
  const { userId } = assertAuthenticated(socket);
  if (room.hostUserId !== userId) throw new Error("forbidden_host_only");
}

async function enforceRateLimit(socket: IOSocket, eventName: string) {
  const subject = (socket.data.userId as string | undefined) ?? `anon:${socket.id}`;
  const key = `rate:${eventName}:${subject}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  if (count > env.RATE_LIMIT_PER_MIN) {
    throw new Error("rate_limited");
  }
}

function parseSnapshot(snapshot: unknown, fallback: SerializedRoomState): SerializedRoomState {
  if (!isRecord(snapshot)) return fallback;

  const failedPlayerIds = Array.isArray(snapshot.failedPlayerIds)
    ? snapshot.failedPlayerIds.filter((item): item is string => typeof item === "string")
    : fallback.failedPlayerIds;

  const players = Array.isArray(snapshot.players)
    ? snapshot.players
        .filter(isRecord)
        .map((item, idx) => ({
          userId: typeof item.userId === "string" ? item.userId : nanoid(),
          username: typeof item.username === "string" ? item.username : `Player${idx + 1}`,
          connected: typeof item.connected === "boolean" ? item.connected : false,
          seatIndex: typeof item.seatIndex === "number" ? item.seatIndex : idx
        }))
    : fallback.players;

  const status = typeof snapshot.status === "string" ? (snapshot.status as GameStatus) : fallback.status;
  const mode = typeof snapshot.mode === "string" ? (snapshot.mode as GameMode) : fallback.mode;
  const recentOutcomes = Array.isArray(snapshot.recentOutcomes)
    ? snapshot.recentOutcomes.filter((item): item is boolean => typeof item === "boolean")
    : fallback.recentOutcomes;
  const currentQuestEffect = isQuestEffect(snapshot.currentQuestEffect) ? snapshot.currentQuestEffect : fallback.currentQuestEffect;
  const questId = typeof snapshot.questId === "string" ? snapshot.questId : fallback.questId;
  const requiredSuccesses = typeof snapshot.requiredSuccesses === "number" ? snapshot.requiredSuccesses : fallback.requiredSuccesses;
  const successfulMiniGames = typeof snapshot.successfulMiniGames === "number" ? snapshot.successfulMiniGames : fallback.successfulMiniGames;
  const consecutiveFailures = typeof snapshot.consecutiveFailures === "number" ? snapshot.consecutiveFailures : fallback.consecutiveFailures;
  const averageResponseMs = typeof snapshot.averageResponseMs === "number" ? snapshot.averageResponseMs : fallback.averageResponseMs;
  const recentResponseMs = Array.isArray(snapshot.recentResponseMs)
    ? snapshot.recentResponseMs.filter((item): item is number => typeof item === "number")
    : fallback.recentResponseMs;
  const lastMiniGameType =
    typeof snapshot.lastMiniGameType === "string" && miniGameTypes.includes(snapshot.lastMiniGameType as NonNullable<SerializedRoomState["lastMiniGameType"]>)
      ? (snapshot.lastMiniGameType as NonNullable<SerializedRoomState["lastMiniGameType"]>)
      : snapshot.lastMiniGameType === null
        ? null
        : fallback.lastMiniGameType;
  const settings = isRecord(snapshot.settings)
    ? {
        noFailureCondition:
          typeof snapshot.settings.noFailureCondition === "boolean"
            ? snapshot.settings.noFailureCondition
            : fallback.settings.noFailureCondition,
        difficultyOverride:
          typeof snapshot.settings.difficultyOverride === "string"
            ? (snapshot.settings.difficultyOverride as Difficulty)
            : snapshot.settings.difficultyOverride === null
              ? null
              : fallback.settings.difficultyOverride
      }
    : fallback.settings;
  const playerPerformance = isRecord(snapshot.playerPerformance)
    ? Object.fromEntries(
        Object.entries(snapshot.playerPerformance)
          .filter(([, value]) => isRecord(value))
          .map(([key, value]) => [
            key,
            {
              userId: typeof (value as Record<string, unknown>).userId === "string" ? ((value as Record<string, unknown>).userId as string) : key,
              username:
                typeof (value as Record<string, unknown>).username === "string"
                  ? ((value as Record<string, unknown>).username as string)
                  : "Unknown",
              attempts:
                typeof (value as Record<string, unknown>).attempts === "number"
                  ? ((value as Record<string, unknown>).attempts as number)
                  : 0,
              correct:
                typeof (value as Record<string, unknown>).correct === "number"
                  ? ((value as Record<string, unknown>).correct as number)
                  : 0,
              timeouts:
                typeof (value as Record<string, unknown>).timeouts === "number"
                  ? ((value as Record<string, unknown>).timeouts as number)
                  : 0
            }
          ])
      )
    : fallback.playerPerformance;

  return {
    ...fallback,
    ...snapshot,
    status,
    mode,
    settings,
    playerPerformance,
    questId,
    requiredSuccesses,
    successfulMiniGames,
    consecutiveFailures,
    averageResponseMs,
    recentResponseMs,
    lastMiniGameType,
    players,
    failedPlayerIds,
    recentOutcomes,
    currentQuestEffect,
    currentQuestion: (snapshot.currentQuestion as QuestionDTO | null | undefined) ?? fallback.currentQuestion
  };
}

async function upsertQuestion(question: QuestionDTO | null) {
  if (!question) return;
  await prisma.question.upsert({
    where: { id: question.id },
    update: {
      type: question.type,
      difficulty: question.difficulty,
      promptText: question.prompt,
      payloadJson: question,
      answerJson: { expected: question.expected }
    },
    create: {
      id: question.id,
      type: question.type,
      difficulty: question.difficulty,
      promptText: question.prompt,
      payloadJson: question,
      answerJson: { expected: question.expected }
    }
  });
}

async function persistRoomState(roomId: string) {
  const room = roomManager.getRoom(roomId);
  await prisma.$transaction([
    prisma.gameRoom.update({ where: { id: roomId }, data: { status: room.status } }),
    prisma.gameInstance.update({
      where: { id: room.gameInstanceId },
      data: {
        level: room.level,
        stateJson: roomManager.serialize(room),
        activePlayerId: room.activePlayerId,
        turnIndex: room.turnIndex,
        challengeId: room.challengeId
      }
    })
  ]);
}

function timeoutMemberKey(roomId: string) {
  return `${timeoutMetaPrefix}:${roomId}`;
}

function timeoutLockKey(roomId: string, challengeId: string, activePlayerId: string) {
  return `${timeoutLockPrefix}:${roomId}:${challengeId}:${activePlayerId}`;
}

async function clearTurnTimeout(roomId: string) {
  await redis.zrem(timeoutZSetKey, roomId);
  await redis.del(timeoutMemberKey(roomId));
}

function clearRoomCloseTimer(roomId: string) {
  const timer = roomCloseTimers.get(roomId);
  if (!timer) return;
  clearTimeout(timer);
  roomCloseTimers.delete(roomId);
}

async function closeRoomIfEmpty(roomId: string) {
  if (!roomManager.hasRoom(roomId)) return;
  const room = roomManager.getRoom(roomId);
  if (room.players.some((player) => player.connected)) return;
  await clearTurnTimeout(roomId);
  roomManager.closeRoom(roomId);
  await prisma.gameRoom.deleteMany({ where: { id: roomId } });
}

function scheduleRoomClose(roomId: string) {
  clearRoomCloseTimer(roomId);
  const timer = setTimeout(() => {
    roomCloseTimers.delete(roomId);
    void closeRoomIfEmpty(roomId);
  }, roomCloseDelayMs);
  roomCloseTimers.set(roomId, timer);
}

async function scheduleTurnTimeout(roomId: string, challengeId: string, activePlayerId: string, expiresAt: number) {
  const metaKey = timeoutMemberKey(roomId);
  await redis
    .multi()
    .zadd(timeoutZSetKey, expiresAt, roomId)
    .hset(metaKey, {
      roomId,
      challengeId,
      activePlayerId,
      expiresAt: String(expiresAt)
    })
    .pexpire(metaKey, Math.max(1000, expiresAt - Date.now() + 60_000))
    .exec();
}

async function processDueTimeouts() {
  const now = Date.now();
  const dueRoomIds = await redis.zrangebyscore(timeoutZSetKey, 0, now, "LIMIT", 0, 20);
  if (dueRoomIds.length === 0) return;

  for (const roomId of dueRoomIds) {
    const metaKey = timeoutMemberKey(roomId);
    const meta = await redis.hgetall(metaKey);
    if (!meta.challengeId || !meta.activePlayerId || !meta.expiresAt) {
      await clearTurnTimeout(roomId);
      continue;
    }

    const lockKey = timeoutLockKey(roomId, meta.challengeId, meta.activePlayerId);
    const lock = await redis.set(lockKey, "1", "PX", 30_000, "NX");
    if (lock !== "OK") continue;

    await clearTurnTimeout(roomId);
    await handleTurnTimeout(roomId, meta.challengeId, meta.activePlayerId);
  }
}

function startTimeoutWorker() {
  if (timeoutWorker) clearInterval(timeoutWorker);
  timeoutWorker = setInterval(() => {
    void processDueTimeouts();
  }, env.TURN_SCHEDULER_INTERVAL_MS);
}

async function enforceIdempotentSubmission(
  roomId: string,
  playerId: string,
  challengeId: string,
  clientSeq: number
) {
  const key = `idem:answer:${roomId}:${playerId}:${challengeId}:${clientSeq}`;
  const set = await redis.set(key, "1", "EX", env.IDEMPOTENCY_TTL_SECONDS, "NX");
  if (set !== "OK") {
    throw new Error("duplicate_submission");
  }
}

async function loadRoomIntoMemory(roomId: string) {
  if (roomManager.hasRoom(roomId)) {
    return roomManager.getRoom(roomId);
  }

  const dbRoom = await prisma.gameRoom.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: { user: true },
        orderBy: { seatIndex: "asc" }
      },
      instances: {
        take: 1,
        orderBy: { updatedAt: "desc" }
      }
    }
  });

  if (!dbRoom) throw new Error("room_not_found");

  const players = dbRoom.players.map((player: { userId: string; seatIndex: number; isConnected: boolean; user: { username: string } }) => ({
    userId: player.userId,
    username: player.user.username,
    connected: player.isConnected,
    seatIndex: player.seatIndex
  }));

  const latestInstance = dbRoom.instances[0];
  const fallback: SerializedRoomState = {
    roomId: dbRoom.id,
    roomCode: dbRoom.code,
    hostUserId: dbRoom.hostUserId,
    mode: "STORY_CAMPAIGN",
    settings: {
      noFailureCondition: false,
      difficultyOverride: null
    },
    status: (dbRoom.status as GameStatus) ?? "LOBBY",
    players,
    playerPerformance: Object.fromEntries(
      players.map((player: { userId: string; username: string }) => [
        player.userId,
        { userId: player.userId, username: player.username, attempts: 0, correct: 0, timeouts: 0 }
      ])
    ),
    questId: "forest_bridge_01",
    requiredSuccesses: 10,
    successfulMiniGames: 0,
    consecutiveFailures: 0,
    averageResponseMs: 0,
    level: latestInstance?.level ?? 1,
    chapterId: "CH1_CONSONANTS",
    chapterTitle: "Chapter 1: Forest of Consonants",
    questTitle: "Bridge of Echoes",
    learningGoal: "기본 자음을 인식하고 발음하기",
    storyGoal: "흩어진 자음 정령을 회수하여 다리를 복구한다",
    progressMeter: 0,
    teamHealth: 3,
    maxTeamHealth: 3,
    turnIndex: latestInstance?.turnIndex ?? 0,
    activePlayerId: latestInstance?.activePlayerId ?? null,
    challengeId: latestInstance?.challengeId ?? null,
    currentQuestEffect: "bridge_open",
    gameInstanceId: latestInstance?.id ?? nanoid(),
    currentQuestion: null,
    failedPlayerIds: [],
    recentOutcomes: [],
    recentResponseMs: [],
    lastMiniGameType: null,
    expiresAt: null,
    challengeStartedAt: null
  };

  const snapshot = parseSnapshot(latestInstance?.stateJson, fallback);
  snapshot.players = players;
  snapshot.hostUserId = dbRoom.hostUserId;
  snapshot.roomId = dbRoom.id;
  snapshot.roomCode = dbRoom.code;
  snapshot.status = (dbRoom.status as GameStatus) ?? snapshot.status;
  if (latestInstance) {
    snapshot.gameInstanceId = latestInstance.id;
  }

  return roomManager.restoreRoom(snapshot);
}

async function handleTurnOutcome(args: {
  roomId: string;
  challengeId: string;
  playerId: string;
  answer: string;
  reason: "mismatch" | "timeout";
}) {
  const { roomId, challengeId, playerId, answer, reason } = args;
  const room = roomManager.getRoom(roomId);

  if (room.currentQuestion) {
    const latencyMs = room.challengeStartedAt ? Math.max(0, Date.now() - room.challengeStartedAt) : 0;
    await upsertQuestion(room.currentQuestion);
    await prisma.$transaction([
      prisma.questionAttempt.create({
        data: {
          gameInstanceId: room.gameInstanceId,
          questionId: room.currentQuestion.id,
          playerId,
          submittedAnswerJson: { answer },
          isCorrect: false,
          latencyMs
        }
      })
    ]);
  }

  io.to(roomId).emit("answer:result", { roomId, playerId, isCorrect: false, reason });

  if (room.status === "CHALLENGE_FAILED") {
    await prisma.gameRoom.update({ where: { id: roomId }, data: { status: "CHALLENGE_FAILED" } });
    io.to(roomId).emit("health:update", {
      roomId,
      teamHealth: room.teamHealth,
      maxTeamHealth: room.maxTeamHealth
    });
    io.to(roomId).emit("challenge:failed", { roomId, challengeId });
    const retry = roomManager.retryChallenge(roomId);
    await persistRoomState(roomId);
    io.to(roomId).emit("room:state", roomManager.toDTO(retry));
    io.to(roomId).emit("turn:start", {
      roomId,
      activePlayerId: retry.activePlayerId!,
      challengeId: retry.challengeId!,
      expiresAt: retry.expiresAt!
    });
    await scheduleTurnTimeout(roomId, retry.challengeId!, retry.activePlayerId!, retry.expiresAt!);
    return;
  }

  const updated = roomManager.getRoom(roomId);
  await persistRoomState(roomId);
  io.to(roomId).emit("turn:pass", {
    roomId,
    fromPlayerId: playerId,
    toPlayerId: updated.activePlayerId!,
    failedPlayerIds: [...updated.failedPlayerIds],
    expiresAt: updated.expiresAt!
  });
  io.to(roomId).emit("room:state", roomManager.toDTO(updated));
  await scheduleTurnTimeout(roomId, updated.challengeId!, updated.activePlayerId!, updated.expiresAt!);
}

async function handleTurnTimeout(roomId: string, challengeId: string, activePlayerId: string) {
  try {
    const room = roomManager.getRoom(roomId);
    if (room.challengeId !== challengeId || room.activePlayerId !== activePlayerId || room.status !== "TURN_START") {
      return;
    }

    roomManager.timeoutActiveTurn(roomId, activePlayerId);
    await handleTurnOutcome({
      roomId,
      challengeId,
      playerId: activePlayerId,
      answer: "__TIMEOUT__",
      reason: "timeout"
    });
  } catch (error) {
    app.log.warn({ error }, "turn timeout handler failed");
  }
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    socket.data.authenticated = false;
    return next();
  }

  try {
    const payload = await app.jwt.verify<{ userId: string; username: string }>(token);
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    socket.data.authenticated = true;
    next();
  } catch {
    next(new Error("invalid_token"));
  }
});

io.on("connection", (socket) => {
  socket.on("room:create", async ({ username, mode, noFailureCondition, difficultyOverride }, ack) => {
    try {
      await enforceRateLimit(socket, "room:create");
      const { room, playerId } = roomManager.createRoom(username, {
        mode,
        noFailureCondition,
        difficultyOverride
      });
      const now = new Date();

      await prisma.$transaction([
        prisma.user.upsert({
          where: { id: playerId },
          update: { username },
          create: { id: playerId, username }
        }),
        prisma.gameRoom.create({
          data: {
            id: room.roomId,
            code: room.roomCode,
            hostUserId: playerId,
            status: room.status,
            maxPlayers: env.MAX_PLAYERS_PER_ROOM,
            players: {
              create: {
                id: `${room.roomId}_${playerId}`,
                userId: playerId,
                seatIndex: 0,
                isConnected: true,
                joinedAt: now,
                lastSeenAt: now
              }
            }
          }
        }),
        prisma.gameInstance.create({
          data: {
            id: room.gameInstanceId,
            roomId: room.roomId,
            level: room.level,
            stage: 1,
            stateJson: roomManager.serialize(room),
            activePlayerId: room.activePlayerId,
            turnIndex: room.turnIndex,
            challengeId: room.challengeId
          }
        }),
        prisma.roomProgress.create({
          data: {
            roomId: room.roomId,
            xpTotal: 0,
            levelUnlocked: 1,
            stars: 0
          }
        })
      ]);

      socket.data.userId = playerId;
      socket.data.username = username;
      socket.data.roomId = room.roomId;
      socket.data.authenticated = true;
      socket.join(room.roomId);
      clearRoomCloseTimer(room.roomId);

      const token = await signGameToken(app, { userId: playerId, username });
      ack({ roomId: room.roomId, roomCode: room.roomCode, token });
      io.to(room.roomId).emit("room:state", roomManager.toDTO(room));
    } catch (error) {
      socket.emit("error:event", { code: "create_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("room:join", async ({ username, roomCode }, ack) => {
    try {
      await enforceRateLimit(socket, "room:join");
      const { room, playerId } = roomManager.joinRoom(roomCode, username);
      const now = new Date();

      await prisma.$transaction([
        prisma.user.upsert({
          where: { id: playerId },
          update: { username },
          create: { id: playerId, username }
        }),
        prisma.roomPlayer.create({
          data: {
            id: `${room.roomId}_${playerId}`,
            roomId: room.roomId,
            userId: playerId,
            seatIndex: room.players.length - 1,
            isConnected: true,
            joinedAt: now,
            lastSeenAt: now
          }
        }),
        prisma.gameRoom.update({
          where: { id: room.roomId },
          data: { status: room.status }
        })
      ]);

      socket.data.userId = playerId;
      socket.data.username = username;
      socket.data.roomId = room.roomId;
      socket.data.authenticated = true;
      socket.join(room.roomId);
      clearRoomCloseTimer(room.roomId);

      const token = await signGameToken(app, { userId: playerId, username });
      ack({ roomId: room.roomId, token });
      io.to(room.roomId).emit("room:state", roomManager.toDTO(room));
    } catch (error) {
      socket.emit("error:event", { code: "join_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("room:resume", async ({ roomId }, ack) => {
    try {
      await enforceRateLimit(socket, "room:resume");
      const { userId } = assertAuthenticated(socket);
      const room = await loadRoomIntoMemory(roomId);
      const member = room.players.find((player) => player.userId === userId);
      if (!member) {
        ack({ ok: false, message: "not a room member" });
        return;
      }

      member.connected = true;
      socket.data.roomId = roomId;
      socket.join(roomId);
      clearRoomCloseTimer(roomId);

      await prisma.roomPlayer.updateMany({
        where: { roomId, userId },
        data: { isConnected: true, lastSeenAt: new Date() }
      });

      await persistRoomState(roomId);
      const dto = roomManager.toDTO(room);
      ack({ ok: true, roomState: dto });
      io.to(roomId).emit("room:state", dto);

      if (room.status === "TURN_START" && room.challengeId && room.activePlayerId && room.expiresAt) {
        await scheduleTurnTimeout(roomId, room.challengeId, room.activePlayerId, room.expiresAt);
      }
    } catch (error) {
      ack({ ok: false, message: (error as Error).message });
    }
  });

  socket.on("room:start", async ({ roomId }) => {
    try {
      await enforceRateLimit(socket, "room:start");
      assertRoomMember(socket, roomId);
      const room = roomManager.startGame(roomId);

      await upsertQuestion(room.currentQuestion);
      await persistRoomState(roomId);

      io.to(room.roomId).emit("room:state", roomManager.toDTO(room));
      io.to(room.roomId).emit("turn:start", {
        roomId: room.roomId,
        activePlayerId: room.activePlayerId!,
        challengeId: room.challengeId!,
        expiresAt: room.expiresAt!
      });
      await scheduleTurnTimeout(room.roomId, room.challengeId!, room.activePlayerId!, room.expiresAt!);
    } catch (error) {
      socket.emit("error:event", { code: "start_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("room:settings:update", async ({ roomId, noFailureCondition, difficultyOverride }) => {
    try {
      await enforceRateLimit(socket, "room:settings:update");
      assertRoomHost(socket, roomId);
      const room = roomManager.updateSettings(roomId, {
        noFailureCondition,
        difficultyOverride
      });
      await persistRoomState(roomId);
      io.to(roomId).emit("room:state", roomManager.toDTO(room));
    } catch (error) {
      socket.emit("error:event", { code: "settings_update_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("answer:submit", async ({ roomId, challengeId, answer, clientSeq }) => {
    try {
      await enforceRateLimit(socket, "answer:submit");
      assertRoomMember(socket, roomId);
      const room = roomManager.getRoom(roomId);
      if (room.challengeId !== challengeId) {
        socket.emit("error:event", { code: "stale_challenge", message: "Challenge already changed" });
        return;
      }

      const playerId = socket.data.userId as string;
      await enforceIdempotentSubmission(roomId, playerId, challengeId, clientSeq);
      const result = roomManager.submitAnswer(roomId, playerId, answer);

      if (result.isCorrect) {
        await clearTurnTimeout(roomId);
        const latencyMs = room.challengeStartedAt ? Math.max(0, Date.now() - room.challengeStartedAt) : 0;

        if (room.currentQuestion) {
          await upsertQuestion(room.currentQuestion);
          await prisma.$transaction([
            prisma.questionAttempt.create({
              data: {
                gameInstanceId: room.gameInstanceId,
                questionId: room.currentQuestion.id,
                playerId,
                submittedAnswerJson: { answer },
                isCorrect: true,
                latencyMs
              }
            })
          ]);
        }

        io.to(roomId).emit("answer:result", { roomId, playerId, isCorrect: true });
        io.to(roomId).emit("progress:update", {
          roomId,
          progressMeter: room.progressMeter,
          successfulMiniGames: room.successfulMiniGames,
          requiredSuccesses: room.requiredSuccesses
        });
        await prisma.$transaction([
          prisma.roomProgress.update({
            where: { roomId },
            data: {
              xpTotal: { increment: 10 },
              levelUnlocked: { increment: 1 }
            }
          }),
          prisma.playerProgress.upsert({
            where: { userId: playerId },
            update: {
              skillBeginner: { increment: room.level < 3 ? 0.03 : 0 },
              skillIntermediate: { increment: room.level >= 3 && room.level < 6 ? 0.03 : 0 },
              skillAdvanced: { increment: room.level >= 6 ? 0.03 : 0 },
              masteryJson: { level: room.level, lastResult: "correct" }
            },
            create: {
              userId: playerId,
              skillBeginner: room.level < 3 ? 0.03 : 0,
              skillIntermediate: room.level >= 3 && room.level < 6 ? 0.03 : 0,
              skillAdvanced: room.level >= 6 ? 0.03 : 0,
              masteryJson: { level: room.level, lastResult: "correct" }
            }
          })
        ]);

        io.to(roomId).emit("challenge:cleared", {
          roomId,
          challengeId,
          questEffect: room.currentQuestEffect
        });

        if (result.questCompleted) {
          io.to(roomId).emit("quest:complete", {
            roomId,
            questId: room.questId,
            chapterId: room.chapterId
          });
        }

        const next = roomManager.nextChallenge(roomId);
        await upsertQuestion(next.currentQuestion);
        await persistRoomState(roomId);

        io.to(roomId).emit("room:state", roomManager.toDTO(next));
        io.to(roomId).emit("turn:start", {
          roomId,
          activePlayerId: next.activePlayerId!,
          challengeId: next.challengeId!,
          expiresAt: next.expiresAt!
        });
        await scheduleTurnTimeout(roomId, next.challengeId!, next.activePlayerId!, next.expiresAt!);
        return;
      }

      await handleTurnOutcome({ roomId, challengeId, playerId, answer, reason: "mismatch" });
    } catch (error) {
      socket.emit("error:event", { code: "submit_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("player:encourage", async ({ roomId, message }) => {
    try {
      await enforceRateLimit(socket, "player:encourage");
      assertRoomMember(socket, roomId);
      const userId = socket.data.userId as string;
      const username = socket.data.username as string;
      io.to(roomId).emit("player:encourage", { playerId: userId, username, message });
    } catch (error) {
      socket.emit("error:event", { code: "encourage_failed", message: extractErrorMessage(error) });
    }
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId as string | undefined;
    const userId = socket.data.userId as string | undefined;
    if (!roomId || !userId) return;

    try {
      let shouldCloseRoom = false;
      if (roomManager.hasRoom(roomId)) {
        const room = roomManager.getRoom(roomId);
        const member = room.players.find((player) => player.userId === userId);
        if (member) {
          member.connected = false;
        }
        shouldCloseRoom = room.players.every((player) => !player.connected);
      }

      await prisma.roomPlayer.updateMany({
        where: { roomId, userId },
        data: { isConnected: false, lastSeenAt: new Date() }
      });

      if (shouldCloseRoom) {
        scheduleRoomClose(roomId);
      }
    } catch (error) {
      app.log.warn({ error }, "disconnect cleanup failed");
    }
  });
});

const port = 3001;
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`API listening on ${port}`);
  startTimeoutWorker();
});

const shutdown = async () => {
  if (timeoutWorker) {
    clearInterval(timeoutWorker);
    timeoutWorker = null;
  }
  await prisma.$disconnect();
  await redis.quit();
  await redisPub.quit();
  await redisSub.quit();
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
