import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errors';
import { validateBody } from './middleware/validate';
import { loginSchema, registerSchema, loginLocalSchema } from './modules/auth/auth.schemas';
import authRoutes, { loginHandler, logoutHandler, registerHandler, loginLocalHandler } from './modules/auth/auth.routes';
import exerciseRoutes from './modules/exercise/exercise.routes';
import workoutRoutes from './modules/workout/workout.routes';
import aiRoutes from './modules/ai/ai.routes';
import profileRoutes from './modules/profile/profile.routes';
import templateRoutes from './modules/template/template.routes';
import bootstrapRoutes from './modules/bootstrap/bootstrap.routes';
import { pool } from './db/pool';

const app = express();

// Trust proxy in production (Railway, Heroku, etc.) so secure cookies work behind HTTPS termination
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── Request logging ─────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS — must list exact origin when credentials: true ────────────────────
const allowedOrigins = env.NODE_ENV === 'production'
  ? env.CLIENT_URL.split(',')
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }) as any);
app.use(express.json());
app.use(cookieParser());

// ── Rate limiters ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded, please wait a moment' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// ── Health check (verifies DB connectivity) ─────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// ── Public routes (no auth required) ────────────────────────────────────────
app.post('/api/auth/login', authLimiter, validateBody(loginSchema), loginHandler);
app.post('/api/auth/register', authLimiter, validateBody(registerSchema), registerHandler);
app.post('/api/auth/login-local', authLimiter, validateBody(loginLocalSchema), loginLocalHandler);
app.post('/api/auth/logout', logoutHandler);

// ── Protected routes (all require a valid session cookie) ───────────────────
app.use('/api/auth', authMiddleware, authRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/exercises', authMiddleware, exerciseRoutes);
app.use('/api/workouts', authMiddleware, workoutRoutes);
app.use('/api/ai', authMiddleware, aiLimiter, aiRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/bootstrap', authMiddleware, bootstrapRoutes);

// ── Centralised error handler (must be registered last) ─────────────────────
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🏋️ Progressor API running on port ${env.PORT}`);
});
