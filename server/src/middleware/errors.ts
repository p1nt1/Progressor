import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ── Custom error class with HTTP status ─────────────────────────────────────
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ── Async route wrapper — catches thrown errors and forwards to Express ──────
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ── Centralised error middleware (must be registered last) ───────────────────
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('[unhandled]', err);
  return res.status(500).json({ error: 'Internal server error' });
}

