import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {clearReview, setActivePlan} from '../../store/workoutSlice';
import {useWorkouts, useTemplates, useDeleteTemplate} from '../../hooks/queries';
import {useProfile} from '../../hooks/queries';
import {QuickWorkoutModal} from '../../components/QuickWorkoutModal/QuickWorkoutModal';
import {WorkoutReviewCard} from '../../components/WorkoutReviewCard/WorkoutReviewCard.tsx';
import {TemplatePreviewCard} from '../../components/TemplatePreviewCard/TemplatePreviewCard.tsx';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { data: workoutList = [] } = useWorkouts();
    const { data: templateList = [] } = useTemplates();
    const { data: profile } = useProfile();
    const user = useAppSelector((s) => s.auth.user);
    const {workoutReview, reviewLoading} = useAppSelector((s) => s.workout);
    const [quickOpen, setQuickOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [reviewDismissed, setReviewDismissed] = useState(false);
    const previewRef = useRef<HTMLElement>(null);
    const deleteTemplateMutation = useDeleteTemplate();

    useEffect(() => {
        if (selectedTemplate && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedTemplate]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const streak = (() => {
        if (!workoutList.length) return 0;
        const daySet = new Set(
            workoutList
                .filter((w) => w.completed_at)
                .map((w) => new Date(w.completed_at!).toDateString())
        );
        let count = 0;
        const d = new Date();
        while (daySet.has(d.toDateString())) {
            count++;
            d.setDate(d.getDate() - 1);
        }
        return count;
    })();

    const lastWorkout = workoutList.find((w) => w.completed_at);

    const weekWorkouts = (() => {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        return workoutList.filter((w) => w.completed_at && new Date(w.completed_at) >= monday);
    })();

    const trainingDaysPerWeek = profile?.trainingDaysPerWeek ?? 4;

    const handleStartTemplate = (tpl: any) => {
        const exercises = (tpl.exercises || []).map((ex: any, i: number) => ({
            exerciseName: ex.exerciseName,
            exerciseId: ex.exerciseId,
            order: ex.order ?? i + 1,
            sets: (ex.sets || []).map((s: any) => ({
                setNumber: s.setNumber,
                reps: s.reps,
                weightKg: s.weightKg,
                rpe: null,
                completed: false,
            })),
        }));
        dispatch(setActivePlan({name: tpl.name, type: tpl.type, exercises}));
        setSelectedTemplate(null);
        // Scroll the main content container to top before navigating
        document.querySelector('.app-layout__content')?.scrollTo({ top: 0, behavior: 'instant' });
        navigate('/workout');
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        deleteTemplateMutation.mutate(id);
    };

    return (
        <div className="home">
            {/* Greeting hero */}
            <section className="home__hero">
                <div className="home__hero-text">
                    <p className="home__hero-greeting">{greeting}</p>
                    <h1 className="home__hero-name">{user?.name?.split(' ')[0] ?? 'Champ'} 💪</h1>
                    <p className="home__hero-sub">
                        {weekWorkouts.length >= trainingDaysPerWeek
                            ? 'Week complete 🎉'
                            : `${trainingDaysPerWeek - weekWorkouts.length} workout${trainingDaysPerWeek - weekWorkouts.length !== 1 ? 's' : ''} left this week`}
                    </p>
                </div>

                {/* Weekly progress ring */}
                <div className="home__ring-wrap">
                    <svg className="home__ring" viewBox="0 0 64 64">
                        <circle className="home__ring-track" cx="32" cy="32" r="26" />
                        <circle
                            className="home__ring-fill"
                            cx="32" cy="32" r="26"
                            strokeDasharray={`${Math.min(weekWorkouts.length / trainingDaysPerWeek, 1) * 163.4} 163.4`}
                        />
                    </svg>
                    <div className="home__ring-label">
                        <span className="home__ring-count">{weekWorkouts.length}</span>
                        <span className="home__ring-total">of {trainingDaysPerWeek}</span>
                    </div>
                </div>
            </section>

            {/* Big CTA — Quick Workout opens modal */}
            <section className="home__cta" onClick={() => setQuickOpen(true)}>
                <span className="home__cta-icon">🔥</span>
                <div className="home__cta-content">
                    <h2 className="home__cta-title">Quick Workout</h2>
                    <p className="home__cta-sub">Start a new session · Add exercises</p>
                </div>
                <span className="home__cta-arrow">→</span>
            </section>

            {/* My Workouts */}
            <section className="home__templates">
                <h3 className="home__templates-title">📋 My Workouts</h3>
                {templateList.length === 0 ? (
                    <p className="home__templates-empty">No saved workouts yet. Create one from the Workout page!</p>
                ) : (
                    <div className="home__templates-list">
                        {templateList.map((tpl) => (
                            <div key={tpl.id} className="home__template-card" onClick={() => setSelectedTemplate(tpl)}>
                                <div className="home__template-info">
                                    <span className="home__template-name">{tpl.name}</span>
                                    <span className="home__template-meta">
                                        {tpl.type} · {(tpl.exercises || []).length} exercise{(tpl.exercises || []).length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="home__template-actions">
                                    <span className="home__template-start">👁</span>
                                    <button className="home__template-delete"
                                            onClick={(e) => handleDeleteTemplate(e, tpl.id)}>🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Template Preview */}
            {selectedTemplate && (
                <section ref={previewRef}>
                    <TemplatePreviewCard
                        template={selectedTemplate}
                        onStart={() => handleStartTemplate(selectedTemplate)}
                        onClose={() => setSelectedTemplate(null)}
                    />
                </section>
            )}

            {/* Summary */}
            <section className="home__summary">
                <h3 className="home__summary-title">📊 Summary</h3>
                <div className="home__summary-grid">
                    <div className="home__summary-card">
                        <span className="home__summary-value">{streak}</span>
                        <span className="home__summary-label">Day streak 🔥</span>
                    </div>
                    <div className="home__summary-card">
                        <span className="home__summary-value">{workoutList.filter(w => w.completed_at).length}</span>
                        <span className="home__summary-label">Total sessions</span>
                    </div>
                </div>
                {reviewLoading && (
                    <div className="workout-form__review-loading">🤖 Generating AI review...</div>
                )}

                {workoutReview && workoutList.some((w) => w.completed_at && w.type === workoutReview.type) && (
                    <WorkoutReviewCard review={workoutReview} onDismiss={() => dispatch(clearReview())}/>
                )}
                {lastWorkout && (
                    <div className="home__last-workout">
                        <span className="home__last-label">Last workout</span>
                        <span className="home__last-name">{lastWorkout.name}</span>
                        <span className="home__last-date">
              {new Date(lastWorkout.completed_at!).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
                    </div>
                )}
            </section>

            <QuickWorkoutModal open={quickOpen} onClose={() => setQuickOpen(false)}/>
        </div>
    );
}
