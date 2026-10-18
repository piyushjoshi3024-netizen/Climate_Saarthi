import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createStore } from './data/index.js';
import { createAuthService } from './modules/auth/auth.service.js';

for (const w of env.warnings) logger.warn(w);

const store = createStore(env, logger);
const app = createApp({ store });

/** Optional first-admin bootstrap from BOOTSTRAP_ADMIN_* (waits for the database). */
async function bootstrapAdmin() {
  if (!env.bootstrapAdmin) return;
  for (let attempt = 0; attempt < 30 && !store.isReady(); attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!store.isReady()) return logger.warn('Admin bootstrap skipped: database not connected');
  try {
    const result = await createAuthService({ store, auth: env.auth }).bootstrapAdmin(env.bootstrapAdmin);
    if (result.created) logger.info({ email: result.user.email }, 'Bootstrap admin created');
    else logger.info(`Admin bootstrap skipped: ${result.reason}`);
  } catch (err) {
    logger.error({ err: { message: err.message } }, 'Admin bootstrap failed');
  }
}

const server = app.listen(env.port, () => {
  logger.info(
    { port: env.port, origins: env.clientOrigins, env: env.nodeEnv, dataStore: env.dataStore },
    `Climate Saarthi API listening on http://localhost:${env.port}/api/v1`
  );
  bootstrapAdmin();
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await store.close().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
