import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  OPENAI_API_KEY: z.string().default(''),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
