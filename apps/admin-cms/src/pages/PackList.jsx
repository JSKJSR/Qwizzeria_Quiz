import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllPacks,
  fetchPackCategories,
  deletePack,
} from '@qwizzeria/supabase-client/src/packs.js';

export default function PackList() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const pageSize = 20;
  const totalPages = Math.ceil(count / pageSize);

  const loadPacks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllPacks({
        category: filters.category || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        page,
        pageSize,
      });
      setPacks(result.data);
      setCount(result.count);
    } catch (err) {
      console.error('Failed to fetch packs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  useEffect(() => {
    fetchPackCategories().then(setCategories).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePack(deleteTarget);
      setDeleteTarget(null);
      loadPacks();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Quiz Packs</h1>
        <button className="btn btn-primary" onClick={() => navigate('/packs/new')}>
          Create Pack
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="form-input"
          placeholder="Search packs..."
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
      ) : packs.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No packs found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Questions</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Plays</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p.id}>
                  <td
                    className="truncate"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/packs/${p.id}/edit`)}
                  >
                    {p.title}
                  </td>
                  <td>{p.category || '—'}</td>
                  <td>{p.question_count}</td>
                  <td>{p.is_premium ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`badge badge--${p.status || 'draft'}`}>
                      {p.status || 'draft'}
                    </span>
                  </td>
                  <td>{p.play_count}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/packs/${p.id}/questions`);
                        }}
                      >
                        Questions
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
            <h3>Delete Pack</h3>
            <p>Are you sure you want to delete this pack? This will also remove all question associations. This action cannot be undone.</p>
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
