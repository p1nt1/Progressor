import type { Request, Response } from 'express';
import { Router } from 'express';
import * as workoutService from './workout.service';
import { asyncHandler, AppError } from '../../middleware/errors';
import { validateBody } from '../../middleware/validate';
import { createWorkoutSchema, lastWeightsSchema } from './workout.schemas';

const router = Router();

// Create workout
router.post(
  '/',
  validateBody(createWorkoutSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const workoutId = await workoutService.createWorkout({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json({ id: workoutId });
  })
);

// List workouts
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const workouts = await workoutService.getWorkouts(req.user!.id, limit, offset);
    res.json(workouts);
  })
);

// ── All static GET routes MUST be defined before /:id ──────────────────────

// Workout stats (total workouts, streak, 1RM estimates)
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await workoutService.getWorkoutStats(req.user!.id);
    res.json(stats);
  })
);

// Exercise history
router.get(
  '/history/:exerciseId',
  asyncHandler(async (req: Request, res: Response) => {
    const history = await workoutService.getExerciseHistory(
      req.user!.id,
      parseInt(req.params.exerciseId)
    );
    res.json(history);
  })
);


// Last used weight + reps per exercise (for pre-filling active workout)
router.post(
  '/last-weights',
  validateBody(lastWeightsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { exerciseIds } = req.body as { exerciseIds: number[] };
    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return res.json({});
    }
    const result = await workoutService.getLastWeightsForExercises(req.user!.id, exerciseIds);
    res.json(result);
  })
);

// Get workout detail  ← dynamic param, must come last among GETs
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const workout = await workoutService.getWorkoutById(req.params.id, req.user!.id);
    if (!workout) throw new AppError(404, 'Workout not found');
    res.json(workout);
  })
);

// Complete workout
router.put(
  '/:id/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await workoutService.completeWorkout(req.params.id, req.user!.id);
    if (!result) throw new AppError(404, 'Workout not found');

    res.json({ completed: true });
  })
);

export default router;
