export default function UserKpis({ kpis, loading }) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__header">
          <div className="stat-card__icon stat-card__icon--users">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="stat-card__label">Total Users</span>
        </div>
        <div className="stat-card__value">
          {loading ? '...' : (kpis?.total_users ?? 0)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card__header">
          <div className="stat-card__icon stat-card__icon--active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="stat-card__label">Active (24h)</span>
        </div>
        <div className="stat-card__value">
          {loading ? '...' : (kpis?.active_24h ?? 0)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card__header">
          <div className="stat-card__icon stat-card__icon--premium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="stat-card__label">Subscribers</span>
        </div>
        <div className="stat-card__value">
          {loading ? '...' : (kpis?.premium_count ?? 0)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card__header">
          <div className="stat-card__icon stat-card__icon--tournament">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <span className="stat-card__label">Tournament %</span>
        </div>
        <div className="stat-card__value">
          {loading ? '...' : `${kpis?.tournament_participation_pct ?? 0}%`}
        </div>
      </div>
    </div>
  );
}
