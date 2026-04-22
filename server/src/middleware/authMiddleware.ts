import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; googleSub?: string; username?: string; email: string; displayName: string | null; picture: string | null };
    }
  }
}

interface SessionPayload {
  userId: string;
  googleSub?: string;
  username?: string;
  email?: string;
  displayName: string | null;
  picture: string | null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, env.SESSION_SECRET) as SessionPayload;

    req.user = {
      id: payload.userId,
      googleSub: payload.googleSub,
      username: payload.username,
      email: payload.email ?? '',
      displayName: payload.displayName,
      picture: payload.picture,
    };

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
