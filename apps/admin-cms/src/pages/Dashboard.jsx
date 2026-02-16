import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllQuestions, fetchCategories } from '@qwizzeria/supabase-client/src/questions.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
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

        const recentResult = await fetchAllQuestions({ pageSize: 10 });
        setRecent(recentResult.data);
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

      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/questions/new')}>
          Add Question
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/import')}>
          Bulk Import
        </button>
      </div>

      <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: '1rem' }}>Recent Questions</h2>
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
