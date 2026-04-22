import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { query } from '../db/pool';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; googleSub: string; email: string; displayName: string | null };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Empty token payload');

    const sub = payload.sub;
    const email = payload.email || '';
    const name = payload.name || '';

    // Upsert user
    const result = await query(
      `INSERT INTO users (cognito_sub, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (cognito_sub) DO UPDATE SET email = $2, display_name = $3
       RETURNING id, cognito_sub, email, display_name`,
      [sub, email, name]
    );

    req.user = {
      id: result.rows[0].id,
      googleSub: result.rows[0].cognito_sub,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
