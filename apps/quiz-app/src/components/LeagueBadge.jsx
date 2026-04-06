import { useState, useEffect } from 'react';
import { fetchUserLeague, LEAGUES } from '@qwizzeria/supabase-client';
import '../styles/LeagueBadge.css';

export default function LeagueBadge({ userId }) {
  const [league, setLeague] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchUserLeague(userId)
      .then(data => { if (!cancelled) setLeague(data); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [userId]);

  if (!league) return null;

  const def = LEAGUES[league.league];
  if (!def) return null;

  return (
    <div className="league-badge" style={{ '--league-color': def.color }}>
      <div className="league-badge__shield">{def.name}</div>
      <div className="league-badge__xp">{league.weekly_xp} XP this week</div>
    </div>
  );
}
