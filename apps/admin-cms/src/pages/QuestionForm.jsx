import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchQuestionById,
  createQuestion,
  updateQuestion,
  fetchCategories,
} from '@qwizzeria/supabase-client/src/questions.js';

const EMPTY_FORM = {
  question_text: '',
  answer_text: '',
  answer_explanation: '',
  category: '',
  sub_category: '',
  media_url: '',
  tags: '',
  status: 'active',
  is_public: true,
};

export default function QuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    async function load() {
      try {
        const q = await fetchQuestionById(id);
        setForm({
          question_text: q.question_text || '',
          answer_text: q.answer_text || '',
          answer_explanation: q.answer_explanation || '',
          category: q.category || '',
          sub_category: q.sub_category || '',
          media_url: q.media_url || '',
          tags: Array.isArray(q.tags) ? q.tags.join(', ') : (q.tags || ''),
          status: q.status || 'active',
          is_public: q.is_public !== false,
        });
      } catch (err) {
        setError(`Failed to load question: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.question_text.trim() || !form.answer_text.trim()) {
      setError('Question and Answer are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        question_text: form.question_text.trim(),
        answer_text: form.answer_text.trim(),
        answer_explanation: form.answer_explanation.trim() || null,
        category: form.category.trim() || null,
        sub_category: form.sub_category.trim() || null,
        media_url: form.media_url.trim() || null,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : null,
        status: form.status,
        is_public: form.is_public,
      };

      if (isEdit) {
        await updateQuestion(id, payload);
        setSuccess('Question updated successfully.');
      } else {
        await createQuestion(payload);
        setSuccess('Question created successfully.');
        setTimeout(() => navigate('/questions'), 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading question...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Question' : 'New Question'}</h1>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
        <div className="form-group">
          <label htmlFor="question_text">Question *</label>
          <textarea
            id="question_text"
            className="form-textarea"
            rows={3}
            value={form.question_text}
            onChange={(e) => handleChange('question_text', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="answer_text">Answer *</label>
          <textarea
            id="answer_text"
            className="form-textarea"
            rows={2}
            value={form.answer_text}
            onChange={(e) => handleChange('answer_text', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="answer_explanation">Explanation</label>
          <textarea
            id="answer_explanation"
            className="form-textarea"
            rows={2}
            value={form.answer_explanation}
            onChange={(e) => handleChange('answer_explanation', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              className="form-input"
              list="category-list"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="sub_category">Sub Category</label>
            <input
              id="sub_category"
              type="text"
              className="form-input"
              value={form.sub_category}
              onChange={(e) => handleChange('sub_category', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="media_url">Media URL</label>
          <input
            id="media_url"
            type="text"
            className="form-input"
            value={form.media_url}
            onChange={(e) => handleChange('media_url', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            type="text"
            className="form-input"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="form-select"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label>&nbsp;</label>
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => handleChange('is_public', e.target.checked)}
              />
              <label htmlFor="is_public" style={{ marginBottom: 0 }}>Public</label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Question' : 'Create Question'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/questions')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
