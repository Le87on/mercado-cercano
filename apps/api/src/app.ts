import Fastify, { type FastifyInstance } from "fastify";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.get("/health", async () => ({
    service: "a-la-vuelta-api",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
