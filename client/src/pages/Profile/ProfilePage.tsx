import { useState } from 'react';
import { useAppSelector } from '../../store/hooks.ts';
import { useProfile, useSaveProfile, useWeeklySummary, useWorkoutStats } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth.tsx';
import type { ProfileData } from '../../types';
import './ProfilePage.css';

const SEX_OPTIONS = ['male', 'female', 'other'];
const EXPERIENCE_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const GOAL_OPTIONS = ['hypertrophy', 'strength', 'endurance', 'weight_loss', 'general_fitness'];

function goalLabel(g: string) {
  return (g || '').replace(/_/g, ' ');
}

export function ProfilePage() {
  const { data: profile } = useProfile();
  const saveProfileMutation = useSaveProfile();
  const saving = saveProfileMutation.isPending;
  const { data: weeklySummary, isLoading: weeklySummaryLoading } = useWeeklySummary();
  const { data: stats } = useWorkoutStats();
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ?? null,
    sex: profile?.sex || '',
    dateOfBirth: profile?.dateOfBirth || '',
    experienceLevel: profile?.experienceLevel || 'intermediate',
    trainingGoal: profile?.trainingGoal || 'hypertrophy',
    trainingDaysPerWeek: profile?.trainingDaysPerWeek || 4,
  });

  const handleSave = () => {
    saveProfileMutation.mutate(form);
    setEditing(false);
  };

  const age = profile?.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="profile-page">

      {/* User header */}
      <div className="profile-page__header">
        <div className="profile-page__header-avatar">
          {user?.picture
            ? <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
            : <span>{user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}</span>
          }
        </div>
        <div>
          <div className="profile-page__header-name">{user?.name || '—'}</div>
          <div className="profile-page__header-email">{user?.email || '—'}</div>
        </div>
      </div>

      {/* AI Weekly Summary */}
      <div className="profile-page__ai-card">
        <div className="profile-page__ai-header"><span>🤖</span> Weekly Coach Summary</div>
        {weeklySummaryLoading ? (
          <div className="profile-page__ai-loading"><span>Analyzing your week...</span></div>
        ) : (
          <div className="profile-page__ai-body">{weeklySummary || 'No data yet. Complete workouts to get insights!'}</div>
        )}
      </div>

      {/* Stats row */}
      <div className="profile-page__stats">
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">{stats?.totalWorkouts ?? '—'}</div>
          <div className="profile-page__stat-label">Workouts</div>
        </div>
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">
            {stats ? (stats.weekStreak > 0 ? `🔥 ${stats.weekStreak}` : '0') : '—'}
          </div>
          <div className="profile-page__stat-label">Wk Streak</div>
        </div>
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">{age ?? '—'}</div>
          <div className="profile-page__stat-label">Age</div>
        </div>
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">{profile?.heightCm ?? '—'}</div>
          <div className="profile-page__stat-label">Height cm</div>
        </div>
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">{profile?.weightKg ?? '—'}</div>
          <div className="profile-page__stat-label">Weight kg</div>
        </div>
        <div className="profile-page__stat">
          <div className="profile-page__stat-value">{profile?.trainingDaysPerWeek ?? '—'}</div>
          <div className="profile-page__stat-label">Days/wk</div>
        </div>
      </div>

      {/* 1RM Estimates */}
      {stats && stats.oneRMs.length > 0 && (
        <div className="profile-page__section">
          <div className="profile-page__section-title">Estimated 1RM — Top Lifts</div>
          <div className="profile-page__1rm-grid">
            {stats.oneRMs.map((lift) => (
              <div key={lift.exerciseId} className="profile-page__1rm-item">
                <div className="profile-page__1rm-value">{lift.estimated1RM} kg</div>
                <div className="profile-page__1rm-name">{lift.exerciseName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Info */}
      <div className="profile-page__section">
        <div className="profile-page__section-title">Personal Info</div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Sex</span>
          {editing ? (
            <select className="profile-page__edit-select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              {SEX_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : <span className="profile-page__field-value">{profile?.sex || '—'}</span>}
        </div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Date of Birth</span>
          {editing ? (
            <input type="date" className="profile-page__edit-input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          ) : <span className="profile-page__field-value">{profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '—'}</span>}
        </div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Height</span>
          {editing ? (
            <input type="number" className="profile-page__edit-input" value={form.heightCm ?? ''} onChange={(e) => setForm({ ...form, heightCm: parseFloat(e.target.value) || null })} />
          ) : <span className="profile-page__field-value">{profile?.heightCm ? `${profile.heightCm} cm` : '—'}</span>}
        </div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Weight</span>
          {editing ? (
            <input type="number" className="profile-page__edit-input" value={form.weightKg ?? ''} onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) || null })} />
          ) : <span className="profile-page__field-value">{profile?.weightKg ? `${profile.weightKg} kg` : '—'}</span>}
        </div>
      </div>

      {/* Training Preferences */}
      <div className="profile-page__section">
        <div className="profile-page__section-title">Training Preferences</div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Experience</span>
          {editing ? (
            <select className="profile-page__edit-select" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
              {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : <span className="profile-page__field-value">{profile?.experienceLevel || '—'}</span>}
        </div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Goal</span>
          {editing ? (
            <select className="profile-page__edit-select" value={form.trainingGoal} onChange={(e) => setForm({ ...form, trainingGoal: e.target.value })}>
              {GOAL_OPTIONS.map((o) => <option key={o} value={o}>{goalLabel(o)}</option>)}
            </select>
          ) : <span className="profile-page__field-value profile-page__goal-badge">{goalLabel(profile?.trainingGoal || '')}</span>}
        </div>
        <div className="profile-page__field">
          <span className="profile-page__field-label">Days / Week</span>
          {editing ? (
            <select className="profile-page__edit-select" value={form.trainingDaysPerWeek} onChange={(e) => setForm({ ...form, trainingDaysPerWeek: parseInt(e.target.value) })}>
              {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : <span className="profile-page__field-value">{profile?.trainingDaysPerWeek ?? '—'} days</span>}
        </div>
      </div>

      {/* Edit / Save buttons */}
      <div className="profile-page__actions">
        {editing ? (
          <>
            <button className="profile-page__edit-btn profile-page__edit-btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="profile-page__edit-btn profile-page__edit-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button className="profile-page__edit-btn profile-page__edit-btn--primary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        )}
      </div>

      {/* Logout */}
      <div className="profile-page__danger-zone">
        <button className="profile-page__logout-btn" onClick={logout}>Sign Out</button>
      </div>

    </div>
  );
}

