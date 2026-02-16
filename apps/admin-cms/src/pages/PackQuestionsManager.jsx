import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchPackById,
  fetchPackQuestions,
  addQuestionToPack,
  removeQuestionFromPack,
  updatePackQuestionOrder,
} from '@qwizzeria/supabase-client/src/packs.js';
import { fetchAllQuestions } from '@qwizzeria/supabase-client/src/questions.js';

export default function PackQuestionsManager() {
  const { id: packId } = useParams();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [packQuestions, setPackQuestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    loadPack();
  }, [loadPack]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const result = await fetchAllQuestions({ search: searchTerm, pageSize: 20 });
      // Filter out questions already in the pack
      const existingIds = new Set(packQuestions.map(pq => pq.question_id));
      setSearchResults(result.data.filter(q => !existingIds.has(q.id)));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (questionId) => {
    try {
      const nextOrder = packQuestions.length;
      await addQuestionToPack(packId, questionId, nextOrder);
      // Remove from search results
      setSearchResults(prev => prev.filter(q => q.id !== questionId));
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

      {/* Search to add questions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Add Questions</h3>
        <div className="filters-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Search questions to add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <table className="data-table" style={{ marginTop: '0.75rem' }}>
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((q) => (
                <tr key={q.id}>
                  <td className="truncate">{q.question_text}</td>
                  <td>{q.category || '—'}</td>
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
            </tbody>
          </table>
        )}
      </div>

      {/* Current pack questions */}
      <div>
        <h3 style={{ marginBottom: '0.75rem' }}>
          Pack Questions ({packQuestions.length})
        </h3>

        {packQuestions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No questions in this pack yet. Use the search above to add questions.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Category</th>
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
