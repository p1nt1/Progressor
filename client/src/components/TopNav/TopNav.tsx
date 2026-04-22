import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.tsx';
import { Dumbbell, Sun, Moon } from 'lucide-react';
import './TopNav.css';

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <nav className="topnav">
      <span className="topnav__logo" onClick={() => navigate('/')}>
        <Dumbbell size={20} className="topnav__logo-icon" />
        Progressor
      </span>
      <div className="topnav__actions">
        <button
          className="topnav__theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={`topnav__theme-option ${!isDark ? 'topnav__theme-option--active' : ''}`}>
            <Sun size={14} />
          </span>
          <span className={`topnav__theme-option ${isDark ? 'topnav__theme-option--active' : ''}`}>
            <Moon size={14} />
          </span>
        </button>
      </div>
    </nav>
  );
}
