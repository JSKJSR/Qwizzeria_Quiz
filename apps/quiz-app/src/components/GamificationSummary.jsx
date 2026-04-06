import { BADGES } from '../utils/gamification';
import { MISSION_DEFINITIONS } from '@qwizzeria/supabase-client';
import '../styles/GamificationSummary.css';

/**
 * Shared gamification results display used by all quiz result screens.
 * @param {Object} data - from computeGamification()
 * @param {Array} [missionCompletions] - newly completed missions from syncGamificationToDB
 */
export default function GamificationSummary({ data, missionCompletions }) {
  if (!data) return null;

  return (
    <div className="gam-summary">
      <div className="gam-summary__xp-earned">+{data.sessionXP} XP</div>
      <div className="gam-summary__level-row">
        <span className="gam-summary__level-badge">Lv. {data.level}</span>
        <span className="gam-summary__level-title">{data.levelTitle}</span>
      </div>
      <div className="gam-summary__xp-bar">
        <div className="gam-summary__xp-fill" style={{ width: `${data.levelProgress.pct}%` }} />
      </div>
      <div className="gam-summary__xp-text">
        {data.levelProgress.current} / {data.levelProgress.needed || 'MAX'} XP to next level
      </div>
      {data.leveledUp && (
        <div className="gam-summary__level-up">Level Up!</div>
      )}
      {data.newBadges.length > 0 && (
        <div className="gam-summary__badges">
          <div className="gam-summary__badges-title">Badges Earned!</div>
          <div className="gam-summary__badge-tiles">
            {data.newBadges.map(key => {
              const badge = BADGES.find(b => b.key === key);
              return badge ? (
                <div key={key} className="gam-summary__badge-tile">
                  <span className="gam-summary__badge-icon">{badge.icon}</span>
                  <span className="gam-summary__badge-label">{badge.label}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
      {missionCompletions?.length > 0 && (
        <div className="gam-summary__missions">
          {missionCompletions.map(m => (
            <div key={m.mission_key} className="gam-summary__mission-complete">
              {MISSION_DEFINITIONS[m.mission_key]?.label || m.mission_key} +{m.xp_reward} XP
            </div>
          ))}
        </div>
      )}
      {data.streakFrozeUsed && (
        <div className="gam-summary__freeze-used">Streak freeze saved your streak!</div>
      )}
      {data.dailyStreak.count >= 2 && (
        <div className="gam-summary__streak">{data.dailyStreak.count} day streak</div>
      )}
    </div>
  );
}
