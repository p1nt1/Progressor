import {BarChart2} from 'lucide-react';
import {useWorkouts} from '../../hooks/queries';
import {StreakCard} from './StreakCard';
import {TotalSessionsCard} from './TotalSessionsCard';
import {AvgDurationCard} from './AvgDurationCard';
import {MonthlyConsistencyCard} from './MonthlyConsistencyCard';
import {OneRMCard} from './OneRMCard';
import './SummaryStats.css';

export function SummaryStats() {
    const {data: workouts = []} = useWorkouts();
    return (
        <section className="summary-stats">
            <h3 className="summary-stats__title"><BarChart2 size={16}/> Summary</h3>

            <div className="summary-stats__grid">
                <StreakCard workouts={workouts}/>
                <TotalSessionsCard workouts={workouts}/>
            </div>

            <div className="summary-stats__grid">
                <AvgDurationCard workouts={workouts}/>
            </div>

            <OneRMCard/>

            <MonthlyConsistencyCard workouts={workouts}/>
        </section>
    );
}
