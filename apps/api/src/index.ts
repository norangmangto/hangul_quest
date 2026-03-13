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

io.on('connection', (socket) => {
  const playerId = socket.id;

  socket.on('room:create', ({ hostName, settings }, ack) => {
    if (!hostName?.trim()) return ack({ error: 'Name required' });
    const room = rooms.createRoom(playerId, hostName.trim(), settings);
    socket.join(room.roomId);
    socketMeta.set(playerId, { roomId: room.roomId, playerId });
    socket.emit('room:state', rooms.toDTO(room));
    ack({ roomId: room.roomId, roomCode: room.roomCode });
  });

  socket.on('room:join', ({ roomCode, playerName }, ack) => {
    if (!playerName?.trim()) return ack({ error: 'Name required' });
    const result = rooms.joinRoom(roomCode.toUpperCase(), playerId, playerName.trim());
    if (!result.ok) return ack({ error: result.error });
    socket.join(result.roomId);
    socketMeta.set(playerId, { roomId: result.roomId, playerId });
    const room = rooms.getRoom(result.roomId)!;
    socket.emit('room:state', rooms.toDTO(room));
    ack({ roomId: result.roomId });
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
    const meta = socketMeta.get(playerId);
    if (meta) socketMeta.delete(playerId);
    rooms.disconnect(playerId);
  });
});

const port = env.PORT;
await app.listen({ port, host: '0.0.0.0' });
console.log(`🚀 Hangul Quest API running on port ${port}`);
