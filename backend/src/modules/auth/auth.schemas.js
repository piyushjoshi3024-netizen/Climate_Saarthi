import { z } from 'zod';
import { PUBLIC_ROLES } from './roles.js';

const email = z.string().trim().toLowerCase().pipe(z.email({ message: 'Enter a valid email address' })).pipe(z.string().max(254));

export const PASSWORD_MIN = 10;
const password = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(128, 'Password must be at most 128 characters');

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    email,
    password,
    // Any role outside PUBLIC_ROLES is rejected (never silently downgraded).
    role: z.string().optional().default('CITIZEN'),
  })
  .strict();

export const LoginSchema = z
  .object({
    email,
    password: z.string().min(1, 'Enter your password').max(128),
  })
  .strict();

export const isPublicRole = (role) => PUBLIC_ROLES.includes(role);
