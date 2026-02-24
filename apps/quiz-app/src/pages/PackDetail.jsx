import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchPublicPackById } from '@qwizzeria/supabase-client/src/packs.js';
import { fetchPackLeaderboard } from '@qwizzeria/supabase-client/src/leaderboard.js';
import LoginModal from '../components/LoginModal';
import SEO from '../components/SEO';
import '../styles/PackDetail.css';
import '../styles/Leaderboard.css';

export default function PackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isPremium: isPremiumUser, loading: authLoading } = useAuth();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [packLb, setPackLb] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicPackById(id, { userRole: role })
      .then((data) => { if (!cancelled) setPack(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Also fetch pack leaderboard (non-critical)
    fetchPackLeaderboard(id, 10)
      .then((data) => { if (!cancelled) setPackLb(data); })
      .catch(() => { });

    return () => { cancelled = true; };
  }, [id, role]);

  if (loading || authLoading) {
    return (
      <div className="pack-detail">
        <div className="pack-detail__loading">
          <div className="pack-detail__spinner" />
          <p>Loading pack...</p>
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="pack-detail">
        <div className="pack-detail__error">
          <p>{error || 'Pack not found.'}</p>
          <button className="pack-detail__back-btn" onClick={() => navigate('/packs')}>
            Back to Packs
          </button>
        </div>
      </div>
    );
  }

  const showPremiumGate = pack.is_premium && !isPremiumUser;

  return (
    <div className="pack-detail">
      <SEO
        title={pack.title}
        description={pack.description || `Play the ${pack.title} quiz pack on Qwizzeria.`}
        path={`/packs/${id}`}
        noIndex
      />
      {pack.cover_image_url ? (
        <img
          className="pack-detail__cover"
          src={pack.cover_image_url}
          alt={pack.title}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="pack-detail__cover-placeholder">🧠</div>
      )}

      <div className="pack-detail__badges">
        {pack.is_premium && (
          <span className="pack-detail__badge pack-detail__badge--premium">Premium</span>
        )}
        {pack.category && (
          <span className="pack-detail__badge pack-detail__badge--category">{pack.category}</span>
        )}
      </div>

      <h1 className="pack-detail__title">{pack.title}</h1>

      {pack.description && (
        <p className="pack-detail__desc">{pack.description}</p>
      )}

      <div className="pack-detail__stats">
        <div className="pack-detail__stat">
          <div className="pack-detail__stat-value">{pack.question_count}</div>
          <div className="pack-detail__stat-label">Questions</div>
        </div>
        <div className="pack-detail__stat">
          <div className="pack-detail__stat-value">{pack.play_count}</div>
          <div className="pack-detail__stat-label">Plays</div>
        </div>
      </div>

      {showPremiumGate ? (
        <div className="pack-detail__premium-gate">
          <div className="pack-detail__premium-icon">🔒</div>
          <div className="pack-detail__premium-title">Premium Pack</div>
          <p className="pack-detail__premium-text">
            This pack is available to premium members. Become a patron to unlock all premium quiz packs!
          </p>
          <a
            href="https://patreon.com/Qwizzeria"
            target="_blank"
            rel="noopener noreferrer"
            className="pack-detail__premium-link"
          >
            Become a Patron
          </a>
          {!user && (
            <div className="pack-detail__premium-login">
              Already a patron?{' '}
              <button onClick={() => setShowLogin(true)}>Sign in</button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="pack-detail__start-btn"
          onClick={() => navigate(`/packs/${id}/play`)}
        >
          Start Quiz
        </button>
      )}

      {/* Pack Leaderboard */}
      {packLb.length > 0 && (
        <div className="pack-leaderboard">
          <h2 className="pack-leaderboard__title">Top Scores</h2>
          <table className="pack-leaderboard__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {packLb.map((entry, i) => {
                const isCurrentUser = user?.id === entry.user_id;
                return (
                  <tr
                    key={entry.user_id}
                    className={isCurrentUser ? 'pack-leaderboard__row--current' : ''}
                  >
                    <td>{i + 1}</td>
                    <td>
                      {entry.display_name || 'Anonymous'}
                      {isCurrentUser && ' (You)'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary, #be1332)' }}>
                      {entry.best_score ?? 0}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#999' }}>
                      {entry.best_date ? new Date(entry.best_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
