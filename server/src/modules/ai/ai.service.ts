import OpenAI from 'openai';
import { env } from '../../config/env';
import { query } from '../../db/pool';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MODEL_PLAN    = 'gpt-4.1-mini'; // plan generation — large context, needs quality
const MODEL_REVIEW  = 'gpt-4.1-mini'; // workout comparison — benefits from better analysis

export async function generateWorkoutPlan(userId: string, type: string, focus?: string) {
  // Get user's recent history
  const history = await query(
    `SELECT e.name, e.muscle_group, s.reps, s.weight_kg, w.started_at
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND w.completed_at IS NOT NULL AND s.completed = true
     ORDER BY w.started_at DESC LIMIT 50`,
    [userId]
  );

  const exercises = await query(`SELECT name, muscle_group, is_compound FROM exercises`);

  // Get user profile for personalised recommendations
  const profileResult = await query(
    `SELECT height_cm, weight_kg, sex, date_of_birth, experience_level, training_goal, training_days_per_week
     FROM profiles WHERE user_id = $1`,
    [userId]
  );
  const profile = profileResult.rows[0] || null;

  // Derive age from date_of_birth
  let age: number | null = null;
  if (profile?.date_of_birth) {
    const dob = new Date(profile.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  }

  const profileSummary = profile
    ? [
        age            ? `Age: ${age}` : null,
        profile.sex    ? `Sex: ${profile.sex}` : null,
        profile.height_cm ? `Height: ${profile.height_cm}cm` : null,
        profile.weight_kg ? `Body weight: ${profile.weight_kg}kg` : null,
        profile.experience_level ? `Experience level: ${profile.experience_level}` : null,
        profile.training_goal    ? `Training goal: ${profile.training_goal}` : null,
        profile.training_days_per_week ? `Training frequency: ${profile.training_days_per_week} days/week` : null,
      ].filter(Boolean).join(', ')
    : 'No profile data available';

  const prompt = `You are an expert strength coach. Generate a ${type} workout plan.
${focus ? `\nTarget focus for this session: ${focus}` : ''}

User profile: ${profileSummary}

Available exercises: ${JSON.stringify(exercises.rows)}

User's recent training history (last sessions):
${history.rows.length > 0 ? JSON.stringify(history.rows) : 'No history yet - create a balanced starter plan.'}

Rules:
- Pick 4-6 exercises appropriate for a "${type}" session
- Tailor exercise selection and volume to the user's experience level and training goal
- Start with compound movements, end with isolation
- Suggest 3-4 sets per exercise
- Suggest appropriate weight based on history and body weight (or a moderate starting weight)
- Include target reps adjusted for the user's goal (e.g. 4-6 for strength, 8-12 for hypertrophy, 12-15 for endurance)

Respond ONLY with valid JSON in this format:
{
  "name": "workout name",
  "type": "${type}",
  "explanation": "brief explanation of why these exercises were chosen for this user",
  "exercises": [
    {
      "exerciseName": "exact exercise name from available list",
      "order": 1,
      "sets": [
        { "setNumber": 1, "reps": 10, "weightKg": 60 }
      ]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: MODEL_PLAN,
    messages: [
      { role: 'system', content: 'You are a knowledgeable strength coach. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || '{}';
  // Strip markdown code fences if the model wrapped the JSON
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { error: 'Failed to parse AI response', raw: content };
  }
}

/**
 * Auto-detect workout type from exercise muscle groups.
 */
function detectWorkoutType(exercises: { muscle_group: string }[]): string {
  const groups = exercises.map((e) => e.muscle_group);
  const counts: Record<string, number> = {};
  groups.forEach((g) => (counts[g] = (counts[g] || 0) + 1));

  const hasChest = (counts['chest'] || 0) > 0;
  const hasShoulders = (counts['shoulders'] || 0) > 0;
  const hasBack = (counts['back'] || 0) > 0;
  const hasLegs = (counts['legs'] || 0) > 0;
  const hasArms = (counts['arms'] || 0) > 0;
  const hasCore = (counts['core'] || 0) > 0;

  const upperCount = (counts['chest'] || 0) + (counts['back'] || 0) + (counts['shoulders'] || 0) + (counts['arms'] || 0);
  const lowerCount = (counts['legs'] || 0) + (counts['core'] || 0);

  if (hasLegs && upperCount === 0) return 'legs';
  if ((hasChest || hasShoulders) && !hasBack && !hasLegs) return 'push';
  if (hasBack && !hasChest && !hasLegs) return 'pull';
  if (hasChest && hasBack && !hasLegs) return 'upper';
  if ((hasShoulders || hasArms) && !hasChest && !hasBack && !hasLegs) return 'push';
  if (upperCount > 0 && lowerCount === 0) return 'upper';
  if (lowerCount > 0 && upperCount === 0) return 'lower';
  return 'full body';
}

/**
 * Review a completed workout by comparing it to the previous workout of the same detected type.
 * Diffs (kgDiff, repsDiff, verdict) are computed server-side from raw data so they are always
 * consistent. The AI only writes the narrative (summary, comments, tip).
 */
export async function reviewWorkout(userId: string, workoutId: string, feedbackRating?: number) {
  // Get current workout details
  const currentResult = await query(
    `SELECT e.name as exercise_name, e.muscle_group, s.set_number, s.reps, s.weight_kg, s.completed
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = $1 AND s.completed = true
     ORDER BY we."order", s.set_number`,
    [workoutId]
  );

  if (currentResult.rows.length === 0) {
    return { type: 'push', review: 'No exercise data found for this workout.' };
  }

  // Detect type
  const uniqueExercises = Array.from(
    new Map(currentResult.rows.map((r: any) => [r.exercise_name, { muscle_group: r.muscle_group }])).values()
  );
  const detectedType = detectWorkoutType(uniqueExercises as { muscle_group: string }[]);

  // Find the most recent previous workout with exercise overlap (ignores stored type column,
  // which may be 'custom' even for structured push/pull/legs sessions)
  const prevWorkoutRow = await query(
    `SELECT w.id, COUNT(DISTINCT we.exercise_id) AS overlap
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id
     WHERE w.user_id = $1
       AND w.completed_at IS NOT NULL
       AND w.id != $2
       AND we.exercise_id IN (
         SELECT exercise_id FROM workout_exercises WHERE workout_id = $2
       )
     GROUP BY w.id
     ORDER BY w.started_at DESC, overlap DESC
     LIMIT 1`,
    [userId, workoutId]
  );

  // Fallback: if no exercise overlap, try matching by dominant muscle groups
  let prevWorkoutId: string | null = prevWorkoutRow.rows[0]?.id ?? null;

  if (!prevWorkoutId) {
    const muscleGroups = [...new Set(uniqueExercises.map((e: any) => e.muscle_group))];
    const fallbackRow = await query(
      `SELECT DISTINCT w.id
       FROM workouts w
       JOIN workout_exercises we ON we.workout_id = w.id
       JOIN exercises e ON e.id = we.exercise_id
       WHERE w.user_id = $1
         AND w.completed_at IS NOT NULL
         AND w.id != $2
         AND e.muscle_group = ANY($3)
       ORDER BY w.id DESC
       LIMIT 1`,
      [userId, workoutId, muscleGroups]
    );
    prevWorkoutId = fallbackRow.rows[0]?.id ?? null;
  }

  if (!prevWorkoutId) return null;

  const prevResult = await query(
    `SELECT w.name, w.type, w.started_at,
            e.name as exercise_name, e.muscle_group,
            s.set_number, s.reps, s.weight_kg, s.completed
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id
     JOIN exercises e ON e.id = we.exercise_id
     JOIN sets s ON s.workout_exercise_id = we.id
     WHERE w.id = $1 AND s.completed = true
     ORDER BY we."order", s.set_number`,
    [prevWorkoutId]
  );

  // ── Compute diffs server-side (verdict is deterministic, not AI-guessed) ──
  type SetRow = { exercise_name: string; reps: number; weight_kg: number };

  const summarise = (rows: SetRow[]) => {
    const map = new Map<string, { totalReps: number; maxWeight: number }>();
    for (const r of rows) {
      const cur = map.get(r.exercise_name) ?? { totalReps: 0, maxWeight: 0 };
      cur.totalReps += Number(r.reps);
      cur.maxWeight  = Math.max(cur.maxWeight, Number(r.weight_kg));
      map.set(r.exercise_name, cur);
    }
    return map;
  };

  const currentMap = summarise(currentResult.rows);
  const prevMap    = summarise(prevResult.rows);

  type ExerciseDiff = {
    exerciseName: string;
    verdict: 'improved' | 'maintained' | 'declined' | 'new';
    kgDiff: number | null;
    repsDiff: number | null;
  };

  const exerciseDiffs: ExerciseDiff[] = [];
  for (const [name, cur] of currentMap) {
    const prev = prevMap.get(name);
    if (!prev) {
      exerciseDiffs.push({ exerciseName: name, verdict: 'new', kgDiff: null, repsDiff: null });
      continue;
    }
    const kgDiff   = Math.round((cur.maxWeight - prev.maxWeight) * 10) / 10;
    const repsDiff = cur.totalReps - prev.totalReps;
    // Weight takes priority; reps are tiebreaker
    const verdict: 'improved' | 'maintained' | 'declined' =
      kgDiff > 0 || (kgDiff === 0 && repsDiff > 0) ? 'improved' :
      kgDiff < 0 || (kgDiff === 0 && repsDiff < 0) ? 'declined' : 'maintained';
    exerciseDiffs.push({ exerciseName: name, verdict, kgDiff, repsDiff });
  }

  // ── AI writes narrative only — numbers come from exerciseDiffs above ──────
  const FEEDBACK_MAP: Record<number, string> = {
    1: 'The user felt awful — extremely tough session, possible fatigue or pain.',
    2: 'The user felt rough — struggled through the workout, low energy.',
    3: 'The user felt okay — average session, nothing special.',
    4: 'The user felt good — strong and energised during the session.',
    5: 'The user felt great — peak performance, everything clicked.',
  };
  const feedbackLine = feedbackRating && FEEDBACK_MAP[feedbackRating]
    ? `\nUser self-reported feeling: ${FEEDBACK_MAP[feedbackRating]} (${feedbackRating}/5)\nFactor this into your summary, encouragement tone, and tip.`
    : '';

  const prompt = `You are a motivating strength coach. Write punchy, engaging review text based on these pre-computed exercise stats.

Workout type: ${detectedType}${feedbackLine}
Exercise diffs (use these exact numbers in your comments):
${JSON.stringify(exerciseDiffs)}

Current workout raw data: ${JSON.stringify(currentResult.rows)}
Previous workout raw data: ${JSON.stringify(prevResult.rows)}

Respond ONLY with valid JSON:
{
  "summary": "2-3 engaging sentences on overall session vs last time. Reference standout lifts or total volume. Be motivating.",
  "exerciseComments": {
    "<exerciseName>": "One punchy sentence referencing the actual numbers from the diff"
  },
  "tip": "One specific tip with a concrete target for next session (e.g. 'Push Barbell Squat to 90kg — you are ready')"
}`;

  const response = await openai.chat.completions.create({
    model: MODEL_REVIEW,
    messages: [
      { role: 'system', content: 'You are a supportive strength coach. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const narrative = JSON.parse(cleaned);
    const exerciseReviews = exerciseDiffs.map((d) => ({
      exerciseName: d.exerciseName,
      verdict:      d.verdict,
      kgDiff:       d.kgDiff,
      repsDiff:     d.repsDiff,
      comment:      narrative.exerciseComments?.[d.exerciseName] ?? '',
    }));
    return {
      type: detectedType,
      review: { summary: narrative.summary, exerciseReviews, tip: narrative.tip },
    };
  } catch {
    return { type: detectedType, review: { summary: cleaned, exerciseReviews: [], tip: '' } };
  }
}
