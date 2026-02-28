import type { FastifyInstance } from "fastify";

export type AuthUser = {
  userId: string;
  username: string;
};

export async function signGameToken(app: FastifyInstance, user: AuthUser) {
  return app.jwt.sign(user, { expiresIn: "12h" });
}
