import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { AppError } from './errors';

/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 * Replaces `req.body` with the parsed (and stripped) value so downstream
 * handlers never see unknown keys.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new AppError(400, message);
      }
      throw err;
    }
  };
}

