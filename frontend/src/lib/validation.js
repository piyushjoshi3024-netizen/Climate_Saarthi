// Client-side validation mirrors the API's Zod schemas for fast feedback.
// The server re-validates everything; these are a convenience, not a security boundary.
import { z } from 'zod';

export const PASSWORD_MIN = 10;

const email = z.string().trim().min(1, 'Enter your email').pipe(z.email({ message: 'Enter a valid email address' }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const PUBLIC_ROLE_OPTIONS = [
  { value: 'CITIZEN', label: 'Citizen', description: 'Report issues and follow what happens next.' },
  { value: 'VOLUNTEER', label: 'Volunteer', description: 'Help verify resources and support check-ins.' },
  { value: 'ORGANIZATION', label: 'Organisation', description: 'Offer water, shade, cooling or outreach capacity.' },
];

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Keep it under 80 characters'),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
    .max(128, 'Use at most 128 characters'),
  role: z.enum(['CITIZEN', 'VOLUNTEER', 'ORGANIZATION'], { message: 'Choose an account type' }),
});
