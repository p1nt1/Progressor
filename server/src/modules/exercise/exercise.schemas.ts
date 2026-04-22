import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(255),
  muscleGroup: z.enum(['chest', 'back', 'shoulders', 'legs', 'arms', 'core']),
  isCompound: z.boolean().optional().default(false),
});

