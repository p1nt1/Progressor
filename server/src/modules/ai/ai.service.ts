import OpenAI from 'openai';
import { env } from '../../config/env';
import { query } from '../../db/pool';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateWorkoutPlan(userId: string, type: string) {
  // Get user's recent history
  const history = await query(
    `SELECT e.name, e.muscle_group, s.reps, s.weight_kg, w.started_at
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND w.completed_at IS NOT NULL
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
    model: 'gpt-4o-mini',
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

export async function explainProgression(userId: string, exerciseId: number) {
  const history = await query(
    `SELECT w.started_at, s.set_number, s.reps, s.weight_kg, s.completed
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND we.exercise_id = $2 AND w.completed_at IS NOT NULL
     ORDER BY w.started_at DESC LIMIT 30`,
    [userId, exerciseId]
  );

  const exercise = await query(`SELECT name FROM exercises WHERE id = $1`, [exerciseId]);
  console.log(exercise.rows)

  const prompt = `Analyze this training history for ${exercise.rows[0]?.name || 'unknown exercise'} and provide coaching advice.

History (most recent first):
${JSON.stringify(history.rows)}

Provide:
1. Performance trend analysis
2. Whether the user should increase weight, deload, or maintain
3. Specific actionable advice
4. Encouragement

Keep it concise (3-4 sentences). Be specific with numbers.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a supportive and knowledgeable strength coach.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return {
    exerciseName: exercise.rows[0]?.name,
    explanation: response.choices[0]?.message?.content || 'No analysis available.',
  };
}

export async function getWeeklySummary(userId: string): Promise<string> {
  // Get last 7 days of workouts
  const workoutsResult = await query(
    `SELECT w.name, w.type, w.started_at, w.completed_at
     FROM workouts w
     WHERE w.user_id = $1 AND w.started_at >= NOW() - INTERVAL '7 days'
     ORDER BY w.started_at DESC`,
    [userId]
  );

  // Get sets from last 7 days
  const setsResult = await query(
    `SELECT e.name as exercise, e.muscle_group, s.reps, s.weight_kg, s.completed, w.started_at
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     JOIN workouts w ON w.id = we.workout_id
     WHERE w.user_id = $1 AND w.started_at >= NOW() - INTERVAL '7 days' AND w.completed_at IS NOT NULL
     ORDER BY w.started_at DESC, we."order", s.set_number`,
    [userId]
  );

  // Get user profile for context
  const profileResult = await query(
    `SELECT height_cm, weight_kg, sex, experience_level, training_goal, training_days_per_week
     FROM profiles WHERE user_id = $1`,
    [userId]
  );

  if (workoutsResult.rows.length === 0) {
    return 'No workouts recorded this week. Get to the gym and start tracking to receive personalised coaching insights!';
  }

  const profile = profileResult.rows[0] || {};

  const prompt = `You are a supportive fitness coach. Provide a short weekly progress summary for this user.

User profile: ${JSON.stringify(profile)}

Workouts this week (${workoutsResult.rows.length} sessions):
${JSON.stringify(workoutsResult.rows)}

Sets performed:
${JSON.stringify(setsResult.rows)}

Write a brief, encouraging 3-5 sentence summary covering:
- How many sessions they completed vs their target (${profile.training_days_per_week || '?'} days/week)
- Key highlights (heaviest lifts, most volume, muscle groups trained)
- One specific tip for next week
- Motivational closing

Be conversational and specific with numbers. Don't use bullet points.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a supportive, knowledgeable fitness coach. Keep responses concise and motivating.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 250,
  });

  return response.choices[0]?.message?.content || 'Unable to generate summary at this time.';
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
  if (upperCount > 0 && lowerCount === 0) return 'upper';
  if (lowerCount > 0 && upperCount === 0) return 'lower';
  return 'custom';
}

/**
 * Review a completed workout by comparing it to the previous workout of the same detected type.
 */
export async function reviewWorkout(userId: string, workoutId: string) {
  // Get current workout details
  const currentResult = await query(
    `SELECT e.name as exercise_name, e.muscle_group, s.set_number, s.reps, s.weight_kg, s.completed
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = $1
     ORDER BY we."order", s.set_number`,
    [workoutId]
  );

  if (currentResult.rows.length === 0) {
    return { type: 'custom', review: 'No exercise data found for this workout.' };
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
     WHERE w.id = $1
     ORDER BY we."order", s.set_number`,
    [prevWorkoutId]
  );

  const prompt = `You are an expert strength coach. Review this workout and compare it to the previous session of the same type.

Workout type: ${detectedType}

Current workout:
${JSON.stringify(currentResult.rows)}

Previous ${detectedType} workout:
${prevResult.rows.length > 0 ? JSON.stringify(prevResult.rows) : 'No previous workout of this type found.'}

Provide a JSON response with this format:
{
  "summary": "A 2-3 sentence overall review comparing to previous",
  "exerciseReviews": [
    {
      "exerciseName": "exercise name",
      "verdict": "improved" | "maintained" | "declined",
      "comment": "One sentence about performance change"
    }
  ],
  "tip": "One actionable tip for next session"
}

Be specific with numbers. Compare weights, reps, and volume.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a supportive strength coach. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '{}';
  try {
    const review = JSON.parse(content);
    return { type: detectedType, review };
  } catch {
    return { type: detectedType, review: { summary: content, exerciseReviews: [], tip: '' } };
  }
}
