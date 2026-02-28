import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { browsePublicPacks, fetchPackCategories } from '@qwizzeria/supabase-client/src/packs.js';
import SEO from '../components/SEO';
import '../styles/PackBrowse.css';

export default function PackBrowse() {
  const navigate = useNavigate();
  const { role, isPremium: isPremiumUser } = useAuth();
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    fetchPackCategories().then(setCategories).catch(() => { });
  }, []);

  useEffect(() => {
    let cancelled = false;
    browsePublicPacks({ category: categoryFilter || undefined, userRole: role })
      .then((data) => { if (!cancelled) { setError(null); setPacks(data); } })
      .catch(() => { if (!cancelled) { setPacks([]); setError('Failed to load quiz packs. Please try again.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [categoryFilter, role, retryKey]);

  const handleCardClick = (pack) => {
    if (pack.is_premium && !isPremiumUser) return;
    navigate(`/packs/${pack.id}`);
  };

  return (
    <div className="pack-browse">
      <SEO
        title="Quiz Packs"
        description="Browse curated quiz packs by category. Play Jeopardy-style grids or sequential quizzes with friends."
        path="/packs"
        keywords="quiz packs, trivia packs, curated quizzes, jeopardy packs, pub quiz packs"
      />
      <h1 className="pack-browse__title">Quiz Packs</h1>

      <div className="pack-browse__filters">
        <select
          className="pack-browse__filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="pack-browse__error">
          <p>{error}</p>
          <button className="pack-browse__retry-btn" onClick={() => { setLoading(true); setRetryKey(k => k + 1); }}>Try Again</button>
        </div>
      ) : loading ? (
        <div className="pack-browse__skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <div className="branded-empty">
          <img src="/qwizzeria-logo.png" alt="" className="branded-empty__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
          <p className="branded-empty__message">No quiz packs available yet.</p>
          <p className="branded-empty__hint">Check back soon — new packs are always brewing!</p>
        </div>
      ) : (
        <div className="pack-browse__grid">
          {packs.map((pack) => {
            const isLocked = pack.is_premium && !isPremiumUser;
            return (
              <div
                key={pack.id}
                className={`pack-browse__card ${isLocked ? 'pack-browse__card--locked' : ''}`}
                onClick={() => handleCardClick(pack)}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-label={`${pack.title}${isLocked ? ' (Premium locked)' : ''}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(pack); } }}
              >
                {pack.cover_image_url ? (
                  <img
                    className="pack-browse__card-image"
                    src={pack.cover_image_url}
                    alt={pack.title}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="pack-browse__card-image-placeholder">
                    {isLocked ? '🔒' : '🧠'}
                  </div>
                )}
                <div className="pack-browse__card-body">
                  <div className="pack-browse__card-badges">
                    {pack.is_host && (
                      <span className="pack-browse__badge pack-browse__badge--host">
                        Host
                      </span>
                    )}
                    {pack.is_premium && (
                      <span className="pack-browse__badge pack-browse__badge--premium">
                        {isLocked ? '🔒 ' : ''}Premium
                      </span>
                    )}
                    {pack.category && (
                      <span className="pack-browse__badge pack-browse__badge--category">
                        {pack.category}
                      </span>
                    )}
                  </div>
                  <div className="pack-browse__card-title">{pack.title}</div>
                  {pack.description && (
                    <div className="pack-browse__card-desc">{pack.description}</div>
                  )}
                  <div className="pack-browse__card-meta">
                    <span>{pack.question_count} questions</span>
                    <span>{pack.play_count} plays</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
