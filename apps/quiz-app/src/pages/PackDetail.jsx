import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchPublicPackById } from '@qwizzeria/supabase-client/src/packs.js';
import LoginModal from '../components/LoginModal';
import '../styles/PackDetail.css';

export default function PackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const isPremiumUser = user?.app_metadata?.is_premium === true;

  useEffect(() => {
    setLoading(true);
    fetchPublicPackById(id)
      .then(setPack)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
        <div className="pack-detail__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="pack-detail__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <button className="pack-detail__back-btn" onClick={() => navigate('/packs')}>
            Back to Packs
          </button>
        </div>
        <div className="pack-detail__error">
          <p>{error || 'Pack not found.'}</p>
        </div>
      </div>
    );
  }

  const showPremiumGate = pack.is_premium && !isPremiumUser;

  return (
    <div className="pack-detail">
      <div className="pack-detail__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="pack-detail__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <button className="pack-detail__back-btn" onClick={() => navigate('/packs')}>
          Back to Packs
        </button>
      </div>

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

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
