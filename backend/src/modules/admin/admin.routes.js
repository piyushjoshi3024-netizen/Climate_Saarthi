import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../utils/response.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { requireDatabase } from '../../middleware/requireDatabase.js';
import { validate } from '../../middleware/validate.js';

const AuditQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

/** /admin routes. Every route checks session and role on the server. */
export function adminRouter({ store, auth }) {
  const router = Router();
  router.use(requireDatabase(store), authenticate({ store, auth }));

  // Append-only audit log (admin only).
  router.get('/audit', authorize('ADMIN'), validate({ query: AuditQuery }), async (req, res) => {
    const items = await store.audit.list({ limit: req.validatedQuery.limit });
    const sorted = [...items].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, req.validatedQuery.limit);
    ok(res, {
      items: sorted.map((e) => ({
        id: String(e.id ?? e._id),
        at: e.at,
        actorId: e.actorId ?? null,
        action: e.action,
        targetType: e.targetType ?? null,
        targetId: e.targetId ?? null,
      })),
    });
  });

  return router;
}
