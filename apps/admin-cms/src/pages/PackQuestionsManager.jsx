import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchPackById,
  fetchPackQuestions,
  addQuestionToPack,
  removeQuestionFromPack,
  updatePackQuestionOrder,
} from '@qwizzeria/supabase-client/src/packs.js';
import { fetchAllQuestions, fetchCategories } from '@qwizzeria/supabase-client/src/questions.js';

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

  // Browse all questions — loads on mount and when filters/page change
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
    // loadBrowseQuestions will re-run via useEffect due to browsePage change
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
    setBrowsePage(1);
  }, []);

  const handleAdd = async (questionId) => {
    try {
      const nextOrder = packQuestions.length;
      await addQuestionToPack(packId, questionId, nextOrder);
      // Reload pack questions
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
    return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: '#f44336' }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/packs')}>
          Back to Packs
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Questions: {pack?.title}</h1>
        <button className="btn btn-secondary" onClick={() => navigate(`/packs/${packId}/edit`)}>
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
            className="form-input"
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
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>Loading questions...</p>
        ) : availableQuestions.length === 0 && allQuestions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            No questions found. Try a different search or check the Questions page.
          </p>
        ) : (
          <>
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

            {browseTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={browsePage <= 1}
                  onClick={() => setBrowsePage(p => p - 1)}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
          <p style={{ color: 'var(--text-secondary)' }}>
            No questions in this pack yet. Use the list above to add questions.
          </p>
        ) : (
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
                        >
                          ↑
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={index === packQuestions.length - 1}
                          onClick={() => handleMoveDown(index)}
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(pq.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
