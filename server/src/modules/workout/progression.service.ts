import { query } from '../../db/pool';
import { ProgressionSuggestion } from '../../types';

const WEIGHT_INCREMENT_COMPOUND = 2.5;
const WEIGHT_INCREMENT_ISOLATION = 1.5;
const TARGET_REPS = 8;
const MIN_REPS_FOR_PROGRESSION = 6;

export async function checkProgression(
  userId: string,
  exerciseId: number
): Promise<ProgressionSuggestion | null> {
  // Get exercise info
  const exResult = await query(
    `SELECT id, name, is_compound FROM exercises WHERE id = $1`,
    [exerciseId]
  );
  if (exResult.rows.length === 0) return null;
  const exercise = exResult.rows[0];

  // Get last 2 completed workout sessions for this exercise
  const historyResult = await query(
    `SELECT w.id as workout_id, w.started_at, s.set_number, s.reps, s.weight_kg, s.completed
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND we.exercise_id = $2 AND w.completed_at IS NOT NULL
     ORDER BY w.started_at DESC, s.set_number
     LIMIT 20`,
    [userId, exerciseId]
  );

  if (historyResult.rows.length === 0) return null;

  // Group by workout
  const workoutMap = new Map<string, any[]>();
  for (const row of historyResult.rows) {
    const key = row.workout_id;
    if (!workoutMap.has(key)) workoutMap.set(key, []);
    workoutMap.get(key)!.push(row);
  }

  const sessions = Array.from(workoutMap.values());
  if (sessions.length === 0) return null;

  const lastSession = sessions[0];
  const currentWeight = lastSession[0].weight_kg;
  const allCompleted = lastSession.every((s: any) => s.completed);
  const allHitTarget = lastSession.every((s: any) => s.reps >= MIN_REPS_FOR_PROGRESSION);

  const increment = exercise.is_compound ? WEIGHT_INCREMENT_COMPOUND : WEIGHT_INCREMENT_ISOLATION;

  // Progression: all sets completed with target reps → increase weight
  if (allCompleted && allHitTarget) {
    const newWeight = parseFloat(currentWeight) + increment;

    // Log it
    await query(
      `INSERT INTO progression_log (user_id, exercise_id, previous_weight, new_weight, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, exerciseId, currentWeight, newWeight,
        `All sets completed with ${MIN_REPS_FOR_PROGRESSION}+ reps at ${currentWeight}kg. Progressive overload applied.`]
    );

    return {
      exerciseId,
      exerciseName: exercise.name,
      currentWeight: parseFloat(currentWeight),
      suggestedWeight: newWeight,
      reason: `You completed all sets with ${MIN_REPS_FOR_PROGRESSION}+ reps at ${currentWeight}kg. Time to increase to ${newWeight}kg! Progressive overload is the key driver of muscle growth.`,
    };
  }

  // Check for plateau (same weight for 3+ sessions, not hitting target)
  if (sessions.length >= 3) {
    const sameWeight = sessions.slice(0, 3).every(
      (s) => parseFloat(s[0].weight_kg) === parseFloat(currentWeight)
    );
    const notProgressing = sessions.slice(0, 3).every(
      (s) => !s.every((set: any) => set.reps >= MIN_REPS_FOR_PROGRESSION)
    );

    if (sameWeight && notProgressing) {
      const deloadWeight = parseFloat(currentWeight) * 0.9;
      return {
        exerciseId,
        exerciseName: exercise.name,
        currentWeight: parseFloat(currentWeight),
        suggestedWeight: Math.round(deloadWeight / increment) * increment,
        reason: `You've been stuck at ${currentWeight}kg for 3 sessions without hitting target reps. A 10% deload to ${Math.round(deloadWeight / increment) * increment}kg will help you recover and break through this plateau.`,
      };
    }
  }

  // Maintain current weight
  return {
    exerciseId,
    exerciseName: exercise.name,
    currentWeight: parseFloat(currentWeight),
    suggestedWeight: parseFloat(currentWeight),
    reason: `Keep working at ${currentWeight}kg. Focus on hitting ${TARGET_REPS} reps on all sets before increasing weight.`,
  };
}

