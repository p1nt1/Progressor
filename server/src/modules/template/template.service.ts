import { query } from '../../db/pool';

export async function getTemplates(userId: string) {
  const result = await query(
    `SELECT id, name, type, exercises, created_at, updated_at
     FROM workout_templates WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function createTemplate(userId: string, name: string, type: string, exercises: any[]) {
  // Upsert — if same name exists for user, update it
  const result = await query(
    `INSERT INTO workout_templates (user_id, name, type, exercises)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, name) DO UPDATE
       SET type = $3, exercises = $4, updated_at = NOW()
     RETURNING id, name, type, exercises, created_at, updated_at`,
    [userId, name, type, JSON.stringify(exercises)]
  );
  return result.rows[0];
}

export async function deleteTemplate(userId: string, id: number) {
  const result = await query(
    `DELETE FROM workout_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rows[0] || null;
}

