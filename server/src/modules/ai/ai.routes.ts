import type { Request, Response } from 'express';
import { Router } from 'express';
import { generateWorkoutPlan, reviewWorkout } from './ai.service';
import { query } from '../../db/pool';
import { asyncHandler, AppError } from '../../middleware/errors';
import { validateBody } from '../../middleware/validate';
import { generateSchema, reviewWorkoutSchema } from './ai.schemas';

const router = Router();

// Generate workout plan
router.post('/generate', validateBody(generateSchema), asyncHandler(async (req: Request, res: Response) => {
  const { type, focus } = req.body;
  const plan = await generateWorkoutPlan(req.user!.id, type, focus);
  res.json(plan);
}));

// Review a completed workout (compare to previous of same type)
router.post('/review-workout', validateBody(reviewWorkoutSchema), asyncHandler(async (req: Request, res: Response) => {
  const { workoutId, feedbackRating } = req.body;
  if (!workoutId) throw new AppError(400, 'workoutId is required');
  const result = await reviewWorkout(req.user!.id, workoutId, feedbackRating);
  // null means no previous workout of same type — skip review silently
  if (result === null) return res.status(204).send();

  // Persist the review so it's available in workout detail later
  await query(
    `UPDATE workouts SET ai_review = $1 WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(result), workoutId, req.user!.id]
  );

  res.json(result);
}));

export default router;
