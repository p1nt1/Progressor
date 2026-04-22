import { z } from 'zod';

export const saveProfileSchema = z.object({
  heightCm: z.number().positive().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  sex: z.string().min(1),
  dateOfBirth: z.string().nullable().optional(),
  experienceLevel: z.string().min(1),
  trainingGoal: z.string().min(1),
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  selectedSplit: z.string().optional().default('ppl'),
  splitRotationIndex: z.number().int().min(0).optional().default(0),
});

export const patchSplitRotationSchema = z.object({
  splitRotationIndex: z.number().int().min(0),
});

