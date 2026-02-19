import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasMinRole } from '@qwizzeria/supabase-client/src/users.js';
import '../styles/AdminCms.css';

export default function AdminLayout() {
  const { user, role, signOut, isSuperadmin } = useAuth();
  const isFullAdmin = hasMinRole(role || 'user', 'admin');

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Qwizzeria Admin</div>
        <nav className="admin-sidebar__nav">
          {isFullAdmin && (
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
            >
              Dashboard
            </NavLink>
          )}
          <NavLink
            to="/admin/questions"
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Questions
          </NavLink>
          {isFullAdmin && (
            <NavLink
              to="/admin/import"
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
            >
              Bulk Import
            </NavLink>
          )}
          <NavLink
            to="/admin/packs"
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Quiz Packs
          </NavLink>
          {isSuperadmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
            >
              Users
            </NavLink>
          )}
          <NavLink
            to="/dashboard"
            className="admin-sidebar__link admin-sidebar__link--back"
          >
            &larr; Quiz App
          </NavLink>
        </nav>
        <div className="admin-sidebar__footer">
          <span style={{ wordBreak: 'break-all', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            {user?.email}
          </span>
          <span className={`badge badge--${role || 'user'}`} style={{ marginTop: '0.3rem' }}>
            {role || 'user'}
          </span>
          <button className="admin-sidebar__signout" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
