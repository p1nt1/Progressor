import { useState } from 'react';
import {
  User, Ruler, Weight, Calendar, Sprout, Zap, Flame,
  Dumbbell, TrendingUp, Wind, Target, Sparkles,
  ChevronRight, ChevronLeft, Rocket, Mars, Venus, CircleDot,
  CheckCircle2, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useProfile, useSaveProfile } from '../../hooks/queries';
import type { SplitKey } from '../../helpers/splits';
import { SPLITS, SPLIT_KEYS, getWeekSchedule } from '../../helpers/splits';
import type { ProfileData } from '../../types';
import './ProfileSetupPage.css';

const SEX_OPTIONS = [
  { label: 'Male',   Icon: Mars },
  { label: 'Female', Icon: Venus },
  { label: 'Other',  Icon: CircleDot },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Beginner',     Icon: Sprout, desc: 'Less than 1 year' },
  { label: 'Intermediate', Icon: Zap,    desc: '1–3 years' },
  { label: 'Advanced',     Icon: Flame,  desc: '3+ years' },
];

const GOAL_OPTIONS = [
  { label: 'Hypertrophy',    Icon: Dumbbell,   desc: 'Build muscle size' },
  { label: 'Strength',       Icon: TrendingUp, desc: 'Increase max lifts' },
  { label: 'Endurance',      Icon: Wind,       desc: 'Boost stamina' },
  { label: 'Weight Loss',    Icon: Target,     desc: 'Burn fat' },
  { label: 'General Fitness',Icon: Sparkles,   desc: 'Stay healthy' },
];

const STEPS = [
  { label: 'About You',   Icon: User },
  { label: 'Experience',  Icon: Zap },
  { label: 'Goals',       Icon: Target },
  { label: 'Split',       Icon: LayoutGrid },
];

export function ProfileSetupPage() {
  const { data: existing } = useProfile();
  const saveProfileMutation = useSaveProfile();
  const saving = saveProfileMutation.isPending;
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [heightCm, setHeightCm] = useState(existing?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? '');
  const [sex, setSex] = useState(existing?.sex ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth ?? '');
  const [experienceLevel, setExperienceLevel] = useState(existing?.experienceLevel ?? 'intermediate');
  const [trainingGoal, setTrainingGoal] = useState(existing?.trainingGoal ?? 'hypertrophy');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(existing?.trainingDaysPerWeek ?? 4);
  const [selectedSplit, setSelectedSplit] = useState<SplitKey>((existing?.selectedSplit as SplitKey) ?? 'ppl');
  const [error, setError] = useState('');

  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  const validateStep = () => {
    if (step === 0 && (!heightCm || !weightKg || !sex)) {
      setError('Please fill in all fields.');
      return false;
    }
    if (step === 3) {
      const supported = Object.keys(SPLITS[selectedSplit].daysMap).map(Number);
      if (!supported.includes(trainingDaysPerWeek)) {
        setError(`${SPLITS[selectedSplit].label} doesn't support ${trainingDaysPerWeek} days. Pick a compatible split.`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = () => {
    const profileData: ProfileData = {
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      sex: sex.toLowerCase(),
      dateOfBirth: dateOfBirth ?? '',
      experienceLevel: experienceLevel.toLowerCase(),
      trainingGoal: trainingGoal.toLowerCase().replace(/ /g, '_'),
      trainingDaysPerWeek,
      selectedSplit,
      splitRotationIndex: existing?.splitRotationIndex ?? 0,
    };
    saveProfileMutation.mutate(profileData);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="ps">
      {/* Hero header */}
      <div className="ps__hero">
        <div className="ps__hero-blob" />
        <div className="ps__hero-content">
          <div className="ps__avatar"><Dumbbell size={32} strokeWidth={1.8} /></div>
          <h1 className="ps__greeting">Hey, {firstName}!</h1>
          <p className="ps__subheading">Let's build your training profile</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="ps__progress-wrap">
        <div className="ps__progress-bar">
          <div className="ps__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ps__steps">
          {STEPS.map(({ label, Icon }, i) => (
            <div key={label} className={`ps__step ${i === step ? 'ps__step--active' : ''} ${i < step ? 'ps__step--done' : ''}`}>
              <div className="ps__step-bubble">
                {i < step ? <CheckCircle2 size={14} /> : <Icon size={14} />}
              </div>
              <span className="ps__step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="ps__card">

        {/* ── Step 0: About You ── */}
        {step === 0 && (
          <div className="ps__section">
            <div className="ps__section-header">
              <div>
                <h2 className="ps__section-title">About You</h2>
                <p className="ps__section-sub">Give us a few details — we’ll take it from there</p>
              </div>
            </div>

            <div className="ps__field">
              <label className="ps__label">Sex</label>
              <div className="ps__chip-group">
                {SEX_OPTIONS.map(({ label, Icon }) => (
                  <button
                    key={label}
                    className={`ps__chip ${sex.toLowerCase() === label.toLowerCase() ? 'ps__chip--active' : ''}`}
                    onClick={() => setSex(label)}
                  >
                    <Icon size={16} className="ps__chip-icon" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps__row">
              <div className="ps__field">
                <label className="ps__label">Height (cm)</label>
                <div className="ps__input-wrap">
                  <Ruler size={16} className="ps__input-icon" />
                  <input type="number" className="ps__input ps__input--icon" placeholder="175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                </div>
              </div>
              <div className="ps__field">
                <label className="ps__label">Weight (kg)</label>
                <div className="ps__input-wrap">
                  <Weight size={16} className="ps__input-icon" />
                  <input type="number" className="ps__input ps__input--icon" placeholder="80" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="ps__field">
              <label className="ps__label">Date of Birth</label>
              <div className="ps__input-wrap">
                <Calendar size={16} className="ps__input-icon" />
                <input type="date" className="ps__input ps__input--icon" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Experience ── */}
        {step === 1 && (
          <div className="ps__section">
            <div className="ps__section-header">
              <div>
                <h2 className="ps__section-title">Experience Level</h2>
                <p className="ps__section-sub">How long have you been lifting?</p>
              </div>
            </div>
            <div className="ps__card-grid">
              {EXPERIENCE_OPTIONS.map(({ label, Icon, desc }) => (
                <button
                  key={label}
                  className={`ps__select-card ${experienceLevel.toLowerCase() === label.toLowerCase() ? 'ps__select-card--active' : ''}`}
                  onClick={() => setExperienceLevel(label)}
                >
                  <div className="ps__select-card-icon-wrap">
                    <Icon size={24} />
                  </div>
                  <span className="ps__select-card-label">{label}</span>
                  <span className="ps__select-card-desc">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Goals ── */}
        {step === 2 && (
          <div className="ps__section">
            <div className="ps__section-header">
              <div>
                <h2 className="ps__section-title">Training Goal</h2>
                <p className="ps__section-sub">Pick what you're training for</p>
              </div>
            </div>
            <div className="ps__card-grid ps__card-grid--goals">
              {GOAL_OPTIONS.map(({ label, Icon, desc }) => {
                const val = label.toLowerCase().replace(' ', '_');
                return (
                  <button
                    key={label}
                    className={`ps__select-card ${trainingGoal.toLowerCase() === val || trainingGoal.toLowerCase() === label.toLowerCase() ? 'ps__select-card--active' : ''}`}
                    onClick={() => setTrainingGoal(label)}
                  >
                    <div className="ps__select-card-icon-wrap">
                      <Icon size={22} />
                    </div>
                    <span className="ps__select-card-label">{label}</span>
                    <span className="ps__select-card-desc">{desc}</span>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ── Step 3: Training Split ── */}
        {step === 3 && (
          <div className="ps__section">
            <div className="ps__section-header">
              <div>
                <h2 className="ps__section-title">Training Split</h2>
              </div>
            </div>

            <div className="ps__field">
              <label className="ps__label">Days per week</label>
              <div className="ps__chip-group">
                {[2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    className={`ps__chip ps__chip--day ${trainingDaysPerWeek === d ? 'ps__chip--active' : ''}`}
                    onClick={() => {
                      setTrainingDaysPerWeek(d);
                      // Auto-select first compatible split if current one doesn't support this day count
                      const compatible = SPLIT_KEYS.filter((k) =>
                        Object.keys(SPLITS[k].daysMap).map(Number).includes(d)
                      );
                      if (!compatible.includes(selectedSplit) && compatible.length > 0) {
                        setSelectedSplit(compatible[0]);
                      }
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps__field">
              <label className="ps__label">Choose your split</label>
              <div className="ps__split-list">
                {SPLIT_KEYS.filter((key) =>
                  Object.keys(SPLITS[key].daysMap).map(Number).includes(trainingDaysPerWeek)
                ).map((key) => {
                  const split = SPLITS[key];
                  const supported = Object.keys(split.daysMap).map(Number).sort((a, b) => a - b);
                  return (
                    <button
                      key={key}
                      className={`ps__split-card ${selectedSplit === key ? 'ps__split-card--active' : ''}`}
                      onClick={() => setSelectedSplit(key)}
                    >
                      <div className="ps__split-card-info">
                        <span className="ps__split-card-label">{split.label}</span>
                        <span className="ps__split-card-desc">{split.description}</span>
                      </div>
                      {selectedSplit === key && <CheckCircle2 size={18} className="ps__split-card-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Week preview */}
            <div className="ps__field">
              <label className="ps__label">Your week</label>
              <div className="ps__week-preview">
                {getWeekSchedule(selectedSplit, trainingDaysPerWeek).map((day, i) => (
                  <div key={i} className="ps__week-day" style={{ borderLeftColor: day.color }}>
                    <span className="ps__week-day-num">Day {i + 1}</span>
                    <span className="ps__week-day-label">{day.label}</span>
                    <span className="ps__week-day-focus">{day.focus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="ps__error">⚠️ {error}</p>
        )}

        {/* Navigation */}
        <div className="ps__nav">
          {step > 0 && (
            <button className="ps__btn-back" onClick={back}>
              <ChevronLeft size={18} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="ps__btn-next" onClick={next}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="ps__btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="ps__spinner" /> : <><Rocket size={18} /> Start Training</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
