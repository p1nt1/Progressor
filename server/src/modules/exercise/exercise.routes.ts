import type { Request, Response } from 'express';
import { Router } from 'express';
import { query } from '../../db/pool';
import { asyncHandler } from '../../middleware/errors';
import { validateBody } from '../../middleware/validate';
import { createExerciseSchema } from './exercise.schemas';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const muscleGroup = req.query.muscleGroup as string | undefined;
    let sql = 'SELECT id, name, muscle_group, is_compound FROM exercises';
    const params: unknown[] = [];

    if (muscleGroup) {
      sql += ' WHERE muscle_group = $1';
      params.push(muscleGroup);
    }
    sql += ' ORDER BY name';

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// Create a custom exercise
router.post(
  '/',
  validateBody(createExerciseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, muscleGroup, isCompound } = req.body;

    const result = await query(
      `INSERT INTO exercises (name, muscle_group, is_compound)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET name = exercises.name
       RETURNING id, name, muscle_group, is_compound`,
      [name.trim(), muscleGroup, isCompound ?? false]
    );
    res.status(201).json(result.rows[0]);
  })
);

export default router;
