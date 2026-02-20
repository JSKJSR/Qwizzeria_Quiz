import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserHistory, fetchSessionDetail } from '@qwizzeria/supabase-client/src/users.js';
import '../styles/History.css';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(null);

  const pageSize = 20;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);

    fetchUserHistory({ userId: user.id, type: typeFilter, status: statusFilter, page, pageSize })
      .then(({ data, count }) => {
        if (!cancelled) {
          setSessions(data);
          setTotalCount(count);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, typeFilter, statusFilter, page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleTypeChange = useCallback((e) => {
    setTypeFilter(e.target.value);
    setPage(1);
    setExpandedId(null);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setPage(1);
    setExpandedId(null);
  }, []);

  const handleToggleExpand = useCallback(async (sessionId) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(sessionId);

    // Host sessions have all detail in metadata — no need to fetch
    const session = sessions.find(s => s.id === sessionId);
    if (session?.metadata?.is_host_quiz) return;

    if (!detailCache[sessionId]) {
      setDetailLoading(sessionId);
      try {
        const detail = await fetchSessionDetail(sessionId);
        setDetailCache(prev => ({ ...prev, [sessionId]: detail }));
      } catch {
        // Non-critical — just won't show detail
      } finally {
        setDetailLoading(null);
      }
    }
  }, [expandedId, detailCache, sessions]);

  if (loading) {
    return (
      <div className="history">
        <div className="history__loading">
          <div className="history__spinner" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history">
      <h1 className="history__title">Quiz History</h1>

      <div className="history__filters">
        <select className="history__filter-select" value={typeFilter} onChange={handleTypeChange}>
          <option value="all">All Types</option>
          <option value="free">Free Quiz</option>
          <option value="pack">Quiz Packs</option>
          <option value="host">Host Quiz</option>
        </select>
        <select className="history__filter-select" value={statusFilter} onChange={handleStatusChange}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {sessions.length === 0 ? (
        <p className="history__empty">
          No quiz sessions found. Play a quiz to see your history here!
        </p>
      ) : (
        <>
          <div className="history__list">
            {sessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const detail = detailCache[session.id];
              const isLoadingDetail = detailLoading === session.id;
              const isHostQuiz = session.metadata?.is_host_quiz;
              const hostParticipants = isHostQuiz ? session.metadata?.participants || [] : [];

              return (
                <div key={session.id} className="history__item">
                  <div
                    className="history__item-row"
                    onClick={() => handleToggleExpand(session.id)}
                  >
                    <div className="history__item-info">
                      <div className="history__item-pack">
                        {isHostQuiz && (
                          <span className="history__type-badge history__type-badge--host">HOST</span>
                        )}
                        {session.is_free_quiz ? 'Free Quiz' : session.quiz_packs?.title || 'Quiz Pack'}
                      </div>
                      <div className="history__item-date">
                        {new Date(session.started_at).toLocaleDateString()} &middot;{' '}
                        {session.total_questions} questions
                        {isHostQuiz && ` · ${hostParticipants.length} participants`}
                      </div>
                    </div>
                    <span className="history__item-score">
                      {isHostQuiz ? `Best: ${session.score ?? 0} pts` : `${session.score ?? 0} pts`}
                    </span>
                    <span className={`history__item-status history__item-status--${session.status || 'completed'}`}>
                      {session.status === 'in_progress' ? 'In Progress' : session.status === 'abandoned' ? 'Abandoned' : 'Completed'}
                    </span>
                    <span className={`history__item-expand ${isExpanded ? 'history__item-expand--open' : ''}`}>
                      &#9654;
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="history__detail">
                      {isHostQuiz ? (
                        <>
                          <p className="history__host-info">
                            Participant Rankings
                          </p>
                          <table className="history__detail-table">
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...hostParticipants]
                                .sort((a, b) => b.score - a.score)
                                .map((p, i) => {
                                  const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
                                  return (
                                    <tr key={i}>
                                      <td>{medal}{i + 1}</td>
                                      <td>{p.name}</td>
                                      <td>{p.score} pts</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </>
                      ) : isLoadingDetail ? (
                        <p style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem' }}>Loading details...</p>
                      ) : detail?.attempts?.length > 0 ? (
                        <table className="history__detail-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Question</th>
                              <th>Category</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.attempts.map((attempt, i) => {
                              const q = attempt.questions_master;
                              return (
                                <tr key={attempt.id || i}>
                                  <td>{i + 1}</td>
                                  <td>{q?.question_text || '—'}</td>
                                  <td>{q?.category || '—'}</td>
                                  <td>
                                    {attempt.skipped ? (
                                      <span className="history__detail-skipped">Skipped</span>
                                    ) : attempt.is_correct ? (
                                      <span className="history__detail-correct">Correct</span>
                                    ) : (
                                      <span className="history__detail-wrong">Wrong</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem' }}>
                          No attempt details available.
                        </p>
                      )}

                      {!isHostQuiz && session.status === 'in_progress' && (
                        <button
                          className="history__resume-btn"
                          style={{
                            marginTop: '0.75rem',
                            padding: '0.5rem 1rem',
                            background: 'var(--accent-primary, #be1332)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                          onClick={() => navigate(`/play/resume/${session.id}`)}
                        >
                          Resume Quiz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="history__pagination">
              <button
                className="history__page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span className="history__page-text">
                Page {page} of {totalPages}
              </span>
              <button
                className="history__page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
