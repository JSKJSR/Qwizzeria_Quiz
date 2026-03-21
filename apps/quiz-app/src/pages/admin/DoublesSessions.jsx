import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchDoublesSessionsAdmin } from '@qwizzeria/supabase-client';
import DoublesGradeModal from '../../components/admin/doubles/DoublesGradeModal';

const PAGE_SIZE = 20;

function getGradeSummary(session) {
  const grades = session.metadata?.grades;
  if (!grades) return null;
  const total = Object.keys(grades).length;
  const correct = Object.values(grades).filter(Boolean).length;
  return { total, correct };
}

function getAnsweredCount(session) {
  const responses = session.metadata?.responses;
  if (!responses) return 0;
  return Object.values(responses).filter(Boolean).length;
}

const STATUS_BADGE_MAP = {
  completed: 'active',
  in_progress: 'draft',
  abandoned: 'archived',
};

export default function DoublesSessions() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingSession, setGradingSession] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  // Client-side search filter (user display name, player name, or pack title)
  const filtered = useMemo(() => {
    if (!debouncedSearch) return sessions;
    const term = debouncedSearch.toLowerCase();
    return sessions.filter((s) => {
      const displayName = (s.user_profiles?.display_name || '').toLowerCase();
      const playerName = (s.metadata?.player_name || '').toLowerCase();
      const packTitle = (s.quiz_packs?.title || '').toLowerCase();
      return displayName.includes(term) || playerName.includes(term) || packTitle.includes(term);
    });
  }, [sessions, debouncedSearch]);

  // Use filtered count for pagination when searching, server count otherwise
  const effectiveTotal = debouncedSearch ? filtered.length : total;
  const totalPages = Math.ceil(effectiveTotal / PAGE_SIZE);

  const handleGraded = useCallback((sessionId, grades) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, metadata: { ...s.metadata, grades } }
          : s
      )
    );
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  }, []);

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

      {error && <div className="alert alert--error">{error}</div>}

      <div className="filters-bar">
        <input
          className="form-input"
          type="text"
          placeholder="Search user, player, or pack..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search doubles sessions"
        />
        <select
          className="form-select"
          value={statusFilter}
          onChange={handleStatusChange}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

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
                const gc = getGradeSummary(session);
                const answered = getAnsweredCount(session);
                return (
                  <tr key={session.id}>
                    <td>{session.user_profiles?.display_name || '—'}</td>
                    <td className="truncate">{session.quiz_packs?.title || '—'}</td>
                    <td>P{session.metadata?.part || '?'}</td>
                    <td>{session.metadata?.player_name || '—'}</td>
                    <td>{answered}/{session.total_questions}</td>
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
                      <span className={`badge badge--${STATUS_BADGE_MAP[session.status] || 'archived'}`}>
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
                aria-label="Previous page"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
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
