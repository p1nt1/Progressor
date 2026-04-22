import { z } from 'zod';

export const generateSchema = z.object({
  type: z.string().min(1, 'Workout type is required'),
  focus: z.string().optional(),
});

export const reviewWorkoutSchema = z.object({
  workoutId: z.string().uuid('workoutId must be a valid UUID'),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

