import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchPublicPackById, fetchPackPlayQuestions } from '@qwizzeria/supabase-client/src/packs.js';
import PackPlayJeopardy from '../components/PackPlayJeopardy';
import PackPlaySequential from '../components/PackPlaySequential';
import SEO from '../components/SEO';
import '../styles/PackPlay.css';

export default function PackPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isPremium: isPremiumUser } = useAuth();

  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState(null); // 'jeopardy' | 'sequential'

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [packData, qs] = await Promise.all([
          fetchPublicPackById(id, { userRole: role }),
          fetchPackPlayQuestions(id),
        ]);

        // Premium gate check
        if (packData.is_premium && !isPremiumUser) {
          navigate(`/packs/${id}`, { replace: true });
          return;
        }

        setPack(packData);
        setQuestions(qs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, role, isPremiumUser, navigate]);

  if (loading) {
    return (
      <div className="pack-play">
        <div className="pack-play__loading">
          <div className="pack-play__spinner" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="pack-play">
        <div className="pack-play__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="pack-play__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <button className="pack-play__back-btn" onClick={() => navigate('/packs')}>
            Back to Packs
          </button>
        </div>
        <div className="pack-play__error">
          <h2>Oops!</h2>
          <p>{error || 'Pack not found.'}</p>
          <button
            className="pack-play__back-btn"
            onClick={() => navigate('/packs')}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-primary, #be1332)', borderRadius: '8px', color: '#fff' }}
          >
            Browse Packs
          </button>
        </div>
      </div>
    );
  }

  if (format === 'jeopardy') {
    return (
      <PackPlayJeopardy
        pack={pack}
        questions={questions}
        user={user}
      />
    );
  }

  if (format === 'sequential') {
    return (
      <PackPlaySequential
        pack={pack}
        questions={questions}
        user={user}
      />
    );
  }

  // Format selection screen
  return (
    <div className="pack-play">
      <SEO title="Play Quiz" path={`/packs/${id}/play`} noIndex />
      <div className="pack-play__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="pack-play__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <button className="pack-play__back-btn" onClick={() => navigate(`/packs/${id}`)}>
          Back to Pack
        </button>
      </div>

      <div className="pack-play__format-select">
        <h2 className="pack-play__format-title">{pack.title}</h2>
        <p className="pack-play__format-subtitle">Choose your play format</p>

        <div className="pack-play__format-cards">
          <div
            className="pack-play__format-card"
            onClick={() => setFormat('jeopardy')}
          >
            <div className="pack-play__format-icon">🏁</div>
            <div className="pack-play__format-name">Jeopardy Grid</div>
            <div className="pack-play__format-desc">
              Pick questions from a category grid with point values
            </div>
          </div>

          <div
            className="pack-play__format-card"
            onClick={() => setFormat('sequential')}
          >
            <div className="pack-play__format-icon">▶️</div>
            <div className="pack-play__format-name">Sequential</div>
            <div className="pack-play__format-desc">
              Answer questions one by one in order
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
