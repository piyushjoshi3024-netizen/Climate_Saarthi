import { Router } from 'express';
import { ok } from '../utils/response.js';
import { env } from '../config/env.js';

const startedAt = new Date();

// Public readiness check. Reports only non-secret status.
export default function healthRoutes({ store }) {
  const router = Router();
  router.get('/health', (_req, res) => {
    ok(res, {
      status: 'ok',
      service: 'climate-saarthi-api',
      version: '0.2.0',
      environment: env.nodeEnv,
      startedAt: startedAt.toISOString(),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dataStore: store.kind,
      database: store.status(),
      signInAvailable: store.isReady(),
    });
  });
  return router;
}
