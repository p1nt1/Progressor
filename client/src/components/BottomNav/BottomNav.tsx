import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks.ts';
import './BottomNav.css';

const NAV_ITEMS = [
  { path: '/',        icon: '🏠', label: 'Home' },
  { path: '/workout', icon: '➕', label: 'Create' },
  { path: '/history', icon: '📋', label: 'History' },
  { path: '/profile', icon: null, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        const isProfile = item.path === '/profile';

        const iconContent = isProfile ? (
          user?.picture ? (
            <img
              className={`bottom-nav__avatar-img ${isActive ? 'bottom-nav__avatar-img--active' : ''}`}
              src={user.picture}
              alt={user.name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="bottom-nav__avatar-placeholder">{initials}</span>
          )
        ) : (
          <span className="bottom-nav__icon">{item.icon}</span>
        );

        return (
          <button
            key={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {iconContent}
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

