import { randomBytes } from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, RoomStateDTO } from '@hangul-quest/shared';
import { env } from './config.js';
import { RoomManager } from './game/RoomManager.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN });

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

io.on('connection', (socket) => {
  let playerId = socket.id;

  socket.on('room:create', ({ settings }, ack) => {
    const room = rooms.createRoom(playerId, settings);
    socket.join(room.roomId);
    socketMeta.set(socket.id, { roomId: room.roomId, playerId });
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
    socket.join(roomId);
    rooms.reconnect(roomId, playerId);
    ack({ ok: true });
  });

  socket.on('room:leave', ({ roomId }) => {
    const meta = socketMeta.get(socket.id);
    if (meta) socketMeta.delete(socket.id);
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
    rooms.disconnect(playerId);
  });
});

const port = env.PORT;
await app.listen({ port, host: '0.0.0.0' });
console.log(`🚀 Hangul Quest API running on port ${port}`);
