import { ApiError } from '../utils/response.js';

/**
 * Validate req.body / req.params / req.query with Zod schemas.
 * Parsed (coerced, trimmed) values replace the originals; errors return 400 VALIDATION_ERROR
 * with field-level messages the UI can show.
 */
export function validate({ body, params, query } = {}) {
  return (req, _res, next) => {
    const fields = {};
    const run = (schema, value, where) => {
      if (!schema) return value;
      const r = schema.safeParse(value ?? {});
      if (r.success) return r.data;
      for (const issue of r.error.issues) {
        const key = issue.path.join('.') || where;
        if (!fields[key]) fields[key] = issue.code === 'unrecognized_keys' ? `Unexpected field(s): ${issue.keys.join(', ')}` : issue.message;
      }
      return undefined;
    };
    const b = run(body, req.body, 'body');
    const p = run(params, req.params, 'params');
    const q = run(query, req.query, 'query');
    if (Object.keys(fields).length) return next(new ApiError(400, 'VALIDATION_ERROR', 'Please check the highlighted fields', { fields }));
    if (body) req.body = b;
    if (params) req.validatedParams = p;
    if (query) req.validatedQuery = q; // Express 5 req.query is read-only
    return next();
  };
}
