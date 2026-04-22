import { useState } from 'react';
import { useAppSelector } from '../../store/hooks.ts';
import { useProfile, useSaveProfile } from '../../hooks/queries';
import type { ProfileData } from '../../types';
import './ProfileSetupPage.css';

const SEX_OPTIONS = [
  { label: 'Male', icon: '♂️' },
  { label: 'Female', icon: '♀️' },
  { label: 'Other', icon: '⚧' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Beginner', icon: '🌱', desc: 'Less than 1 year' },
  { label: 'Intermediate', icon: '⚡', desc: '1–3 years' },
  { label: 'Advanced', icon: '🔥', desc: '3+ years' },
];

const GOAL_OPTIONS = [
  { label: 'Hypertrophy', icon: '💪', desc: 'Build muscle size' },
  { label: 'Strength', icon: '🏋️', desc: 'Increase max lifts' },
  { label: 'Endurance', icon: '🏃', desc: 'Boost stamina' },
  { label: 'Weight Loss', icon: '🎯', desc: 'Burn fat' },
  { label: 'General Fitness', icon: '✨', desc: 'Stay healthy' },
];

const STEPS = ['About You', 'Experience', 'Goals'];

export function ProfileSetupPage() {
  const { data: existing } = useProfile();
  const saveProfileMutation = useSaveProfile();
  const saving = saveProfileMutation.isPending;
  const user = useAppSelector((s) => s.auth.user);

  const [step, setStep] = useState(0);
  const [heightCm, setHeightCm] = useState(existing?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? '');
  const [sex, setSex] = useState(existing?.sex ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth ?? '');
  const [experienceLevel, setExperienceLevel] = useState(existing?.experienceLevel ?? 'intermediate');
  const [trainingGoal, setTrainingGoal] = useState(existing?.trainingGoal ?? 'hypertrophy');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(existing?.trainingDaysPerWeek ?? 4);
  const [error, setError] = useState('');

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const validateStep = () => {
    if (step === 0 && (!heightCm || !weightKg || !sex)) {
      setError('Please fill in all fields.');
      return false;
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
      trainingGoal: trainingGoal.toLowerCase().replace(' ', '_'),
      trainingDaysPerWeek,
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
          <div className="ps__avatar">💪</div>
          <h1 className="ps__greeting">Hey, {firstName}!</h1>
          <p className="ps__subheading">Let's build your training profile</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ps__progress-wrap">
        <div className="ps__progress-bar">
          <div className="ps__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ps__steps">
          {STEPS.map((s, i) => (
            <span key={s} className={`ps__step-label ${i === step ? 'ps__step-label--active' : ''} ${i < step ? 'ps__step-label--done' : ''}`}>
              {i < step ? '✓' : i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="ps__card">

        {/* ── Step 0: About You ── */}
        {step === 0 && (
          <div className="ps__section">
            <h2 className="ps__section-title">About You</h2>

            <div className="ps__field">
              <label className="ps__label">Sex</label>
              <div className="ps__chip-group">
                {SEX_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    className={`ps__chip ${sex.toLowerCase() === o.label.toLowerCase() ? 'ps__chip--active' : ''}`}
                    onClick={() => setSex(o.label)}
                  >
                    <span className="ps__chip-icon">{o.icon}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps__row">
              <div className="ps__field">
                <label className="ps__label">Height (cm)</label>
                <input type="number" className="ps__input" placeholder="175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
              <div className="ps__field">
                <label className="ps__label">Weight (kg)</label>
                <input type="number" className="ps__input" placeholder="80" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
            </div>

            <div className="ps__field">
              <label className="ps__label">Date of Birth</label>
              <input type="date" className="ps__input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Step 1: Experience ── */}
        {step === 1 && (
          <div className="ps__section">
            <h2 className="ps__section-title">Experience Level</h2>
            <div className="ps__card-grid">
              {EXPERIENCE_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  className={`ps__select-card ${experienceLevel.toLowerCase() === o.label.toLowerCase() ? 'ps__select-card--active' : ''}`}
                  onClick={() => setExperienceLevel(o.label)}
                >
                  <span className="ps__select-card-icon">{o.icon}</span>
                  <span className="ps__select-card-label">{o.label}</span>
                  <span className="ps__select-card-desc">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Goals ── */}
        {step === 2 && (
          <div className="ps__section">
            <h2 className="ps__section-title">Training Goal</h2>
            <div className="ps__card-grid ps__card-grid--goals">
              {GOAL_OPTIONS.map((o) => {
                const val = o.label.toLowerCase().replace(' ', '_');
                return (
                  <button
                    key={o.label}
                    className={`ps__select-card ${trainingGoal.toLowerCase() === val || trainingGoal.toLowerCase() === o.label.toLowerCase() ? 'ps__select-card--active' : ''}`}
                    onClick={() => setTrainingGoal(o.label)}
                  >
                    <span className="ps__select-card-icon">{o.icon}</span>
                    <span className="ps__select-card-label">{o.label}</span>
                    <span className="ps__select-card-desc">{o.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="ps__field">
              <label className="ps__label">Days per week</label>
              <div className="ps__chip-group">
                {[2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    className={`ps__chip ${trainingDaysPerWeek === d ? 'ps__chip--active' : ''}`}
                    onClick={() => setTrainingDaysPerWeek(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="ps__error">{error}</p>}

        {/* Navigation */}
        <div className="ps__nav">
          {step > 0 && (
            <button className="ps__btn-back" onClick={back}>← Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="ps__btn-next" onClick={next}>Continue →</button>
          ) : (
            <button className="ps__btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving ? <span className="ps__spinner" /> : '🚀 Start Training'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
