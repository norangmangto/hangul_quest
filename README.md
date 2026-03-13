# Hangul Quest

Cooperative multiplayer Korean language learning web game. Players join rooms to answer Korean alphabet and vocabulary questions in real time.

## Packages

- `apps/web` — Next.js 15 / React 19 client game UI
- `apps/api` — Fastify 5 + Socket.IO 4 authoritative game server
- `packages/shared` — shared TypeScript types and Socket.IO event contracts

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API + web in parallel |
| `npm run build` | Build all packages (shared → api → web) |
| `npm run dev:api` | API only (tsx watch) |
| `npm run dev:web` | Web only (Next.js dev) |

### Tests

The API has a Vitest suite in `apps/api/tests/`. Run with:

```bash
cd apps/api && npx vitest run
```

## Docker

```bash
docker compose up        # start api + web
docker compose up -d api # background
```

## Features

- Create or join rooms with a 4-character code (up to 8 players)
- Two question categories: **Korean Words** (emoji → Korean word) and **Hangul Letters** (character → romanization)
- Configurable rounds (5–30) and time per round (10–30s)
- First correct answer scores a point; round ends on all-answered or timeout
- Live scoreboard, timer bar, and answer reveal after each round
- Host controls: start, next round, play again
