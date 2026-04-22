import { z } from 'zod';

const templateSetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().min(0),
  weightKg: z.number().min(0),
});

const templateExerciseSchema = z.object({
  exerciseId: z.number().int().positive().optional(),
  exerciseName: z.string().min(1),
  order: z.number().int().min(0),
  sets: z.array(templateSetSchema).min(1),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  type: z.string().optional().default('push'),
  exercises: z.array(templateExerciseSchema).min(1, 'At least one exercise is required'),
});

