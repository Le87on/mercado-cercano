import "dotenv/config";

import { buildApp } from "./app.js";
import { parseApiEnv } from "./config/env.js";

const env = parseApiEnv(process.env);
const app = buildApp();

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
