import { useState, useEffect, useCallback } from 'react';
import { fetchLeagueStandings, fetchUserLeague, LEAGUES, LEAGUE_ORDER } from '@qwizzeria/supabase-client';
import '../styles/LeagueStandings.css';

export default function LeagueStandings({ userId }) {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLeague, setUserLeague] = useState(null);

  // Fetch user's league first to set default tab
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchUserLeague(userId)
      .then(data => {
        if (cancelled) return;
        setUserLeague(data);
        setSelectedLeague(data?.league || 'bronze');
      })
      .catch(() => {
        if (!cancelled) setSelectedLeague('bronze');
      });

    return () => { cancelled = true; };
  }, [userId]);

  // Fetch standings when league tab changes
  useEffect(() => {
    if (!selectedLeague) return;
    let cancelled = false;

    fetchLeagueStandings(selectedLeague, 50)
      .then(data => {
        if (!cancelled) setStandings(data || []);
      })
      .catch(() => {
        if (!cancelled) setStandings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedLeague]);

  const handleSelectLeague = useCallback((league) => {
    setLoading(true);
    setSelectedLeague(league);
  }, []);

  return (
    <div className="league-standings">
      <h2 className="league-standings__title">Weekly League</h2>

      <div className="league-standings__tabs">
        {LEAGUE_ORDER.map(key => {
          const def = LEAGUES[key];
          const isActive = selectedLeague === key;
          const isUserLeague = userLeague?.league === key;
          return (
            <button
              key={key}
              className={`league-standings__tab ${isActive ? 'league-standings__tab--active' : ''}`}
              style={{ '--tab-color': def.color }}
              onClick={() => handleSelectLeague(key)}
            >
              {def.name}
              {isUserLeague && <span className="league-standings__you">You</span>}
            </button>
          );
        })}
      </div>

      <div className="league-standings__info">
        Top 20% promote &middot; Bottom 20% demote &middot; Resets Monday
      </div>

      {loading ? (
        <div className="league-standings__loading">Loading standings...</div>
      ) : standings.length === 0 ? (
        <div className="league-standings__empty">No players in this league yet this week.</div>
      ) : (
        <div className="league-standings__list">
          {standings.map((entry, i) => {
            const isMe = entry.user_id === userId;
            const rank = entry.rank || i + 1;
            return (
              <div
                key={entry.user_id}
                className={`league-standings__row ${isMe ? 'league-standings__row--me' : ''}`}
              >
                <span className="league-standings__rank">
                  {rank <= 3 ? ['', '1st', '2nd', '3rd'][rank] : `#${rank}`}
                </span>
                <span className="league-standings__name">
                  {entry.display_name || 'Anonymous'}
                  {isMe && <span className="league-standings__me-tag">You</span>}
                </span>
                <span className="league-standings__xp">{entry.weekly_xp} XP</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
