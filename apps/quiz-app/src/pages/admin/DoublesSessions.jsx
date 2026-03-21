import { useState, useEffect, useCallback } from 'react';
import { fetchDoublesSessionsAdmin } from '@qwizzeria/supabase-client';
import DoublesGradeModal from '../../components/admin/doubles/DoublesGradeModal';

const PAGE_SIZE = 20;

export default function DoublesSessions() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingSession, setGradingSession] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDoublesSessionsAdmin({
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setSessions(result.data);
      setTotal(result.count);
    } catch (err) {
      setError(err.message);
      setSessions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side search filter (user display name or player name)
  const filtered = debouncedSearch
    ? sessions.filter((s) => {
        const term = debouncedSearch.toLowerCase();
        const displayName = (s.user_profiles?.display_name || '').toLowerCase();
        const playerName = (s.metadata?.player_name || '').toLowerCase();
        const packTitle = (s.quiz_packs?.title || '').toLowerCase();
        return displayName.includes(term) || playerName.includes(term) || packTitle.includes(term);
      })
    : sessions;

  const handleGraded = (sessionId, grades) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, metadata: { ...s.metadata, grades } }
          : s
      )
    );
  };

  const gradedCount = (session) => {
    const grades = session.metadata?.grades;
    if (!grades) return null;
    const total = Object.keys(grades).length;
    const correct = Object.values(grades).filter(Boolean).length;
    return { total, correct };
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__title-group">
          <h1>Doubles Sessions</h1>
          <span className="page-header__subtitle">
            Review and grade doubles quiz responses
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">{error}</div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-input"
          type="text"
          placeholder="Search user, player, or pack..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading sessions...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No doubles sessions found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pack</th>
                <th>Part</th>
                <th>Player Name</th>
                <th>Answered</th>
                <th>Graded</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => {
                const gc = gradedCount(session);
                const answeredCount = session.metadata?.responses
                  ? Object.values(session.metadata.responses).filter(Boolean).length
                  : 0;

                return (
                  <tr key={session.id}>
                    <td>{session.user_profiles?.display_name || '—'}</td>
                    <td className="truncate">{session.quiz_packs?.title || '—'}</td>
                    <td>P{session.metadata?.part || '?'}</td>
                    <td>{session.metadata?.player_name || '—'}</td>
                    <td>{answeredCount}/{session.total_questions}</td>
                    <td>
                      {gc ? (
                        <span className={`badge ${gc.correct === gc.total ? 'badge--active' : 'badge--draft'}`}>
                          {gc.correct}/{gc.total}
                        </span>
                      ) : (
                        <span className="badge badge--user">Not graded</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${session.status === 'completed' ? 'active' : session.status === 'in_progress' ? 'draft' : 'archived'}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>{new Date(session.started_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setGradingSession(session)}
                      >
                        Grade
                      </button>
                    </td>
                  </tr>
                );
              })}
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
              <span>Page {page} of {totalPages}</span>
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

      {gradingSession && (
        <DoublesGradeModal
          session={gradingSession}
          onClose={() => setGradingSession(null)}
          onGraded={handleGraded}
        />
      )}
    </div>
  );
}
