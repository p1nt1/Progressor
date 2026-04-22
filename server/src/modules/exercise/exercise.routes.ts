import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const muscleGroup = _req.query.muscleGroup as string | undefined;
    let sql = 'SELECT id, name, muscle_group, is_compound FROM exercises';
    const params: any[] = [];

    if (muscleGroup) {
      sql += ' WHERE muscle_group = $1';
      params.push(muscleGroup);
    }
    sql += ' ORDER BY name';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

export default router;

