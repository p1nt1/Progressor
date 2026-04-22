import { z } from 'zod';

export const loginSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginLocalSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

