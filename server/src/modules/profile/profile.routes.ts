import type { Request, Response } from 'express';
import { Router } from 'express';
import { query } from '../../db/pool';
import { asyncHandler } from '../../middleware/errors';
import { validateBody } from '../../middleware/validate';
import { saveProfileSchema, patchSplitRotationSchema } from './profile.schemas';

const router = Router();

// Get profile
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      `SELECT height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal, training_days_per_week, selected_split, split_rotation_index
       FROM profiles WHERE user_id = $1`,
      [req.user!.id]
    );
    if (result.rows.length === 0) return res.json(null);
    res.json(result.rows[0]);
  })
);

// Create or update profile
router.put(
  '/',
  validateBody(saveProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { heightCm, weightKg, sex, dateOfBirth, experienceLevel, trainingGoal, trainingDaysPerWeek, selectedSplit, splitRotationIndex } = req.body;

    const result = await query(
      `INSERT INTO profiles (user_id, height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal, training_days_per_week, selected_split, split_rotation_index, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         height_cm = $2, weight_kg = $3, sex = $4, date_of_birth = $5,
         experience_level = $6, training_goal = $7, training_days_per_week = $8,
         selected_split = $9, split_rotation_index = $10, updated_at = NOW()
       RETURNING *`,
      [req.user!.id, heightCm, weightKg, sex, dateOfBirth || null, experienceLevel, trainingGoal, trainingDaysPerWeek, selectedSplit || 'ppl', splitRotationIndex ?? 0]
    );

    res.json(result.rows[0]);
  })
);

// Lightweight update for split rotation index only
router.patch(
  '/split-rotation',
  validateBody(patchSplitRotationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { splitRotationIndex } = req.body;
    await query(
      `UPDATE profiles SET split_rotation_index = $1, updated_at = NOW() WHERE user_id = $2`,
      [splitRotationIndex, req.user!.id]
    );
    res.json({ splitRotationIndex });
  })
);

export default router;
