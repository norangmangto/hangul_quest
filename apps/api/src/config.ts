import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(currentDir, "..");
const repoRoot = resolve(apiDir, "..", "..");

export function loadEnvironmentFiles(paths?: { apiDir?: string; repoRoot?: string }) {
  const root = paths?.repoRoot ?? repoRoot;
  const api = paths?.apiDir ?? apiDir;

  loadEnv({ path: resolve(root, ".env") });
  loadEnv({ path: resolve(api, ".env"), override: false });
}

loadEnvironmentFiles();

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().url(),
  TURN_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  TURN_SCHEDULER_INTERVAL_MS: z.coerce.number().int().positive().default(500),
  MAX_PLAYERS_PER_ROOM: z.coerce.number().int().min(2).max(6).default(6),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  ENABLE_TURBO_PLUGIN: z
    .union([z.literal("true"), z.literal("false")])
    .default("false")
    .transform((value) => value === "true")
});

export function parseEnv(source: NodeJS.ProcessEnv) {
  return envSchema.parse(source);
}

export const env = parseEnv(process.env);
