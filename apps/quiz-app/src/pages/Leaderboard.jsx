import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchGlobalLeaderboard } from '@qwizzeria/supabase-client/src/leaderboard.js';
import '../styles/Leaderboard.css';

const TIME_FILTERS = [
  { key: 'all_time', label: 'All Time' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_week', label: 'This Week' },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [timeFilter, setTimeFilter] = useState('all_time');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchGlobalLeaderboard(timeFilter, 50)
      .then((data) => {
        if (!cancelled) {
          setEntries(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [timeFilter]);

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
      <div className="leaderboard__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="leaderboard__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <button className="leaderboard__back-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>

      <h1 className="leaderboard__title">Leaderboard</h1>

      <div className="leaderboard__tabs">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`leaderboard__tab ${timeFilter === f.key ? 'leaderboard__tab--active' : ''}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="leaderboard__loading">
          <div className="leaderboard__spinner" />
          <p>Loading leaderboard...</p>
        </div>
      ) : entries.length === 0 ? (
        <p className="leaderboard__empty">
          No leaderboard data yet. Play some quizzes to appear here!
        </p>
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
