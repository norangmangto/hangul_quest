.PHONY: install dev dev-api dev-web \
        build build-shared build-api build-web \
        test test-api test-e2e \
        docker-up docker-down docker-build docker-logs \
        clean

# ── Setup ─────────────────────────────────────────────────────────────────────

install:
	npm install

# ── Development ───────────────────────────────────────────────────────────────

dev:
	npm run dev

dev-api:
	npm run dev:api

dev-web:
	npm run dev:web

# ── Build ─────────────────────────────────────────────────────────────────────

build: build-shared build-api build-web

build-shared:
	npm run build:shared

build-api: build-shared
	npm run build:api

build-web: build-shared
	npm run build:web

# ── Test ──────────────────────────────────────────────────────────────────────

test: test-api

test-api:
	cd apps/api && npx vitest run

test-e2e:
	npm run test:e2e

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf apps/api/dist apps/web/.next packages/shared/dist
	find . -name "node_modules" -maxdepth 3 -type d -prune -exec rm -rf {} +
