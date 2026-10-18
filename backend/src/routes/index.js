import { Router } from 'express';
import healthRoutes from './health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';

/** Mount module routers under /api/v1. */
export function apiRouter({ store, auth, limits }) {
  const api = Router();
  api.use(healthRoutes({ store }));
  api.use('/auth', authRouter({ store, auth, limits }).router);
  api.use('/admin', adminRouter({ store, auth }));
  return api;
}
