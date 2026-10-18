// Standard API envelope for every /api/v1 response.
// Success: { success: true, data, message }
// Error:   { success: false, message, error: { code } }

export function ok(res, data = {}, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
