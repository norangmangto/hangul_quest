import { randomBytes } from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, RoomStateDTO } from '@hangul-quest/shared';
import { env } from './config.js';
import { RoomManager } from './game/RoomManager.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

app.get('/health', async () => ({ ok: true }));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
});

// Broadcast full state to all sockets in a room
function broadcastState(roomId: string, state: RoomStateDTO): void {
  io.to(roomId).emit('room:state', state);
}

const rooms = new RoomManager(broadcastState);

// Map socket.id → { roomId, playerId } for fast lookup on disconnect
const socketMeta = new Map<string, { roomId: string; playerId: string }>();

// Map reconnect token → { roomId, playerId }
const tokenToPlayer = new Map<string, { roomId: string; playerId: string }>();

// Map playerId → socketId for targeting specific players (e.g. kick)
const playerToSocket = new Map<string, string>();

// Allowed reaction emojis
const ALLOWED_REACTIONS = new Set(['👍', '🎉', '😱', '❤️', '😂', '🔥']);

io.on('connection', (socket) => {
  let playerId = socket.id;

  // Per-socket event rate limit: max 30 events/5s
  let eventCount = 0;
  const resetInterval = setInterval(() => { eventCount = 0; }, 5000);
  socket.use((_packet, next) => {
    eventCount++;
    if (eventCount > 30) return; // silently drop
    next();
  });
  socket.on('disconnect', () => clearInterval(resetInterval));

  socket.on('room:create', ({ settings, hostName }, ack) => {
    const trimmedName = hostName?.trim() || 'Host';
    const room = rooms.createRoom(playerId, trimmedName, settings);
    socket.join(room.roomId);
    socketMeta.set(socket.id, { roomId: room.roomId, playerId });
    playerToSocket.set(playerId, socket.id);
    socket.emit('room:state', rooms.toDTO(room));
    const token = randomBytes(16).toString('hex');
    tokenToPlayer.set(token, { roomId: room.roomId, playerId });
    ack({ roomId: room.roomId, roomCode: room.roomCode, reconnectToken: token });
  });

  socket.on('room:join', ({ roomCode, playerName }, ack) => {
    if (!playerName?.trim()) return ack({ error: 'Name required' });
    const result = rooms.joinRoom(roomCode.toUpperCase(), playerId, playerName.trim());
    if (!result.ok) return ack({ error: result.error });
    socket.join(result.roomId);
    socketMeta.set(socket.id, { roomId: result.roomId, playerId });
    playerToSocket.set(playerId, socket.id);
    const room = rooms.getRoom(result.roomId)!;
    socket.emit('room:state', rooms.toDTO(room));
    const token = randomBytes(16).toString('hex');
    tokenToPlayer.set(token, { roomId: result.roomId, playerId });
    ack({ roomId: result.roomId, reconnectToken: token });
  });

  socket.on('room:rejoin', ({ roomId, token }, ack) => {
    const entry = tokenToPlayer.get(token);
    if (!entry || entry.roomId !== roomId) return ack({ error: 'Invalid token' });
    const room = rooms.getRoom(entry.roomId);
    if (!room) { tokenToPlayer.delete(token); return ack({ error: 'Room no longer exists' }); }
    playerId = entry.playerId;
    socketMeta.set(socket.id, { roomId, playerId });
    playerToSocket.set(playerId, socket.id);
    socket.join(roomId);
    rooms.reconnect(roomId, playerId);
    ack({ ok: true });
  });

  socket.on('room:leave', ({ roomId }) => {
    const meta = socketMeta.get(socket.id);
    if (meta) socketMeta.delete(socket.id);
    playerToSocket.delete(playerId);
    socket.leave(roomId);
    rooms.leaveRoom(roomId, playerId);
  });

  socket.on('room:start', ({ roomId }, ack) => {
    const result = rooms.startGame(roomId, playerId);
    if (!result.ok) return ack({ error: result.error });
    ack({ ok: true });
  });

  socket.on('room:settings:update', ({ roomId, settings }) => {
    rooms.updateSettings(roomId, playerId, settings);
  });

  socket.on('room:next-round', ({ roomId }) => {
    rooms.advanceRound(roomId, playerId);
  });

  socket.on('room:play-again', ({ roomId }) => {
    const result = rooms.playAgain(roomId, playerId);
    if (!result.ok) {
      socket.emit('error:event', { message: result.error });
    }
  });

  socket.on('room:kick', ({ roomId, targetId }) => {
    const result = rooms.kickPlayer(roomId, playerId, targetId);
    if (result.ok) {
      // Notify the kicked player
      const kickedSocketId = playerToSocket.get(targetId);
      if (kickedSocketId) {
        io.to(kickedSocketId).emit('error:event', { message: 'You were kicked from the room' });
        playerToSocket.delete(targetId);
      }
    }
  });

  socket.on('room:assign-team', ({ roomId, targetId, team }) => {
    rooms.assignTeam(roomId, playerId, targetId, team);
  });

  socket.on('reaction:send', ({ roomId, emoji }) => {
    if (!ALLOWED_REACTIONS.has(emoji)) return;
    const meta = socketMeta.get(socket.id);
    if (!meta || meta.roomId !== roomId) return;
    const room = rooms.getRoom(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    io.to(roomId).emit('reaction:broadcast', {
      playerId,
      playerName: player.name,
      emoji,
    });
  });

  socket.on('room:sync', ({ roomId }) => {
    const room = rooms.getRoom(roomId);
    if (room) socket.emit('room:state', rooms.toDTO(room));
  });

  socket.on('answer:submit', ({ roomId, questionId, answer }) => {
    rooms.submitAnswer(roomId, playerId, questionId, answer);
  });

  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (meta) socketMeta.delete(socket.id);
    playerToSocket.delete(playerId);
    rooms.disconnect(playerId);
  });
});

const port = env.PORT;
await app.listen({ port, host: '0.0.0.0' });
console.log(`🚀 Hangul Quest API running on port ${port}`);
