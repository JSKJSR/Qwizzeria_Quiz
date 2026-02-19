import { useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/DashboardLayout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '\u2302', label: 'Home' },
  { to: '/play/free', icon: '\u25B6', label: 'Play Quiz' },
  { to: '/host', icon: '\uD83C\uDFAE', label: 'Host Quiz' },
  { to: '/packs', icon: '\u2B50', label: 'Browse Packs' },
  { to: '/profile', icon: '\uD83D\uDC64', label: 'Profile' },
  { to: '/history', icon: '\uD83D\uDCCB', label: 'History' },
  { to: '/leaderboard', icon: '\uD83C\uDFC6', label: 'Leaderboard' },
];

const ADMIN_NAV_ITEM = { to: '/admin', icon: '\u2699', label: 'Admin Panel' };

export default function DashboardLayout() {
  const { user, role, isPremium, isEditor, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  function isActive(to) {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  }

  return (
    <div className="dashboard">
      {/* Mobile header */}
      <div className="dashboard__mobile-header">
        <button className="dashboard__hamburger" onClick={handleToggleSidebar}>
          &#9776;
        </button>
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="dashboard__mobile-logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
      </div>

      {/* Mobile overlay */}
      <div
        className={`dashboard__overlay ${sidebarOpen ? 'dashboard__overlay--visible' : ''}`}
        onClick={handleCloseSidebar}
      />

      {/* Sidebar */}
      <aside className={`dashboard__sidebar ${sidebarOpen ? 'dashboard__sidebar--open' : ''}`}>
        <div className="dashboard__sidebar-header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="dashboard__sidebar-logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
        </div>

        <nav className="dashboard__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`dashboard__nav-link ${isActive(item.to) ? 'dashboard__nav-link--active' : ''}`}
              onClick={handleCloseSidebar}
            >
              <span className="dashboard__nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isEditor && (
            <NavLink
              to={ADMIN_NAV_ITEM.to}
              className={`dashboard__nav-link ${isActive(ADMIN_NAV_ITEM.to) ? 'dashboard__nav-link--active' : ''}`}
              onClick={handleCloseSidebar}
            >
              <span className="dashboard__nav-icon">{ADMIN_NAV_ITEM.icon}</span>
              {ADMIN_NAV_ITEM.label}
            </NavLink>
          )}
        </nav>

        <div className="dashboard__sidebar-footer">
          <div className="dashboard__user-section">
            <span className="dashboard__user-email">{user?.email || 'User'}</span>
            {isEditor ? (
              <span className={`dashboard__user-badge dashboard__user-badge--premium`}>
                {role}
              </span>
            ) : (
              <span className={`dashboard__user-badge dashboard__user-badge--${isPremium ? 'premium' : 'free'}`}>
                {isPremium ? 'Premium' : 'Free'}
              </span>
            )}
            <div className="dashboard__footer-links">
              <NavLink to="/profile" className="dashboard__footer-link" onClick={handleCloseSidebar}>
                Account
              </NavLink>
              <button className="dashboard__signout-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard__content">
        <Outlet />
      </main>
    </div>
  );
}
