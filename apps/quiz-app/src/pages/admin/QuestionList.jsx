import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllQuestions,
  fetchCategories,
  deleteQuestion,
} from '@qwizzeria/supabase-client/src/questions.js';
import { CATEGORIES } from '../../utils/categoryData';

export default function QuestionList() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const pageSize = 20;
  const totalPages = Math.ceil(count / pageSize);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllQuestions({
        ...filters,
        category: filters.category || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        page,
        pageSize,
      });
      setQuestions(result.data);
      setCount(result.count);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    fetchCategories().then((dbCats) => {
      // Merge predefined categories with any extra DB categories
      const merged = [...CATEGORIES];
      for (const c of dbCats) {
        if (!merged.includes(c)) merged.push(c);
      }
      setCategories(merged);
    }).catch(() => {
      setCategories(CATEGORIES);
    });
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQuestion(deleteTarget);
      setDeleteTarget(null);
      loadQuestions();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Questions</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/questions/new')}>
          Add Question
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="form-input"
          placeholder="Search questions..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          className="form-select"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : questions.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No questions found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Points</th>
                <th>Status</th>
                <th>Public</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td
                    className="truncate"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                  >
                    {q.question_text}
                  </td>
                  <td>{q.category || '—'}</td>
                  <td>{q.points != null ? q.points : '—'}</td>
                  <td>
                    <span className={`badge badge--${q.status || 'active'}`}>
                      {q.status || 'active'}
                    </span>
                  </td>
                  <td>{q.is_public ? 'Yes' : 'No'}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {q.updated_at ? new Date(q.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(q.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Question</h3>
            <p>Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="confirm-dialog__actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
