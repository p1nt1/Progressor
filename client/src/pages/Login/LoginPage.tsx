import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { TrendingUp, Bot, Dumbbell } from 'lucide-react';
import './LoginPage.css';

const FEATURES = [
  { icon: TrendingUp, label: 'Track progress', color: 'green' },
  { icon: Bot,        label: 'AI coaching',    color: 'violet' },
];

export function LoginPage() {
  const { login, loginLocal, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password);
      } else {
        await loginLocal(username.trim(), password);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Animated background blobs */}
      <div className="login__blob login__blob--1" />
      <div className="login__blob login__blob--2" />
      <div className="login__blob login__blob--3" />

      <div className="login__card">
        {/* Logo */}
        <div className="login__logo">
          <Dumbbell size={40} className="login__logo-icon" />
        </div>

        {/* Heading */}
        <h1 className="login__title">Progressor</h1>
        <p className="login__subtitle">Your AI-powered strength coach</p>

        {/* Feature pills */}
        <div className="login__features">
          {FEATURES.map((f) => (
            <span key={f.label} className={`login__feature login__feature--${f.color}`}>
              <f.icon size={13} strokeWidth={2.2} />
              <span>{f.label}</span>
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="login__divider"><span>Get started</span></div>

        {/* Username / Password form */}
        <form className="login__form" onSubmit={handleSubmit}>
          <input
            className="login__input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="login__input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {error && <p className="login__error">{error}</p>}
          <button className="login__btn" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button className="login__toggle" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>

        {/* Divider */}
        <div className="login__divider"><span>or</span></div>

        {/* Google Sign in button */}
        <button className="login__btn login__btn--google" onClick={login}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="login__legal">By signing in you agree to train hard</p>
      </div>
    </div>
  );
}
