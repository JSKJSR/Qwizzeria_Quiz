import { useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/DashboardLayout.css';

const NavIcon = ({ d, ...props }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d={d} />
  </svg>
);

const NAV_ICONS = {
  home: <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  play: <NavIcon d="M5 3l14 9-14 9V3z" />,
  host: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" /></svg>,
  packs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  trophy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  guide: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

const NAV_ITEMS = [
  { to: '/dashboard', icon: NAV_ICONS.home, label: 'Home' },
  { to: '/profile', icon: NAV_ICONS.profile, label: 'Profile' },
  { to: '/play/free', icon: NAV_ICONS.play, label: 'Surprise Me!' },
  { to: '/host', icon: NAV_ICONS.host, label: 'Host Quiz' },
  { to: '/packs', icon: NAV_ICONS.packs, label: 'Browse Packs' },
  { to: '/history', icon: NAV_ICONS.history, label: 'History' },
  { to: '/leaderboard', icon: NAV_ICONS.trophy, label: 'Leaderboard' },
  { to: '/guide', icon: NAV_ICONS.guide, label: 'How to Play' },
];

const ADMIN_NAV_ITEM = { to: '/admin', icon: NAV_ICONS.admin, label: 'Admin Panel' };

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
        <button className="dashboard__hamburger" onClick={handleToggleSidebar} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
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
        role="button"
        tabIndex={-1}
        aria-label="Close sidebar"
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
