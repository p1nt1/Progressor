import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';
import { Home, PlusCircle, ClipboardList } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
  { path: '/',        icon: Home,          label: 'Home' },
  { path: '/workout', icon: PlusCircle,    label: 'Create' },
  { path: '/history', icon: ClipboardList, label: 'History' },
  { path: '/profile', icon: null,          label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
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
              alt={user.displayName ?? ''}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="bottom-nav__avatar-placeholder">{initials}</span>
          )
        ) : (
          item.icon && <item.icon size={20} className="bottom-nav__icon" />
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
