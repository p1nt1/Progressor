import { Router, Request, Response } from 'express';
import * as workoutService from './workout.service';
import { checkProgression } from './progression.service';

const router = Router();

// Create workout
router.post('/', async (req: Request, res: Response) => {
  try {
    const workoutId = await workoutService.createWorkout({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json({ id: workoutId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// List workouts
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const workouts = await workoutService.getWorkouts(req.user!.id, limit, offset);
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// ── All static GET routes MUST be defined before /:id ──────────────────────

// Workout stats (total workouts, streak, 1RM estimates)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await workoutService.getWorkoutStats(req.user!.id);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Exercise history
router.get('/history/:exerciseId', async (req: Request, res: Response) => {
  try {
    const history = await workoutService.getExerciseHistory(
      req.user!.id,
      parseInt(req.params.exerciseId)
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Progression suggestion
router.get('/progression/:exerciseId', async (req: Request, res: Response) => {
  try {
    const suggestion = await checkProgression(req.user!.id, parseInt(req.params.exerciseId));
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check progression' });
  }
});

// Progression log — full timeline
router.get('/progression-log', async (req: Request, res: Response) => {
  try {
    const exerciseId = req.query.exerciseId ? parseInt(req.query.exerciseId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const log = await workoutService.getProgressionLog(req.user!.id, exerciseId, limit);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progression log' });
  }
});

// Progression summary — per-exercise milestone counts
router.get('/progression-summary', async (req: Request, res: Response) => {
  try {
    const summary = await workoutService.getProgressionSummary(req.user!.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progression summary' });
  }
});

// Last used weight + reps per exercise (for pre-filling active workout)
router.post('/last-weights', async (req: Request, res: Response) => {
  try {
    const { exerciseIds } = req.body as { exerciseIds: number[] };
    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return res.json({});
    }
    const result = await workoutService.getLastWeightsForExercises(req.user!.id, exerciseIds);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch last weights' });
  }
});

// Get workout detail  ← dynamic param, must come last among GETs
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workout = await workoutService.getWorkoutById(req.params.id, req.user!.id);
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// Complete workout + check progression
router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const result = await workoutService.completeWorkout(req.params.id, req.user!.id);
    if (!result) return res.status(404).json({ error: 'Workout not found' });

    // Check progression for all exercises in this workout
    const workout = await workoutService.getWorkoutById(req.params.id, req.user!.id);
    const suggestions = [];
    if (workout) {
      for (const ex of workout.exercises) {
        const suggestion = await checkProgression(req.user!.id, ex.exercise_id);
        if (suggestion) suggestions.push(suggestion);
      }
    }

    res.json({ completed: true, suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete workout' });
  }
});

export default router;
