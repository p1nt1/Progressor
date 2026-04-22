import { pool, query } from '../../db/pool';
import type { Workout } from '../../types';

export async function createWorkout(workout: Workout): Promise<string> {
  const conn = await pool.connect();

  try {
    await conn.query('BEGIN');

    const wResult = await conn.query(
      `INSERT INTO workouts (user_id, name, type, notes, started_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [workout.userId, workout.name, workout.type, workout.notes || null, workout.startedAt || new Date()]
    );
    const workoutId = wResult.rows[0].id;

    for (const ex of workout.exercises) {
      const weResult = await conn.query(
        `INSERT INTO workout_exercises (workout_id, exercise_id, "order") VALUES ($1, $2, $3) RETURNING id`,
        [workoutId, ex.exerciseId, ex.order]
      );
      const weId = weResult.rows[0].id;

      for (const set of ex.sets) {
        await conn.query(
          `INSERT INTO sets (workout_exercise_id, set_number, reps, weight_kg, completed)
           VALUES ($1, $2, $3, $4, $5)`,
          [weId, set.setNumber, set.reps, set.weightKg, set.completed]
        );
      }
    }

    await conn.query('COMMIT');
    return workoutId;
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

export async function getWorkouts(userId: string, limit = 20, offset = 0) {
  const result = await query(
    `SELECT w.id, w.name, w.type, w.started_at, w.completed_at, w.notes,
            COUNT(s.id) FILTER (WHERE s.completed = true) AS completed_sets_count,
            COUNT(s.id) AS total_sets_count
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id
     WHERE w.user_id = $1
     GROUP BY w.id
     ORDER BY w.started_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const wResult = await query(
    `SELECT id, name, type, started_at, completed_at, notes, ai_review
     FROM workouts WHERE id = $1 AND user_id = $2`,
    [workoutId, userId]
  );
  if (wResult.rows.length === 0) return null;

  const workout = wResult.rows[0];

  const exResult = await query(
    `SELECT we.id, we.exercise_id, e.name as exercise_name, we."order",
            COALESCE(
              json_agg(
                json_build_object(
                  'id', s.id,
                  'set_number', s.set_number,
                  'reps', s.reps,
                  'weight_kg', s.weight_kg,
                  'completed', s.completed
                ) ORDER BY s.set_number
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) AS sets
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id
     WHERE we.workout_id = $1
     GROUP BY we.id, we.exercise_id, e.name, we."order"
     ORDER BY we."order"`,
    [workoutId]
  );

  return { ...workout, exercises: exResult.rows };
}

export async function completeWorkout(workoutId: string, userId: string) {
  const result = await query(
    `UPDATE workouts SET completed_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id`,
    [workoutId, userId]
  );
  return result.rows[0] || null;
}

export async function getExerciseHistory(userId: string, exerciseId: number, limit = 10) {
  const result = await query(
    `SELECT w.started_at, s.set_number, s.reps, s.weight_kg, s.completed
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND we.exercise_id = $2 AND w.completed_at IS NOT NULL
     ORDER BY w.started_at DESC, s.set_number
     LIMIT $3`,
    [userId, exerciseId, limit * 5]
  );
  return result.rows;
}

/**
 * Returns the last used weight and reps for each exercise in a given list.
 * Result: { [exerciseId]: { weightKg, reps }[] } — one entry per set from the most recent session.
 */
export async function getLastWeightsForExercises(
  userId: string,
  exerciseIds: number[]
): Promise<Record<number, { setNumber: number; weightKg: number; reps: number }[]>> {
  if (exerciseIds.length === 0) return {};

  // For each exercise, get sets from the most recent completed workout
  const placeholders = exerciseIds.map((_, i) => `$${i + 2}`).join(', ');
  const result = await query(
    `SELECT DISTINCT ON (we.exercise_id, s.set_number)
            we.exercise_id,
            s.set_number,
            s.weight_kg,
            s.reps
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1
       AND we.exercise_id IN (${placeholders})
       AND w.completed_at IS NOT NULL
     ORDER BY we.exercise_id, s.set_number, w.started_at DESC`,
    [userId, ...exerciseIds]
  );

  const map: Record<number, { setNumber: number; weightKg: number; reps: number }[]> = {};
  for (const row of result.rows) {
    const id = row.exercise_id;
    if (!map[id]) map[id] = [];
    map[id].push({ setNumber: row.set_number, weightKg: parseFloat(row.weight_kg), reps: row.reps });
  }
  return map;
}


/** Returns total completed workouts, weekly streak, and top compound 1RM estimates. */
export async function getWorkoutStats(userId: string) {
  // ── Total completed workouts ──────────────────────────────────────────────
  const totalResult = await query(
    `SELECT COUNT(*) AS total FROM workouts WHERE user_id = $1 AND completed_at IS NOT NULL`,
    [userId]
  );

  // ── Weekly streak (consecutive calendar weeks with ≥1 completed workout) ──
  const weeksResult = await query(
    `SELECT DISTINCT DATE_TRUNC('week', completed_at)::date AS week_start
     FROM workouts WHERE user_id = $1 AND completed_at IS NOT NULL
     ORDER BY week_start DESC`,
    [userId]
  );

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  // Monday of the current week (UTC)
  const dow = now.getUTCDay();
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  thisMonday.setUTCHours(0, 0, 0, 0);

  const weeks: number[] = weeksResult.rows.map((r: { week_start: string }) => new Date(r.week_start).getTime());
  let streak = 0;
  let expected = thisMonday.getTime();

  for (const week of weeks) {
    if (week === expected) {
      streak++;
      expected -= WEEK_MS;
    } else if (streak === 0 && week === expected - WEEK_MS) {
      // Current week has no workout yet — start streak from last week
      streak = 1;
      expected = week - WEEK_MS;
    } else {
      break;
    }
  }

  // ── 1RM estimates (Epley: weight × (1 + reps/30)) ─────────────────────────
  const oneRMResult = await query(
    `SELECT e.id, e.name,
            ROUND(MAX(s.weight_kg * (1 + s.reps / 30.0))::numeric, 1) AS estimated_1rm
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1
       AND w.completed_at IS NOT NULL
       AND e.is_compound = true
       AND s.reps > 0 AND s.weight_kg > 0 AND s.completed = true
     GROUP BY e.id, e.name
     ORDER BY estimated_1rm DESC
     LIMIT 8`,
    [userId]
  );

  return {
    totalWorkouts: parseInt(totalResult.rows[0].total, 10),
    weekStreak: streak,
    oneRMs: oneRMResult.rows.map((r: { id: number; name: string; estimated_1rm: string }) => ({
      exerciseId: r.id,
      exerciseName: r.name,
      estimated1RM: parseFloat(r.estimated_1rm),
    })),
  };
}

