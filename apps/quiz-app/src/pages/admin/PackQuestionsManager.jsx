import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchPackById,
  fetchPackQuestions,
  addQuestionToPack,
  removeQuestionFromPack,
  updatePackQuestionOrder,
  fetchAllQuestions,
  fetchCategories,
} from '@qwizzeria/supabase-client';

export default function PackQuestionsManager() {
  const { id: packId } = useParams();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [packQuestions, setPackQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Browse all questions state
  const [allQuestions, setAllQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [browsePage, setBrowsePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);

  const browsePageSize = 20;

  const loadPack = useCallback(async () => {
    try {
      const [packData, questions] = await Promise.all([
        fetchPackById(packId),
        fetchPackQuestions(packId),
      ]);
      setPack(packData);
      setPackQuestions(questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [packId]);

  // Load categories once
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Load pack data
  useEffect(() => {
    loadPack();
  }, [loadPack]);

  // Browse all questions
  const loadBrowseQuestions = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const result = await fetchAllQuestions({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        page: browsePage,
        pageSize: browsePageSize,
      });
      setAllQuestions(result.data);
      setTotalCount(result.count);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setAllQuestions([]);
      setTotalCount(0);
    } finally {
      setBrowseLoading(false);
    }
  }, [searchTerm, categoryFilter, browsePage]);

  useEffect(() => {
    loadBrowseQuestions();
  }, [loadBrowseQuestions]);

  // Filter out questions already in the pack
  const existingIds = new Set(packQuestions.map(pq => pq.question_id));
  const availableQuestions = allQuestions.filter(q => !existingIds.has(q.id));

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault();
    setBrowsePage(1);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
    setBrowsePage(1);
  }, []);

  const handleAdd = async (questionId) => {
    try {
      const nextOrder = packQuestions.length;
      await addQuestionToPack(packId, questionId, nextOrder);
      const questions = await fetchPackQuestions(packId);
      setPackQuestions(questions);
    } catch (err) {
      alert(`Failed to add question: ${err.message}`);
    }
  };

  const handleRemove = async (packQuestionId) => {
    try {
      await removeQuestionFromPack(packQuestionId, packId);
      const questions = await fetchPackQuestions(packId);
      setPackQuestions(questions);
      setRemoveTarget(null);
    } catch (err) {
      alert(`Failed to remove question: ${err.message}`);
    }
  };

  const handleMoveUp = async (index) => {
    if (index <= 0) return;
    const newList = [...packQuestions];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    const updates = newList.map((pq, i) => ({ id: pq.id, sort_order: i }));
    setPackQuestions(newList);
    try {
      await updatePackQuestionOrder(updates);
    } catch (err) {
      console.error('Reorder failed:', err);
      loadPack();
    }
  };

  const handleMoveDown = async (index) => {
    if (index >= packQuestions.length - 1) return;
    const newList = [...packQuestions];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    const updates = newList.map((pq, i) => ({ id: pq.id, sort_order: i }));
    setPackQuestions(newList);
    try {
      await updatePackQuestionOrder(updates);
    } catch (err) {
      console.error('Reorder failed:', err);
      loadPack();
    }
  };

  const browseTotalPages = Math.ceil(totalCount / browsePageSize);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', padding: '3rem 0' }}>
        <div className="admin-spinner" />
        <span>Loading pack...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-error-banner">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/packs')}>
          Back to Packs
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/packs" className="admin-breadcrumb__link">Packs</Link>
        <span className="admin-breadcrumb__sep" aria-hidden="true">/</span>
        <Link to={`/admin/packs/${packId}/edit`} className="admin-breadcrumb__link">{pack?.title || 'Pack'}</Link>
        <span className="admin-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="admin-breadcrumb__current">Questions</span>
      </nav>

      <div className="page-header">
        <div className="page-header__title-group">
          <h1>Manage Questions</h1>
          <span className="page-header__subtitle">{pack?.title} &middot; {packQuestions.length} questions</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/admin/packs/${packId}/edit`)}>
          Back to Pack
        </button>
      </div>

      {/* Browse & add questions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Add Questions</h3>
        <form className="filters-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="form-input"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select"
            value={categoryFilter}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={browseLoading}
          >
            {browseLoading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {browseLoading ? (
          <div className="admin-table-skeleton" style={{ marginTop: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--row" />
            ))}
          </div>
        ) : availableQuestions.length === 0 && allQuestions.length === 0 ? (
          <div className="admin-empty admin-empty--compact">
            <p className="admin-empty__title">No questions found</p>
            <p className="admin-empty__hint">Try a different search or check the Questions page.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll">
            <table className="data-table" style={{ marginTop: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Category</th>
                  <th>Points</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {availableQuestions.map((q) => (
                  <tr key={q.id}>
                    <td className="truncate">{q.question_text}</td>
                    <td className="truncate" style={{ maxWidth: '200px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {q.answer_text}
                    </td>
                    <td>{q.category || '—'}</td>
                    <td>{q.points != null ? q.points : '—'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAdd(q.id)}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
                {availableQuestions.length === 0 && allQuestions.length > 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      All questions on this page are already in the pack.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {browseTotalPages > 1 && (
              <div className="pagination" style={{ marginTop: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={browsePage <= 1}
                  onClick={() => setBrowsePage(p => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {browsePage} of {browseTotalPages} ({totalCount} total)
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={browsePage >= browseTotalPages}
                  onClick={() => setBrowsePage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Current pack questions */}
      <div>
        <h3 style={{ marginBottom: '0.75rem' }}>
          Pack Questions ({packQuestions.length})
        </h3>

        {packQuestions.length === 0 ? (
          <div className="admin-empty admin-empty--compact">
            <p className="admin-empty__title">No questions yet</p>
            <p className="admin-empty__hint">Use the search above to add questions to this pack.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Category</th>
                <th>Points</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packQuestions.map((pq, index) => {
                const q = pq.questions_master;
                return (
                  <tr key={pq.id}>
                    <td>{index + 1}</td>
                    <td className="truncate">{q?.question_text || '—'}</td>
                    <td>{q?.category || '—'}</td>
                    <td>{q?.points != null ? q.points : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          title="Move up"
                          aria-label={`Move question ${index + 1} up`}
                        >
                          ↑
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={index === packQuestions.length - 1}
                          onClick={() => handleMoveDown(index)}
                          title="Move down"
                          aria-label={`Move question ${index + 1} down`}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setRemoveTarget(pq.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      {removeTarget && (
        <div className="confirm-overlay" onClick={() => setRemoveTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Question</h3>
            <p>Remove this question from the pack? The question itself won't be deleted.</p>
            <div className="confirm-dialog__actions">
              <button className="btn btn-secondary" onClick={() => setRemoveTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleRemove(removeTarget)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
