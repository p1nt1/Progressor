import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';

const router = Router();

// Get profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal, training_days_per_week
       FROM profiles WHERE user_id = $1`,
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update profile
router.put('/', async (req: Request, res: Response) => {
  try {
    const { heightCm, weightKg, sex, dateOfBirth, experienceLevel, trainingGoal, trainingDaysPerWeek } = req.body;

    const result = await query(
      `INSERT INTO profiles (user_id, height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal, training_days_per_week, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         height_cm = $2, weight_kg = $3, sex = $4, date_of_birth = $5,
         experience_level = $6, training_goal = $7, training_days_per_week = $8, updated_at = NOW()
       RETURNING *`,
      [req.user!.id, heightCm, weightKg, sex, dateOfBirth || null, experienceLevel, trainingGoal, trainingDaysPerWeek]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

export default router;

