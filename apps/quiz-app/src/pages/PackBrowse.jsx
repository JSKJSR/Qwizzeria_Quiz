import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { browsePublicPacks, fetchPackCategories } from '@qwizzeria/supabase-client/src/packs.js';
import SEO from '../components/SEO';
import '../styles/PackBrowse.css';

export default function PackBrowse() {
  const navigate = useNavigate();
  const { isPremium: isPremiumUser } = useAuth();
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackCategories().then(setCategories).catch(() => { });
  }, []);

  useEffect(() => {
    let cancelled = false;
    browsePublicPacks({ category: categoryFilter || undefined })
      .then((data) => { if (!cancelled) setPacks(data); })
      .catch(() => { if (!cancelled) setPacks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [categoryFilter]);

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
      />
      <h1 className="pack-browse__title">Quiz Packs</h1>

      <div className="pack-browse__filters">
        <select
          className="pack-browse__filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="pack-browse__loading">
          <div className="pack-browse__spinner" />
          <p>Loading packs...</p>
        </div>
      ) : packs.length === 0 ? (
        <div className="pack-browse__empty">
          <p>No quiz packs available yet. Check back soon!</p>
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
