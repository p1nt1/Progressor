import type { Request, Response } from 'express';
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { query } from '../../db/pool';
import { asyncHandler, AppError } from '../../middleware/errors';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 12;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError(400, 'Missing idToken');

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new AppError(401, 'Empty token payload');

  const { sub, email = '', name = '', picture = null } = payload;

  const result = await query(
    `INSERT INTO users (cognito_sub, email, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (cognito_sub) DO UPDATE SET email = $2, display_name = $3
     RETURNING id, cognito_sub, email, display_name`,
    [sub, email, name]
  );
  const user = result.rows[0];

  const sessionToken = jwt.sign(
    { userId: user.id, googleSub: user.cognito_sub, email: user.email, displayName: user.display_name, picture },
    env.SESSION_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('session_token', sessionToken, COOKIE_OPTIONS);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, picture } });
});

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) throw new AppError(400, 'Username and password are required');
  if (password.length < 6) throw new AppError(400, 'Password must be at least 6 characters');

  const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) throw new AppError(409, 'Username already taken');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await query(
    `INSERT INTO users (username, password_hash, email, display_name)
     VALUES ($1, $2, '', $1)
     RETURNING id, username, display_name`,
    [username, passwordHash]
  );
  const user = result.rows[0];

  const sessionToken = jwt.sign(
    { userId: user.id, username: user.username, displayName: user.display_name, picture: null },
    env.SESSION_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('session_token', sessionToken, COOKIE_OPTIONS);
  res.json({ user: { id: user.id, email: '', displayName: user.display_name, picture: null } });
});

export const loginLocalHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) throw new AppError(400, 'Username and password are required');

  const result = await query(
    'SELECT id, username, display_name, password_hash FROM users WHERE username = $1',
    [username]
  );
  if (result.rows.length === 0) throw new AppError(401, 'Invalid username or password');

  const user = result.rows[0];
  if (!user.password_hash) throw new AppError(401, 'This account uses Google sign-in');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError(401, 'Invalid username or password');

  const sessionToken = jwt.sign(
    { userId: user.id, username: user.username, displayName: user.display_name, picture: null },
    env.SESSION_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('session_token', sessionToken, COOKIE_OPTIONS);
  res.json({ user: { id: user.id, email: '', displayName: user.display_name, picture: null } });
});

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('session_token', {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  });
  res.json({ ok: true });
}

const router = Router();
router.get('/session', (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
