# Hangul Quest Starter Monorepo

Production-leaning MVP scaffold for a cooperative multiplayer Hangul learning web game.

## Packages

- `apps/web`: Next.js client game UI
- `apps/api`: Fastify + Socket.IO authoritative game server
- `packages/shared`: shared TypeScript contracts/events/types

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start dependencies:

```bash
docker compose up -d db redis
```

3. Install dependencies and generate Prisma client:

```bash
npm install
npm run prisma:generate
```

4. Run migrations:

```bash
npm run prisma:migrate
```

5. Start both apps:

```bash
npm run dev
```

## Pre-release checks

```bash
npm run test
npm run build
```

The API test suite includes regressions for:
- Environment loading/validation failures
- Fastify plugin major-version compatibility
- Mini-game registry/plugin override behavior

## Runtime URLs

- Web: `http://localhost:3000`
- API/WS: `http://localhost:3001`

## MVP Features Included

- Room creation/joining (`2-6` players)
- Shared authoritative room state
- Turn-based cooperative challenge loop
- Chapter-driven story quests (Consonants → Vowels → Syllable Forge → Word Market → Logic Arena → Royal Archive)
- Mini-game variety by chapter (recognition, matching, construction, logic, sentence fill)
- Shared team systems: health bar, quest progress meter, rotating turns with timeout
- Dynamic difficulty tuning from recent team performance
- Mode A: Story Campaign (chapter-ordered progression)
- Mode B: Village Festival (randomized chapter mini-game rotation)
- Mode C: Classroom (teacher difficulty override, no-failure flow, live player performance board)
- Tiered mini-game mechanics (recognition, association, construction, retrieval, logic)
- Quest mini-game pools with non-repeating random selection
- Shared sync events for health/progress/quest completion (`health:update`, `progress:update`, `quest:complete`)
- Adaptive difficulty based on accuracy, response time, and consecutive failures
- Expansion-ready mini-game plugin architecture (`generateQuestion`, `validateAnswer`, `calculateReward`)
- WebSocket event contracts and payload types
- Prisma schema for users, rooms, game instances, questions, attempts, progress

## Custom Mini-Game Plugin Example

- Example plugin file: [apps/api/src/game/miniGames/examples/TurboLetterRecognitionPlugin.ts](apps/api/src/game/miniGames/examples/TurboLetterRecognitionPlugin.ts)
- Env toggle in [.env.example](.env.example):
	- `ENABLE_TURBO_PLUGIN=true`
- Runtime wiring in [apps/api/src/game/QuestionEngine.ts](apps/api/src/game/QuestionEngine.ts):
	- `createDefaultMiniGameRegistry(env.ENABLE_TURBO_PLUGIN ? [createTurboLetterRecognitionPlugin()] : [])`
