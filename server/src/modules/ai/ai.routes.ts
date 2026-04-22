import { Router, Request, Response } from 'express';
import { generateWorkoutPlan, explainProgression, getWeeklySummary, reviewWorkout } from './ai.service';
import { query } from '../../db/pool';

const router = Router();

// Generate workout plan
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Workout type is required' });
    const plan = await generateWorkoutPlan(req.user!.id, type);
    res.json(plan);
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ error: 'Failed to generate workout plan' });
  }
});

// Explain progression for an exercise
router.get('/explain/:exerciseId', async (req: Request, res: Response) => {
  try {
    const result = await explainProgression(req.user!.id, parseInt(req.params.exerciseId));
    res.json(result);
  } catch (err) {
    console.error('AI explain error:', err);
    res.status(500).json({ error: 'Failed to get AI explanation' });
  }
});

// Weekly progress summary (cached per week)
router.get('/weekly-summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Calculate current week start (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Check cache
    const cached = await query(
      `SELECT summary FROM weekly_summary_cache WHERE user_id = $1 AND week_start = $2`,
      [userId, weekStartStr]
    );

    if (cached.rows.length > 0) {
      return res.json({ summary: cached.rows[0].summary, cached: true });
    }

    // Generate fresh summary
    const summary = await getWeeklySummary(userId);

    // Store in cache
    await query(
      `INSERT INTO weekly_summary_cache (user_id, summary, week_start)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET summary = $2, week_start = $3, created_at = NOW()`,
      [userId, summary, weekStartStr]
    );

    res.json({ summary, cached: false });
  } catch (err) {
    console.error('AI weekly summary error:', err);
    res.status(500).json({ error: 'Failed to get weekly summary' });
  }
});

// Review a completed workout (compare to previous of same type)
router.post('/review-workout', async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.body;
    if (!workoutId) return res.status(400).json({ error: 'workoutId is required' });
    const result = await reviewWorkout(req.user!.id, workoutId);
    // null means no previous workout of same type — skip review silently
    if (result === null) return res.status(204).send();

    // Persist the review so it's available in workout detail later
    await query(
      `UPDATE workouts SET ai_review = $1 WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(result), workoutId, req.user!.id]
    );

    res.json(result);
  } catch (err) {
    console.error('AI review error:', err);
    res.status(500).json({ error: 'Failed to review workout' });
  }
});

export default router;
