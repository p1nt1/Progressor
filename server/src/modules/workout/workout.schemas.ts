import { z } from 'zod';

const setSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().min(0),
  weightKg: z.number().min(0),
  completed: z.boolean(),
});

const exerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  order: z.number().int().min(0),
  sets: z.array(setSchema).min(1, 'Each exercise must have at least one set'),
});

export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(255),
  type: z.string().min(1),
  startedAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
});

export const lastWeightsSchema = z.object({
  exerciseIds: z.array(z.number().int().positive()),
});

