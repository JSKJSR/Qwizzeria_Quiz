import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchGlobalLeaderboard } from '@qwizzeria/supabase-client/src/leaderboard.js';
import SEO from '../components/SEO';
import '../styles/Leaderboard.css';

const TIME_FILTERS = [
  { key: 'all_time', label: 'All Time' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_week', label: 'This Week' },
];

export default function Leaderboard() {
  const { user } = useAuth();

  const [timeFilter, setTimeFilter] = useState('all_time');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchGlobalLeaderboard(timeFilter, 50)
      .then((data) => {
        if (!cancelled) {
          setError(null);
          setEntries(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load leaderboard. Please try again.');
          setEntries([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [timeFilter, retryKey]);

  const handleFilterChange = useCallback((key) => {
    setLoading(true);
    setTimeFilter(key);
  }, []);

  function getRankClass(rank) {
    if (rank === 1) return 'leaderboard__rank--gold';
    if (rank === 2) return 'leaderboard__rank--silver';
    if (rank === 3) return 'leaderboard__rank--bronze';
    return '';
  }

  return (
    <div className="leaderboard">
      <SEO
        title="Leaderboard"
        description="See the top quiz players on Qwizzeria. Compete for the highest scores across all quizzes."
        path="/leaderboard"
      />
      <h1 className="leaderboard__title">Leaderboard</h1>

      <div className="leaderboard__tabs" role="tablist" aria-label="Time period filter">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={timeFilter === f.key}
            className={`leaderboard__tab ${timeFilter === f.key ? 'leaderboard__tab--active' : ''}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="leaderboard__error">
          <p>{error}</p>
          <button className="leaderboard__retry-btn" onClick={() => { setLoading(true); setRetryKey(k => k + 1); }}>Try Again</button>
        </div>
      ) : loading ? (
        <div className="leaderboard__skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--row" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="branded-empty">
          <img src="/qwizzeria-logo.png" alt="" className="branded-empty__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
          <p className="branded-empty__message">No leaderboard data yet.</p>
          <p className="branded-empty__hint">Play some quizzes to climb the ranks!</p>
        </div>
      ) : (
        <table className="leaderboard__table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Quizzes</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isCurrentUser = user?.id === entry.user_id;
              return (
                <tr
                  key={entry.user_id}
                  className={isCurrentUser ? 'leaderboard__row--current' : ''}
                >
                  <td className={`leaderboard__rank ${getRankClass(rank)}`}>
                    {rank}
                  </td>
                  <td className="leaderboard__name">
                    {entry.display_name || 'Anonymous'}
                    {isCurrentUser && ' (You)'}
                  </td>
                  <td className="leaderboard__score">{entry.total_score || 0}</td>
                  <td>{entry.quizzes_played || 0}</td>
                  <td>{entry.avg_accuracy != null ? `${Math.round(entry.avg_accuracy)}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
