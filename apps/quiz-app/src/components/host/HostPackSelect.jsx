import { useState, useEffect, useCallback } from 'react';
import { browseHostPacks, fetchPackCategories, fetchPackPlayQuestions } from '@qwizzeria/supabase-client/src/packs.js';
import { useAuth } from '../../hooks/useAuth';

export default function HostPackSelect({ onSelectPack }) {
  const { role } = useAuth();
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPack, setLoadingPack] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPackCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    browseHostPacks({ category: categoryFilter || undefined, userRole: role })
      .then((data) => {
        if (!cancelled) {
          setPacks(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPacks([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [categoryFilter, role]);

  const handleSelectPack = useCallback(async (pack) => {
    if (loadingPack) return;
    setLoadingPack(pack.id);
    try {
      const questions = await fetchPackPlayQuestions(pack.id);
      if (questions.length === 0) {
        setError('This pack has no questions.');
        setLoadingPack(null);
        return;
      }
      onSelectPack(pack, questions);
    } catch (err) {
      setError(`Failed to load pack: ${err.message}`);
    } finally {
      setLoadingPack(null);
    }
  }, [loadingPack, onSelectPack]);

  return (
    <div className="host-pack-select">
      <h1 className="host-pack-select__title">Select a Quiz Pack</h1>
      <p className="host-pack-select__subtitle">Choose a pack to host your quiz session</p>

      <div className="host-pack-select__filters">
        <select
          className="host-pack-select__filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="host-pack-select__error">{error}</div>
      )}

      {loading ? (
        <div className="host-pack-select__loading">
          <div className="host-pack-select__spinner" />
          <p>Loading packs...</p>
        </div>
      ) : packs.length === 0 ? (
        <p className="host-pack-select__empty">No packs available. Create some in the Admin CMS first.</p>
      ) : (
        <div className="host-pack-select__grid">
          {packs.map((pack) => (
            <button
              key={pack.id}
              className={`host-pack-select__card ${loadingPack === pack.id ? 'host-pack-select__card--loading' : ''}`}
              onClick={() => handleSelectPack(pack)}
              disabled={!!loadingPack}
            >
              <div className="host-pack-select__card-title">{pack.title}</div>
              {pack.category && (
                <span className="host-pack-select__card-category">{pack.category}</span>
              )}
              <div className="host-pack-select__card-meta">
                {pack.question_count} questions
              </div>
              {loadingPack === pack.id && (
                <div className="host-pack-select__card-overlay">Loading...</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
