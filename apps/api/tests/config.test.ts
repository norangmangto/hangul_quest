import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadEnvironmentFiles, parseEnv } from "../src/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("config", () => {
  it("parses required values and defaults", () => {
    const parsed = parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hangul_quest",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "this_is_a_long_enough_secret",
      CORS_ORIGIN: "http://localhost:3000"
    });

    expect(parsed.TURN_TIMEOUT_MS).toBe(20000);
    expect(parsed.MAX_PLAYERS_PER_ROOM).toBe(6);
    expect(parsed.ENABLE_TURBO_PLUGIN).toBe(false);
  });

  it("parses turbo flag as boolean true", () => {
    const parsed = parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hangul_quest",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "this_is_a_long_enough_secret",
      CORS_ORIGIN: "http://localhost:3000",
      ENABLE_TURBO_PLUGIN: "true"
    });

    expect(parsed.ENABLE_TURBO_PLUGIN).toBe(true);
  });

  it("throws when required variables are missing", () => {
    expect(() => parseEnv({})).toThrow();
  });

  it("loads env values from root .env file", () => {
    const root = mkdtempSync(join(tmpdir(), "hangul-quest-root-"));
    const api = mkdtempSync(join(tmpdir(), "hangul-quest-api-"));

    writeFileSync(
      join(root, ".env"),
      [
        "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hangul_quest",
        "REDIS_URL=redis://localhost:6379",
        "JWT_SECRET=this_is_a_long_enough_secret",
        "CORS_ORIGIN=http://localhost:3000"
      ].join("\n")
    );

    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGIN;

    loadEnvironmentFiles({ repoRoot: root, apiDir: api });

    expect(process.env.DATABASE_URL).toContain("postgresql://");
    expect(process.env.REDIS_URL).toContain("redis://");
    expect(process.env.JWT_SECRET).toBe("this_is_a_long_enough_secret");

    rmSync(root, { recursive: true, force: true });
    rmSync(api, { recursive: true, force: true });
  });
});
