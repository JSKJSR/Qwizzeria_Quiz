import { useState, useEffect } from 'react';
import { fetchDailyMissions, MISSION_DEFINITIONS } from '@qwizzeria/supabase-client';
import '../styles/DailyMissions.css';

export default function DailyMissions({ userId }) {
  const [missions, setMissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchDailyMissions(userId)
      .then(data => { if (!cancelled) setMissions(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="daily-missions">
        <h3 className="daily-missions__title">Daily Missions</h3>
        <div className="daily-missions__skeleton">
          <div className="skeleton skeleton--row" />
          <div className="skeleton skeleton--row" />
          <div className="skeleton skeleton--row" />
        </div>
      </div>
    );
  }

  if (error || !missions || missions.length === 0) return null;

  const completedCount = missions.filter(m => m.completed_at).length;
  const earnedXP = missions.filter(m => m.completed_at).reduce((sum, m) => sum + m.xp_reward, 0);

  return (
    <div className="daily-missions">
      <div className="daily-missions__header">
        <h3 className="daily-missions__title">Daily Missions</h3>
        <span className="daily-missions__counter">{completedCount}/{missions.length}</span>
      </div>

      <div className="daily-missions__list">
        {missions.map(m => {
          const isComplete = !!m.completed_at;
          const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
          const def = MISSION_DEFINITIONS[m.mission_key];

          return (
            <div
              key={m.mission_key}
              className={`daily-missions__item ${isComplete ? 'daily-missions__item--complete' : ''}`}
            >
              <div className="daily-missions__item-top">
                <span className="daily-missions__label">
                  {isComplete && <span className="daily-missions__check" aria-label="Completed">&#10003;</span>}
                  {def?.label || m.mission_key}
                </span>
                <span className="daily-missions__xp">+{m.xp_reward} XP</span>
              </div>
              <div className="daily-missions__bar">
                <div
                  className="daily-missions__bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="daily-missions__progress-text">
                {m.progress}/{m.target}
              </span>
            </div>
          );
        })}
      </div>

      {completedCount === missions.length && (
        <div className="daily-missions__all-done">
          All missions complete! +{earnedXP} XP earned today
        </div>
      )}
    </div>
  );
}
