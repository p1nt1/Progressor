// ---------------------------------------------------------------------------
// Training splits — definitions, rotation helpers
// ---------------------------------------------------------------------------

export type SplitKey = 'ppl' | 'upperLower' | 'fullBody' | 'arnold' | 'bro';

export interface SplitDay {
  label: string;
  focus: string;
  color: string;
}

export interface Split {
  label: string;
  description: string;
  /** Maps training-days-per-week → ordered array of day keys */
  daysMap: Record<number, string[]>;
  days: Record<string, SplitDay>;
}

// ─── Split catalogue ────────────────────────────────────────────────────────

export const SPLITS: Record<SplitKey, Split> = {

  // ── PPL ──────────────────────────────────────────────────────────────────
  ppl: {
    label: 'Push / Pull / Legs',
    description: 'Classic 3-way split — great for 3–6 days',
    daysMap: {
      3: ['push', 'pull', 'legs'],
      4: ['push', 'pull', 'legs', 'push'],
      5: ['push', 'pull', 'legs', 'push', 'pull'],
      6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    },
    days: {
      push: {
        label: 'Push',
        focus: 'Chest · Shoulders · Triceps',
        color: '#E8503A',
      },
      pull: {
        label: 'Pull',
        focus: 'Back · Biceps · Rear Delts',
        color: '#3A7BD5',
      },
      legs: {
        label: 'Legs',
        focus: 'Quads · Hamstrings · Glutes · Calves',
        color: '#27AE60',
      },
    },
  },

  // ── Upper / Lower ─────────────────────────────────────────────────────────
  upperLower: {
    label: 'Upper / Lower',
    description: 'Balanced 2-way split — ideal for 2–6 days',
    daysMap: {
      2: ['upperA', 'lower'],
      3: ['upperA', 'lower', 'upperB'],
      4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
      5: ['upperA', 'lowerA', 'upperB', 'lowerB', 'upperA'],
      6: ['upperA', 'lowerA', 'upperB', 'lowerB', 'upperA', 'lowerA'],
    },
    days: {
      upperA: {
        label: 'Upper A',
        focus: 'Chest · Back (Horizontal) · Shoulders',
        color: '#8E44AD',
      },
      upperB: {
        label: 'Upper B',
        focus: 'Back (Vertical) · Chest · Arms',
        color: '#8E44AD',
      },
      lowerA: {
        label: 'Lower A',
        focus: 'Quads · Hamstrings (Hinge)',
        color: '#16A085',
      },
      lowerB: {
        label: 'Lower B',
        focus: 'Glutes · Hamstrings · Calves',
        color: '#16A085',
      },
      lower: {
        label: 'Lower',
        focus: 'Full Legs',
        color: '#16A085',
      },
    },
  },

  // ── Full Body ─────────────────────────────────────────────────────────────
  fullBody: {
    label: 'Full Body',
    description: 'Hit everything each session — best for 2–4 days',
    daysMap: {
      2: ['fbA', 'fbB'],
      3: ['fbA', 'fbB', 'fbC'],
      4: ['fbA', 'fbB', 'fbC', 'fbA'],
      5: ['fbA', 'fbB', 'fbC', 'fbA', 'fbB'],
    },
    days: {
      fbA: {
        label: 'Full Body A',
        focus: 'Squat pattern · Push · Pull vertical',
        color: '#E67E22',
      },
      fbB: {
        label: 'Full Body B',
        focus: 'Hip hinge · Push incline · Pull horizontal',
        color: '#E67E22',
      },
      fbC: {
        label: 'Full Body C',
        focus: 'Unilateral · Volume · Accessory',
        color: '#E67E22',
      },
    },
  },

  // ── Arnold Split ──────────────────────────────────────────────────────────
  arnold: {
    label: 'Arnold Split',
    description: 'Chest/Back + Shoulders/Arms + Legs',
    daysMap: {
      3: ['chestBack', 'shouldersArms', 'legs'],
      6: ['chestBack', 'shouldersArms', 'legs', 'chestBack', 'shouldersArms', 'legs'],
    },
    days: {
      chestBack: {
        label: 'Chest & Back',
        focus: 'Chest · Back — antagonist pairing',
        color: '#C0392B',
      },
      shouldersArms: {
        label: 'Shoulders & Arms',
        focus: 'Delts · Biceps · Triceps',
        color: '#2980B9',
      },
      legs: {
        label: 'Legs',
        focus: 'Quads · Hamstrings · Glutes · Calves',
        color: '#27AE60',
      },
    },
  },

  // ── Bro Split ─────────────────────────────────────────────────────────────
  bro: {
    label: 'Bro Split',
    description: 'One body part per day — maximum volume',
    daysMap: {
      3: ['chestShoulders', 'back', 'legs'],
      4: ['chest', 'back', 'shoulders', 'legs'],
      5: ['chest', 'back', 'shoulders', 'arms', 'legs'],
    },
    days: {
      chest: {
        label: 'Chest',
        focus: 'Full chest volume',
        color: '#E74C3C',
      },
      back: {
        label: 'Back',
        focus: 'Full back volume',
        color: '#2C3E50',
      },
      shoulders: {
        label: 'Shoulders',
        focus: 'All 3 delt heads',
        color: '#9B59B6',
      },
      arms: {
        label: 'Arms',
        focus: 'Biceps · Triceps',
        color: '#F39C12',
      },
      legs: {
        label: 'Legs',
        focus: 'Quads · Hamstrings · Glutes · Calves',
        color: '#27AE60',
      },
      chestShoulders: {
        label: 'Chest & Shoulders',
        focus: 'Chest · Delts',
        color: '#E74C3C',
      },
    },
  },
};

export const SPLIT_KEYS: SplitKey[] = ['ppl', 'upperLower', 'fullBody', 'arnold', 'bro'];

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the closest supported days-per-week for a given split.
 */
function closestDays(split: Split, daysPerWeek: number): number {
  const supported = Object.keys(split.daysMap).map(Number).sort((a, b) => a - b);
  return supported.reduce((prev, curr) =>
    Math.abs(curr - daysPerWeek) < Math.abs(prev - daysPerWeek) ? curr : prev
  );
}

/**
 * Get a single workout day from a split rotation.
 */
export function getTodaysWorkout(splitKey: SplitKey, daysPerWeek: number, rotationIndex: number) {
  const split = SPLITS[splitKey];
  const closest = closestDays(split, daysPerWeek);
  const rotation = split.daysMap[closest];
  const dayKey = rotation[rotationIndex % rotation.length];
  const day = split.days[dayKey];

  return {
    splitLabel: split.label,
    splitKey,
    dayKey,
    label: day.label,
    focus: day.focus,
    color: day.color,
    rotationDay: (rotationIndex % rotation.length) + 1,
    totalRotation: rotation.length,
  };
}

/**
 * Get the full week schedule preview.
 */
export function getWeekSchedule(splitKey: SplitKey, daysPerWeek: number) {
  const split = SPLITS[splitKey];
  const closest = closestDays(split, daysPerWeek);
  const rotation = split.daysMap[closest];

  return rotation.map((key, i) => ({
    index: i,
    dayKey: key,
    ...split.days[key],
  }));
}
