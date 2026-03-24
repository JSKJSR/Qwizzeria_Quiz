import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchQuestionById,
  createQuestion,
  updateQuestion,
} from '@qwizzeria/supabase-client';
import { CATEGORY_MAP, CATEGORIES, isValidCategory, isValidSubCategory } from '@/utils/categoryData';
import './QuestionForm.css';

const EMPTY_FORM = {
  question_text: '',
  answer_text: '',
  answer_explanation: '',
  category: '',
  sub_category: '',
  display_title: '',
  points: '',
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
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mediaError, setMediaError] = useState(false);

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
          display_title: q.display_title || '',
          points: q.points != null ? String(q.points) : '',
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
    if (field === 'media_url') setMediaError(false);
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
      const pointsVal = form.points.trim();
      const payload = {
        question_text: form.question_text.trim(),
        answer_text: form.answer_text.trim(),
        answer_explanation: form.answer_explanation.trim() || null,
        category: form.category.trim() || null,
        sub_category: form.sub_category.trim() || null,
        display_title: form.display_title.trim() || null,
        points: pointsVal && !isNaN(Number(pointsVal)) ? Number(pointsVal) : null,
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
        setTimeout(() => navigate('/admin/questions'), 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Build category options
  const categoryHasNonStandard = form.category && !isValidCategory(form.category);
  const subCategoryOptions = CATEGORY_MAP[form.category] || [];
  const subCategoryHasNonStandard = form.sub_category && !isValidSubCategory(form.sub_category, form.category);

  const statusConfig = {
    active: { label: 'Active', className: 'qf-status--active' },
    draft: { label: 'Draft', className: 'qf-status--draft' },
    archived: { label: 'Archived', className: 'qf-status--archived' },
  };

  // Detect media type from URL
  const mediaUrl = form.media_url.trim();
  const isVideo = mediaUrl && /\.(mp4|webm|ogg)(\?|$)/i.test(mediaUrl);

  if (loading) {
    return (
      <div className="qf-loading">
        <div className="qf-loading__spinner" />
        <span>Loading question...</span>
      </div>
    );
  }

  return (
    <div className="qf-container">
      {/* Breadcrumb */}
      <nav className="qf-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/questions" className="qf-breadcrumb__link">Questions</Link>
        <span className="qf-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="qf-breadcrumb__current">{isEdit ? 'Edit' : 'New Question'}</span>
      </nav>

      {/* Header */}
      <div className="qf-header">
        <div className="qf-header__left">
          <h1 className="qf-header__title">{isEdit ? 'Edit Question' : 'New Question'}</h1>
          {isEdit && (
            <div className={`qf-status ${statusConfig[form.status]?.className || ''}`}>
              <span className="qf-status__dot" />
              {statusConfig[form.status]?.label || form.status}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="qf-alert qf-alert--error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 10.5v.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
          <button type="button" className="qf-alert__dismiss" onClick={() => setError('')} aria-label="Dismiss">&times;</button>
        </div>
      )}

      {success && (
        <div className="qf-alert qf-alert--success" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M5.5 8.5l2 2 3-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="qf-form">
        <div className="qf-form__main">
          {/* Question Content */}
          <section className="qf-card">
            <h2 className="qf-card__heading">Question Content</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-question">
                Question <span className="qf-required">*</span>
              </label>
              <textarea
                id="qf-question"
                className="form-textarea"
                rows={3}
                value={form.question_text}
                onChange={(e) => handleChange('question_text', e.target.value)}
                placeholder="Enter the question text..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-answer">
                Answer <span className="qf-required">*</span>
              </label>
              <textarea
                id="qf-answer"
                className="form-textarea"
                rows={2}
                value={form.answer_text}
                onChange={(e) => handleChange('answer_text', e.target.value)}
                placeholder="The correct answer..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-explanation">Explanation</label>
              <textarea
                id="qf-explanation"
                className="form-textarea"
                rows={2}
                value={form.answer_explanation}
                onChange={(e) => handleChange('answer_explanation', e.target.value)}
                placeholder="Optional context or explanation..."
              />
              <small className="qf-hint">Shown to players after answering. Leave blank to skip.</small>
            </div>
          </section>

          {/* Classification */}
          <section className="qf-card">
            <h2 className="qf-card__heading">Classification</h2>

            <div className="qf-field-row">
              <div className="form-group">
                <label className="form-label" htmlFor="qf-category">Category</label>
                <select
                  id="qf-category"
                  className={`form-select ${categoryHasNonStandard ? 'qf-select--warning' : ''}`}
                  value={form.category}
                  onChange={(e) => {
                    handleChange('category', e.target.value);
                    handleChange('sub_category', '');
                  }}
                >
                  <option value="">Select category...</option>
                  {categoryHasNonStandard && (
                    <option value={form.category}>{form.category} (non-standard)</option>
                  )}
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {categoryHasNonStandard && (
                  <div className="qf-warning-hint">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" strokeLinecap="round" /></svg>
                    Non-standard category. Select a standard one to fix.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="qf-subcategory">Sub Category</label>
                <select
                  id="qf-subcategory"
                  className={`form-select ${subCategoryHasNonStandard ? 'qf-select--warning' : ''}`}
                  value={form.sub_category}
                  onChange={(e) => handleChange('sub_category', e.target.value)}
                  disabled={!form.category}
                >
                  <option value="">Select sub-category...</option>
                  {subCategoryHasNonStandard && (
                    <option value={form.sub_category}>{form.sub_category} (non-standard)</option>
                  )}
                  {subCategoryOptions.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
                {subCategoryHasNonStandard && (
                  <div className="qf-warning-hint">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" strokeLinecap="round" /></svg>
                    Non-standard sub-category. Select a standard one to fix.
                  </div>
                )}
              </div>
            </div>

            <div className="qf-field-row">
              <div className="form-group">
                <label className="form-label" htmlFor="qf-display-title">Display Title</label>
                <input
                  id="qf-display-title"
                  type="text"
                  className="form-input"
                  placeholder="Custom card label (defaults to category)"
                  value={form.display_title}
                  onChange={(e) => handleChange('display_title', e.target.value)}
                />
                <small className="qf-hint">Overrides category name on the quiz card.</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="qf-points">Points</label>
                <input
                  id="qf-points"
                  type="number"
                  className="form-input"
                  min="1"
                  placeholder="Auto-assigned if empty"
                  value={form.points}
                  onChange={(e) => handleChange('points', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-tags">Tags</label>
              <input
                id="qf-tags"
                type="text"
                className="form-input"
                value={form.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="e.g. geography, europe, capitals"
              />
              <small className="qf-hint">Comma-separated. Used for filtering and search.</small>
            </div>
          </section>

          {/* Media */}
          <section className="qf-card">
            <h2 className="qf-card__heading">Media</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-media">Media URL</label>
              <input
                id="qf-media"
                type="url"
                className="form-input"
                value={form.media_url}
                onChange={(e) => handleChange('media_url', e.target.value)}
                placeholder="https://..."
              />
              <small className="qf-hint">Image or video URL shown alongside the question.</small>
            </div>

            {mediaUrl && (
              <div className="qf-media-preview">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className="qf-media-preview__video"
                    controls
                    preload="metadata"
                    onError={() => setMediaError(true)}
                  />
                ) : !mediaError ? (
                  <img
                    src={mediaUrl}
                    alt="Media preview"
                    className="qf-media-preview__img"
                    onError={() => setMediaError(true)}
                  />
                ) : (
                  <div className="qf-media-preview__fallback">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M3 16l5-5 4 4 3-3 6 6" />
                      <circle cx="15" cy="9" r="2" />
                    </svg>
                    <span>Media failed to load</span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="qf-form__sidebar">
          {/* Publishing */}
          <section className="qf-card">
            <h2 className="qf-card__heading">Publishing</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="qf-status">Status</label>
              <select
                id="qf-status"
                className="form-select"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </section>

          {/* Visibility */}
          <section className="qf-card">
            <h2 className="qf-card__heading">Visibility</h2>

            <label className="qf-switch" htmlFor="qf-public">
              <input
                id="qf-public"
                type="checkbox"
                className="qf-switch__input"
                checked={form.is_public}
                onChange={(e) => handleChange('is_public', e.target.checked)}
              />
              <span className="qf-switch__track"><span className="qf-switch__thumb" /></span>
              <div className="qf-switch__text">
                <span className="qf-switch__label">Public</span>
                <span className="qf-switch__desc">Visible to all users in quizzes</span>
              </div>
            </label>
          </section>

          {/* Actions */}
          <section className="qf-card qf-card--actions">
            <button
              type="submit"
              className="btn btn-primary qf-action-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="qf-spinner" />
                  Saving...
                </>
              ) : isEdit ? 'Update Question' : 'Create Question'}
            </button>
            <button
              type="button"
              className="btn btn-secondary qf-action-btn qf-action-btn--secondary"
              onClick={() => navigate('/admin/questions')}
            >
              Cancel
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
