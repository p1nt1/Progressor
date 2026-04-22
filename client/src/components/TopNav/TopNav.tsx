import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.tsx';
import './TopNav.css';

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="topnav">
      <span className="topnav__logo" onClick={() => navigate('/')}>
        <span className="topnav__logo-icon">🏋️</span>
        Progressor
      </span>
      <div className="topnav__actions">
        <button className="topnav__theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

      </div>
    </nav>
  );
}
