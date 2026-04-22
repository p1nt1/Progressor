import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAppDispatch} from '../../store/hooks';
import {setActivePlan} from '../../store/workoutSlice';
import {useTemplates, useDeleteTemplate} from '../../hooks/queries';
import {SplitWorkoutModal} from '../../components/SplitWorkoutModal/SplitWorkoutModal';
import {TemplatePreviewCard} from '../../components/TemplatePreviewCard/TemplatePreviewCard.tsx';
import {SummaryStats} from '../../components/SummaryStats';
import {HeroSection} from '../../components/HeroSection/HeroSection';
import {mapToActiveExercises} from '../../helpers/workout.helpers';
import type {WorkoutTemplate} from '../../types';
import {ClipboardList, Eye, Trash2} from 'lucide-react';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { data: templateList = [] } = useTemplates();
    const [quickOpen, setQuickOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
    const previewRef = useRef<HTMLElement>(null);
    const deleteTemplateMutation = useDeleteTemplate();

    useEffect(() => {
        if (selectedTemplate && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedTemplate]);

    const handleStartTemplate = (tpl: WorkoutTemplate) => {
        const exercises = mapToActiveExercises(tpl.exercises as any[]);
        dispatch(setActivePlan({name: tpl.name, type: tpl.type, exercises}));
        setSelectedTemplate(null);
        document.querySelector('.app-layout__content')?.scrollTo({ top: 0, behavior: 'instant' });
        navigate('/workout');
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        deleteTemplateMutation.mutate(id);
    };

    return (
        <div className="home">
            {/* ── Hero + AI Coach ── */}
            <HeroSection onStartWorkout={() => setQuickOpen(true)} />

            {/* My Workouts */}
            <section className="home__templates">
                <h3 className="home__templates-title"><ClipboardList size={16} /> My Workouts</h3>
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
                                    <Eye size={16} className="home__template-start" />
                                    <button className="home__template-delete" onClick={(e) => handleDeleteTemplate(e, tpl.id)}>
                                        <Trash2 size={15} />
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
            <SummaryStats />

            <SplitWorkoutModal open={quickOpen} onClose={() => setQuickOpen(false)}/>
        </div>
    );
}
