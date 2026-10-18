// Test environment: in-memory data store, fixed secrets, fast bcrypt, silent logs.
process.env.NODE_ENV = 'test';
process.env.DATA_STORE = 'memory';
process.env.LOG_LEVEL = 'silent';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789-abcdefghijklmnop';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789-abcdefghijklmno';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
delete process.env.BOOTSTRAP_ADMIN_EMAIL;
delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
