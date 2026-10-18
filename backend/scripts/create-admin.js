// Create an admin account in MongoDB. No credentials are hardcoded: values come from
// environment variables or are typed in at the prompt.
//
//   npm run create-admin
//   ADMIN_EMAIL=you@example.org ADMIN_NAME="Your Name" ADMIN_PASSWORD='…' npm run create-admin
//   npm run create-admin -- --additional     (allow creating another admin when one exists)
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { createMongoStore } from '../src/data/mongo.store.js';

const additional = process.argv.includes('--additional');

async function ask(rl, label, { hidden = false } = {}) {
  if (!hidden) return (await rl.question(label)).trim();
  // Simple masked input: suppress echo while typing.
  const write = rl._writeToOutput;
  rl._writeToOutput = (s) => (s.includes(label) ? write.call(rl, s) : write.call(rl, '*'));
  const answer = await rl.question(label);
  rl._writeToOutput = write;
  output.write('\n');
  return answer;
}

async function main() {
  if (env.dataStore !== 'mongo' || !env.mongodbUri) {
    console.error('create-admin needs DATA_STORE=mongo and MONGODB_URI in backend/.env.');
    console.error('With DATA_STORE=memory, set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD instead.');
    process.exit(1);
  }
  const store = createMongoStore({ uri: env.mongodbUri, logger, retryMs: 2000 });
  for (let i = 0; i < 15 && !store.isReady(); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!store.isReady()) {
    console.error('Could not connect to MongoDB. Check MONGODB_URI and that MongoDB is running.');
    process.exit(1);
  }

  const existing = await store.users.countByRole('ADMIN');
  if (existing > 0 && !additional) {
    console.error(`An admin already exists (${existing}). Re-run with --additional to create another.`);
    await store.close();
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  const name = process.env.ADMIN_NAME || (await ask(rl, 'Admin name: '));
  const email = (process.env.ADMIN_EMAIL || (await ask(rl, 'Admin email: '))).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (await ask(rl, 'Password (min 12 chars): ', { hidden: true }));
  rl.close();

  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('A name and a valid email are required.');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');

  const passwordHash = await bcrypt.hash(password, env.auth.bcryptRounds);
  const user = await store.users.create({ name, email, passwordHash, role: 'ADMIN' });
  await store.audit.append({ actorId: 'cli', action: 'ADMIN_CREATED_CLI', targetType: 'user', targetId: user.id });
  console.log(`Admin created: ${user.email}`);
  await store.close();
}

main().catch(async (err) => {
  console.error(err.code === 'DUPLICATE_KEY' ? 'That email is already registered.' : err.message);
  process.exit(1);
});
