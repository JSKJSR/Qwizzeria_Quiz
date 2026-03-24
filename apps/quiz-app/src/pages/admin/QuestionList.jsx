import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllQuestions,
  fetchCategories,
  deleteQuestion,
} from '@qwizzeria/supabase-client';
import { CATEGORIES } from '@/utils/categoryData';

function exportQuestionsCSV(questions) {
  const headers = [
    'Question', 'Answer', 'Explanation', 'Category', 'Tags',
    'Points', 'Status', 'Public', 'Media URL', 'Updated',
  ];
  const rows = questions.map((q) => [
    q.question_text || '',
    q.answer_text || '',
    q.answer_explanation || '',
    q.category || '',
    Array.isArray(q.tags) ? q.tags.join('; ') : '',
    q.points != null ? q.points : '',
    q.status || '',
    q.is_public ? 'Yes' : 'No',
    q.media_url || '',
    q.updated_at ? new Date(q.updated_at).toISOString() : '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qwizzeria-questions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QuestionList() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', search: '', tag: '' });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

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
        tag: filters.tag || undefined,
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
      const merged = [...CATEGORIES];
      for (const c of dbCats) {
        if (!merged.includes(c)) merged.push(c);
      }
      setCategories(merged);
    }).catch(() => {
      setCategories(CATEGORIES);
    });
  }, []);

  // Debounced tag search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, tag: tagInput.trim() }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [tagInput]);

  // Clear selection when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQuestion(deleteTarget);
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget);
        return next;
      });
      loadQuestions();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportSelected = () => {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    exportQuestionsCSV(selected);
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      // Fetch all matching questions (up to 5000) without pagination
      const result = await fetchAllQuestions({
        category: filters.category || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        tag: filters.tag || undefined,
        page: 1,
        pageSize: 5000,
      });
      exportQuestionsCSV(result.data);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const allOnPageSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div>
      <div className="page-header">
        <h1>Questions</h1>
        <div className="page-header__actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportAll}
            disabled={exporting || count === 0}
          >
            {exporting ? 'Exporting...' : `Export All (${count})`}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/questions/new')}>
            Add Question
          </button>
        </div>
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
        <input
          type="text"
          className="form-input"
          placeholder="Search tags..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
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

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="selection-bar">
          <span className="selection-bar__count">{selectedIds.size}</span>
          <span>question{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <button className="btn btn-secondary btn-sm" onClick={handleExportSelected}>
            Export Selected CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-table-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--row" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="admin-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="admin-empty__title">No questions found</p>
          <p className="admin-empty__hint">Try adjusting your filters or add a new question.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Question</th>
                <th>Category</th>
                <th>Tags</th>
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
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      aria-label={`Select question ${q.id}`}
                    />
                  </td>
                  <td
                    className="truncate"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                  >
                    {q.question_text}
                  </td>
                  <td>{q.category || '—'}</td>
                  <td>
                    {Array.isArray(q.tags) && q.tags.length > 0 ? (
                      <div className="tag-pills">
                        {q.tags.slice(0, 3).map((t) => (
                          <span key={t} className="tag-pill">{t}</span>
                        ))}
                        {q.tags.length > 3 && (
                          <span className="tag-pill">+{q.tags.length - 3}</span>
                        )}
                      </div>
                    ) : '—'}
                  </td>
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
          </div>

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
