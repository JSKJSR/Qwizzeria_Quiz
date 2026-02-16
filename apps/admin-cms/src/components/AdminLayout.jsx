import { NavLink, Outlet } from 'react-router-dom';
import { getSupabase } from '@qwizzeria/supabase-client';

export default function AdminLayout({ user }) {
  const handleSignOut = () => {
    getSupabase().auth.signOut();
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Qwizzeria Admin</div>
        <nav className="admin-sidebar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/questions"
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Questions
          </NavLink>
          <NavLink
            to="/import"
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Bulk Import
          </NavLink>
          <NavLink
            to="/packs"
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
            }
          >
            Quiz Packs
          </NavLink>
        </nav>
        <div className="admin-sidebar__footer">
          <div>{user.email}</div>
          <button className="admin-sidebar__signout" onClick={handleSignOut}>
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
