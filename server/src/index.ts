import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authMiddleware } from './middleware/authMiddleware';
import authRoutes from './modules/auth/auth.routes';
import exerciseRoutes from './modules/exercise/exercise.routes';
import workoutRoutes from './modules/workout/workout.routes';
import aiRoutes from './modules/ai/ai.routes';
import profileRoutes from './modules/profile/profile.routes';
import templateRoutes from './modules/template/template.routes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check (no auth)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api/auth', authMiddleware, authRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/exercises', authMiddleware, exerciseRoutes);
app.use('/api/workouts', authMiddleware, workoutRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);

app.listen(env.PORT, () => {
  console.log(`🏋️ Progressor API running on port ${env.PORT}`);
});
