import type { Request, Response } from 'express';
import { Router } from 'express';
import { query } from '../../db/pool';
import { getTemplates } from '../template/template.service';
import { getWorkouts, getWorkoutStats } from '../workout/workout.service';
import { asyncHandler } from '../../middleware/errors';

const router = Router();

/**
 * GET /api/bootstrap
 * Returns all data needed for the initial page load in a single request.
 * Runs all queries in parallel on the server.
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const [profileResult, templates, workouts, stats] = await Promise.all([
      query(
        `SELECT height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal,
                training_days_per_week, selected_split, split_rotation_index
         FROM profiles WHERE user_id = $1`,
        [userId]
      ),
      getTemplates(userId),
      getWorkouts(userId, 20, 0),
      getWorkoutStats(userId),
    ]);

    res.json({
      profile: profileResult.rows[0] ?? null,
      templates,
      workouts,
      stats,
    });
  })
);

export default router;
