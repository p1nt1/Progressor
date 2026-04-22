import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAppSelector } from './store/hooks';
import { useBootstrap, useProfile } from './hooks/queries';
import { LoginPage } from './pages/Login/LoginPage.tsx';
import { ProfileSetupPage } from './pages/ProfileSetup/ProfileSetupPage.tsx';
import { TopNav } from './components/TopNav/TopNav.tsx';
import { BottomNav } from './components/BottomNav/BottomNav.tsx';
import { ProfilePage } from './pages/Profile/ProfilePage.tsx';
import { CreateWorkout } from './pages/CreateWorkout/CreateWorkout.tsx';
import { HistoryPage } from './pages/History/HistoryPage.tsx';
import { ActiveWorkoutPage } from './pages/ActiveWorkout/ActiveWorkoutPage.tsx';
import { HomePage } from './pages/Homepage/HomePage.tsx';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { activePlan } = useAppSelector((s) => s.workout);
  const wasAuthenticated = useRef(isAuthenticated);

  // Single bootstrap request fetches all initial data and seeds the React Query cache.
  // useProfile (and other queries) will read from that cache without extra network calls.
  const { isLoading: bootstrapLoading, isFetched: bootstrapFetched } = useBootstrap(isAuthenticated);
  const { data: profile } = useProfile(bootstrapFetched);
  const profileLoading = bootstrapLoading;
  const profileFetched = bootstrapFetched;
  const setupComplete = profileFetched && profile !== null && profile !== undefined;

  useEffect(() => {
    if (!wasAuthenticated.current && isAuthenticated) {
      navigate('/', { replace: true });
    }
    if (wasAuthenticated.current && !isAuthenticated) {
      navigate('/', { replace: true });
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, navigate]);

  if (isLoading) return <div className="app-layout__loading">Loading...</div>;
  if (!isAuthenticated) return <LoginPage />;
  if (profileLoading || !profileFetched) return <div className="app-layout__loading">Loading profile...</div>;
  if (!setupComplete) return <ProfileSetupPage />;

  if (activePlan) {
    return (
      <div className="app-layout">
        <TopNav />
        <main className="app-layout__content">
          <ActiveWorkoutPage />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <TopNav />
      <main className="app-layout__content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout" element={<CreateWorkout />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
