import type { FastifyInstance } from "fastify";

export async function registerRestRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true, service: "hangul-quest-api" }));
}
