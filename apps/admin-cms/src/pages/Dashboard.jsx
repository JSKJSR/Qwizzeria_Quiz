import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllQuestions, fetchCategories } from '@qwizzeria/supabase-client/src/questions.js';
import { fetchAdminAnalytics, fetchPackPerformance, fetchHardestQuestions } from '@qwizzeria/supabase-client/src/packs.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [packPerf, setPackPerf] = useState([]);
  const [hardest, setHardest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [allResult, activeResult, draftResult, categories] = await Promise.all([
          fetchAllQuestions({ pageSize: 1 }),
          fetchAllQuestions({ status: 'active', pageSize: 1 }),
          fetchAllQuestions({ status: 'draft', pageSize: 1 }),
          fetchCategories(),
        ]);

        setStats({
          total: allResult.count,
          active: activeResult.count,
          draft: draftResult.count,
          categories: categories.length,
        });

        // Load remaining data in parallel (non-critical)
        const [recentResult, analyticsData, perfData, hardestData] = await Promise.all([
          fetchAllQuestions({ pageSize: 10 }),
          fetchAdminAnalytics().catch(() => null),
          fetchPackPerformance().catch(() => []),
          fetchHardestQuestions(10).catch(() => []),
        ]);

        setRecent(recentResult.data);
        setAnalytics(analyticsData);
        setPackPerf(perfData);
        setHardest(hardestData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Total Questions</div>
            <div className="stat-card__value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Active</div>
            <div className="stat-card__value">{stats.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Draft</div>
            <div className="stat-card__value">{stats.draft}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Categories</div>
            <div className="stat-card__value">{stats.categories}</div>
          </div>
        </div>
      )}

      {/* Platform Analytics */}
      {analytics && (
        <>
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem', marginTop: '2rem' }}>Platform Analytics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__label">Total Users</div>
              <div className="stat-card__value">{analytics.total_users ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Total Sessions</div>
              <div className="stat-card__value">{analytics.total_sessions ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Avg Score</div>
              <div className="stat-card__value">{analytics.avg_score != null ? Math.round(analytics.avg_score) : '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Active Users (7d)</div>
              <div className="stat-card__value">{analytics.active_users_7d ?? 0}</div>
            </div>
          </div>
        </>
      )}

      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/questions/new')}>
          Add Question
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/import')}>
          Bulk Import
        </button>
      </div>

      {/* Pack Performance */}
      {packPerf.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem', marginTop: '2rem' }}>Pack Performance</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pack</th>
                <th>Plays</th>
                <th>Avg Score</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {packPerf.map((p) => (
                <tr key={p.id}>
                  <td>{p.title || '—'}</td>
                  <td>{p.plays ?? 0}</td>
                  <td>{p.avg_score != null ? Math.round(p.avg_score) : '—'}</td>
                  <td>{p.completion_rate != null ? `${Math.round(p.completion_rate)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Hardest Questions */}
      {hardest.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem', marginTop: '2rem' }}>Hardest Questions</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Attempts</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {hardest.map((q) => (
                <tr key={q.id}>
                  <td className="truncate">{q.question_text || '—'}</td>
                  <td>{q.category || '—'}</td>
                  <td>{q.total_attempts ?? 0}</td>
                  <td>{q.accuracy_pct != null ? `${Math.round(q.accuracy_pct)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem', marginTop: '2rem' }}>Recent Questions</h2>
      {recent.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No questions yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((q) => (
              <tr
                key={q.id}
                onClick={() => navigate(`/questions/${q.id}/edit`)}
                style={{ cursor: 'pointer' }}
              >
                <td className="truncate">{q.question_text}</td>
                <td>{q.category || '—'}</td>
                <td>
                  <span className={`badge badge--${q.status || 'active'}`}>
                    {q.status || 'active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
