import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchDailyMissions, MISSION_DEFINITIONS, isMissionLocked, getLockedTeaser } from '@qwizzeria/supabase-client';
import { tierSatisfies } from '../config/tiers';
import '../styles/DailyMissions.css';

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function MissionItem({ mission }) {
  const isComplete = !!mission.completed_at;
  const pct = mission.target > 0
    ? Math.min(100, Math.round((mission.progress / mission.target) * 100))
    : 0;
  const label = MISSION_DEFINITIONS[mission.mission_key]?.label || mission.mission_key;

  return (
    <div className={`daily-missions__item ${isComplete ? 'daily-missions__item--complete' : ''}`}>
      <div className="daily-missions__item-top">
        <span className="daily-missions__label">
          {isComplete && <span className="daily-missions__check" aria-label="Completed">&#10003;</span>}
          {label}
        </span>
        <span className="daily-missions__xp">+{mission.xp_reward} XP</span>
      </div>
      <div className="daily-missions__bar">
        <div className="daily-missions__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="daily-missions__progress-text">
        {mission.progress}/{mission.target}
      </span>
    </div>
  );
}

function LockedMissionItem({ mission }) {
  const label = MISSION_DEFINITIONS[mission.mission_key]?.label || mission.mission_key;

  return (
    <div className="daily-missions__item daily-missions__item--locked">
      <div className="daily-missions__item-top">
        <span className="daily-missions__label">
          <span className="daily-missions__lock" aria-hidden="true"><LockIcon /></span>
          {label}
        </span>
        <span className="daily-missions__xp daily-missions__xp--locked">+{mission.xp_reward} XP</span>
      </div>
      <Link to="/pricing" className="daily-missions__upgrade-link">
        Upgrade to unlock
      </Link>
    </div>
  );
}

function splitMissions(missions, currentTier) {
  if (!missions) return { unlocked: [], locked: [] };

  const unlocked = [];
  const locked = [];

  for (const m of missions) {
    if (isMissionLocked(m.mission_key, currentTier, tierSatisfies)) {
      locked.push({ ...m, is_locked: true });
    } else {
      unlocked.push(m);
    }
  }

  // Always show at least 1 locked teaser for free users
  if (currentTier === 'free' && locked.length === 0) {
    const teaser = getLockedTeaser();
    if (!unlocked.some(m => m.mission_key === teaser.mission_key)) {
      locked.push(teaser);
    }
  }

  return { unlocked, locked };
}

export default function DailyMissions({ userId, currentTier = 'free' }) {
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

  const { unlocked, locked } = useMemo(
    () => splitMissions(missions, currentTier),
    [missions, currentTier],
  );

  const { completedCount, earnedXP } = useMemo(() => {
    const completed = unlocked.filter(m => m.completed_at);
    return {
      completedCount: completed.length,
      earnedXP: completed.reduce((sum, m) => sum + m.xp_reward, 0),
    };
  }, [unlocked]);

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

  return (
    <div className="daily-missions">
      <div className="daily-missions__header">
        <h3 className="daily-missions__title">Daily Missions</h3>
        <span className="daily-missions__counter">{completedCount}/{unlocked.length}</span>
      </div>

      <div className="daily-missions__list">
        {unlocked.map(m => <MissionItem key={m.mission_key} mission={m} />)}
        {locked.map(m => <LockedMissionItem key={`locked-${m.mission_key}`} mission={m} />)}
      </div>

      {completedCount === unlocked.length && unlocked.length > 0 && (
        <div className="daily-missions__all-done">
          All missions complete! +{earnedXP} XP earned today
        </div>
      )}
    </div>
  );
}
