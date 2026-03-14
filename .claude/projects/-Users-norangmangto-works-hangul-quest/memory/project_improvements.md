---
name: major improvements session
description: All improvements implemented across March 2026 sessions
type: project
---

Two rounds of improvements implemented on 2026-03-14.

**Why:** User asked to implement all suggested improvements at once.

**How to apply:** These are done — reference this if the user asks what's been added.

## Round 1 Changes (complete):

### Shared (`packages/shared`)
- Added `streak: number` to `PlayerState`
- Added `maxPlayers: number` to `RoomStateDTO`
- Added `autoAdvanceAt?: number` to `RoomStateDTO`
- Added `autoAdvanceDelay?: number` to `GameSettings`
- Added `GameCategory` values: `KOREAN_VERBS`, `KOREAN_TO_ENGLISH`, `KOREAN_NUMBERS`, `KOREAN_SENTENCES`
- Added `GameMode` type: `'standard' | 'teams' | 'elimination'`
- Added `team?: 'red' | 'blue'`, `eliminated?: boolean` to `PlayerState`
- Added `inputMode?: 'buttons' | 'typed'`, `gameMode?: GameMode` to `GameSettings`
- Added `hint?: string`, `promptType: 'text'` to `PublicQuestion`
- Added `roundStartedAt?: number`, `teamScores?: {red, blue}` to `RoomStateDTO`
- Added `room:kick`, `reaction:send`, `room:assign-team` to `ClientToServerEvents`
- Added `reaction:broadcast` to `ServerToClientEvents`
- Added `hostName?: string` to `room:create` payload

### API (`apps/api`)
- **Host name fix**: `createRoom` takes `hostName`
- **Streak/combo scoring**: correct = +streak pts (max +3), wrong resets streak
- **Speed bonus**: +2 if answered in first 33% of time, +1 in first 66%
- **Kick player**: `kickPlayer()` + `room:kick` handler + reverse `playerToSocket` map
- **Auto-advance**: `autoAdvanceDelay` setting; server setTimeout fires `advanceRound`
- **Emoji reactions**: `reaction:send` handler broadcasts ephemeral reactions
- **Rate limiting**: `@fastify/rate-limit` HTTP (100/min) + per-socket 30 events/5s
- **New question content**: `KOREAN_VERBS` (30 verbs), `KOREAN_TO_ENGLISH` (32 words), `KOREAN_NUMBERS` (20), `KOREAN_SENTENCES` (20 fill-in-blank)
- **Hints**: `hint?: string` on questions with cultural notes
- **Typed mode**: case-insensitive matching when `inputMode === 'typed'`
- **Elimination mode**: wrong answer sets `player.eliminated = true`
- **Teams mode**: `assignTeam()` method, teamScores computed in `toDTO()`
- **`room:assign-team` handler** in `apps/api/src/index.ts`

### Web (`apps/web`)
- **Toast notifications**: `sonner`, replaced all `alert()` calls
- **localStorage** for reconnect tokens
- **Copy invite link** in HostLobby
- **All 6 categories** in HostLobby (grid)
- **Game mode selector**: standard / teams / elimination
- **Answer mode selector**: buttons / typed
- **Team assignment buttons** (R/B) per player in HostLobby when teams mode
- **Team scores banner** (red vs blue) in HostGame + PlayerGame
- **Elimination screen**: eliminated players see special 💀 screen
- **Eliminated player styling** in Scoreboard (line-through, opacity-40, "OUT" badge)
- **Typed answers mode**: text input + submit button instead of 4 option buttons
- **3-2-1 countdown overlay** at start of each ROUND_ACTIVE
- **Confetti** (`canvas-confetti`) on GAME_OVER
- **Audio pronunciation** (`SpeechSynthesis` ko-KR) on ROUND_RESULT
- **🔊 Pronounce button** in result view (host and player)
- **Reconnect overlay** shown when socket disconnects
- **Hint display** below correct answer in ROUND_RESULT
- **Host name** "Hosted by X" in PlayerLobby
- **Spaced repetition**: `recordWrong()` called on incorrect answers, stored in localStorage
- **`promptType: 'text'` rendering**: sentence/number prompts shown as text box, not giant emoji
- **Dark mode**: Tailwind `darkMode: 'class'`, toggle button on home page, no-flash script in layout
- **Weak spots banner** on home page with count + link to practice
- **Practice mode** (`/practice`): solo page with category select, 15 questions, score results, weak-spots drill
- **Sound effects**: playCorrect, playWrong, playTimerTick, playRoundEnd, playGameOver (Web Audio API)
- **Streak display**: 🔥N in scoreboard and player top bar

### Infrastructure
- **Docker Compose**: improved with health checks, `depends_on: condition: service_healthy`, `restart: unless-stopped`, `CORS_ORIGIN`/`NEXT_PUBLIC_API_URL` from env
- **Dockerfiles**: multi-stage builds (builder + runner) for both api and web
- **Playwright E2E tests** (`apps/e2e`): home.spec.ts (8 tests), practice.spec.ts (6 tests), multiplayer.spec.ts (3 tests, require running servers)

### Tests
- API tests: 22 passing (updated streak test for speed bonus)
- Web unit tests: store (4), sounds (4), optionColor (6) = 14 passing
- E2E: `apps/e2e` workspace with Playwright config + 3 test files
