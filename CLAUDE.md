# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hangul Quest is a cooperative multiplayer Korean language learning web game. Players join rooms to answer Korean alphabet/vocabulary questions in real time.

## Commands

### Development
```bash
npm run dev          # Start both API (port 4000) and web (port 3000) in parallel
npm run dev:api      # API only (tsx watch, auto-reload)
npm run dev:web      # Next.js dev server only
```

### Build
```bash
npm run build        # Build all packages in order: shared → api → web
npm run build:shared # Compile shared TypeScript package
npm run build:api    # Compile API to dist/
npm run build:web    # Next.js production build
```

### Testing
The API has a Vitest config at `apps/api/vitest.config.ts` with tests in `apps/api/tests/`. To run them:
```bash
cd apps/api && npx vitest run
cd apps/api && npx vitest run tests/<filename>.test.ts  # single file
```
Note: The API `package.json` does not yet have a `test` script, so `npm run test` from root will fail.

### Setup
```bash
cp .env.example .env
npm install
```

## Architecture

This is an **npm workspaces monorepo** with three packages:
- `apps/api` — Fastify 5 + Socket.IO 4 authoritative game server
- `apps/web` — Next.js 15 / React 19 client
- `packages/shared` — TypeScript types and Socket.IO event contracts (no runtime code)

### Authoritative Server Model
All game state lives in `RoomManager` (in-memory, `apps/api/src/game/RoomManager.ts`). Clients send *intent events*, receive *full state broadcasts*. After every mutation, the server emits the full `RoomStateDTO` to all players in the room via `io.to(roomId).emit('room:state', dto)`.

### Room State Machine
`LOBBY` → `ROUND_ACTIVE` → `ROUND_RESULT` → (repeat) → `GAME_OVER`

- Rooms identified by an 8-byte hex `roomId` (internal) and a 4-char alphanumeric `roomCode` (user-facing, no ambiguous chars like I/O)
- Host controls progression: start game, next round, play again
- First correct answer scores +1 point; rounds end on all-answered or timer expiry
- Host disconnect in LOBBY closes the room; disconnect during game marks player as offline

### Question Generation
`apps/api/src/game/QuestionBank.ts` holds flat template arrays for two categories:
- `KOREAN_WORDS` (57 items): emoji prompt → Korean word answer (animals, vehicles, food, nature, places, objects)
- `HANGUL_LETTERS` (24 items): Hangul character prompt → romanization answer (14 consonants + 10 vowels)

`generateRoundQuestions(category, count)` shuffles the pool, picks N, and builds each question by pairing the correct answer with 3 random distractors from the same category pool. The correct answer is kept server-side and only revealed to clients in `ROUND_RESULT`/`GAME_OVER` state via `RoomStateDTO.correctAnswer`.

### Shared Contracts
`@hangul-quest/shared` is the single source of truth for Socket.IO event types (`ClientToServerEvents`, `ServerToClientEvents`) and game DTOs (`RoomStateDTO`, `PublicQuestion`, `PlayerState`, `GameSettings`). When adding new events or changing data shapes, update `packages/shared/src/` first, then rebuild.

### Client State (Zustand)
`apps/web/src/lib/store.ts` holds `myName`, `myId` (socket.id), and the latest `roomState` from the server. The socket singleton (`apps/web/src/lib/socket.ts`) lazily creates the connection with `autoConnect: false` and is reused across navigation.

### Web Routes
- `/` (`apps/web/src/app/page.tsx`) — Home: Create/Join tabs, name input, category/rounds/time settings
- `/room/[roomId]` (`apps/web/src/app/room/[roomId]/page.tsx`) — Game room: renders one of four views based on `amHost` + `state.status`:
  - `HostLobby` — room code banner, settings controls, player list, start button
  - `HostGame` — large question display, scoreboard sidebar, timer, next-round/play-again controls
  - `PlayerLobby` — waiting screen with room code and player list
  - `PlayerGame` — 2×2 answer button grid, timer bar, result reveal, score tracker + game-over leaderboard

### Socket.IO Event Flow
- `room:create` / `room:join` → acknowledgment callbacks with `roomId` or `{ error }`
- `room:start` → host-only, ack with `{ ok }` or `{ error }`
- `room:settings:update`, `room:next-round`, `room:play-again` → host-only, no ack
- `answer:submit` → player submits `{ roomId, questionId, answer }` during `ROUND_ACTIVE`
- `room:state` ← server broadcasts full state after every change
- `error:event` ← server pushes error messages (e.g. play-again failure); web redirects to home on receipt

## Environment Variables

See `.env.example`. All three vars are required:
- `PORT` — API port (default `4000`)
- `CORS_ORIGIN` — must match the web app URL (default `http://localhost:3000`)
- `NEXT_PUBLIC_API_URL` — injected into Next.js at build time for the browser socket connection (default `http://localhost:4000`)

## TypeScript Configuration

`tsconfig.base.json` at root sets `ES2022`, `NodeNext` module resolution, strict mode. All app/package tsconfigs extend it. The entire codebase is ESM (`"type": "module"`), so all local imports must use `.js` extensions even when importing `.ts` source files.
