import { useAppSelector } from '../../store/hooks.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleNav = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <span className="sidebar__title">Menu</span>
          <button className="sidebar__close" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.picture ? (
              <img src={user.picture} alt={user?.name} referrerPolicy="no-referrer" />
            ) : (
              <span className="sidebar__avatar-initials">{initials}</span>
            )}
          </div>
          <div>
            <div className="sidebar__user-name">{user?.name || 'User'}</div>
            <div className="sidebar__user-email">{user?.email}</div>
          </div>
        </div>

        <div className="sidebar__menu">
          <button className="sidebar__menu-item" onClick={() => handleNav('workout')}>
            <span className="sidebar__menu-item-icon">🏋️</span> Workouts
          </button>
          <button className="sidebar__menu-item" onClick={() => handleNav('history')}>
            <span className="sidebar__menu-item-icon">📋</span> History
          </button>
          <button className="sidebar__menu-item" onClick={() => handleNav('profile')}>
            <span className="sidebar__menu-item-icon">👤</span> Profile
          </button>
        </div>

        <div className="sidebar__footer">
          <button className="sidebar__menu-item sidebar__menu-item--danger" onClick={logout}>
            <span className="sidebar__menu-item-icon">🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

