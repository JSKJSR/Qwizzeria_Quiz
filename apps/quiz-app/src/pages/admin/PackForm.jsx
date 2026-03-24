import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  fetchPackById,
  createPack,
  updatePack,
  fetchPackCategories,
} from '@qwizzeria/supabase-client';
import { toExpiresAtValue, toDatetimeLocalValue } from '@/utils/packExpiration';
import './PackForm.css';

export default function PackForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_image_url: '',
    category: '',
    is_premium: false,
    is_public: false,
    is_host: false,
    status: 'draft',
    expires_at: '',
    config: {},
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetchPackCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchPackById(id)
      .then((pack) => {
        setForm({
          title: pack.title || '',
          description: pack.description || '',
          cover_image_url: pack.cover_image_url || '',
          category: pack.category || '',
          is_premium: pack.is_premium || false,
          is_public: pack.is_public || false,
          is_host: pack.is_host || false,
          status: pack.status || 'draft',
          expires_at: toDatetimeLocalValue(pack.expires_at),
          config: pack.config || {},
        });
        setImgError(false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'cover_image_url') setImgError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = { ...form, expires_at: toExpiresAtValue(form.expires_at) };

    try {
      if (isEdit) {
        await updatePack(id, payload);
        navigate('/admin/packs');
      } else {
        const created = await createPack(payload);
        navigate(`/admin/packs/${created.id}/edit`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    draft: { label: 'Draft', className: 'pf-status-indicator--draft' },
    active: { label: 'Active', className: 'pf-status-indicator--active' },
    archived: { label: 'Archived', className: 'pf-status-indicator--archived' },
  };

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-loading__spinner" />
        <span>Loading pack...</span>
      </div>
    );
  }

  return (
    <div className="pf-container">
      {/* Breadcrumb */}
      <nav className="pf-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/packs" className="pf-breadcrumb__link">Packs</Link>
        <span className="pf-breadcrumb__sep" aria-hidden="true">/</span>
        <span className="pf-breadcrumb__current">{isEdit ? 'Edit' : 'New Pack'}</span>
      </nav>

      {/* Header */}
      <div className="pf-header">
        <div className="pf-header__left">
          <h1 className="pf-header__title">{isEdit ? 'Edit Pack' : 'Create Pack'}</h1>
          {isEdit && (
            <div className={`pf-status-indicator ${statusConfig[form.status]?.className || ''}`}>
              <span className="pf-status-indicator__dot" />
              {statusConfig[form.status]?.label || form.status}
            </div>
          )}
        </div>
        {isEdit && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/admin/packs/${id}/questions`)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 4h12M2 8h12M2 12h8" />
            </svg>
            Manage Questions
          </button>
        )}
      </div>

      {error && (
        <div className="pf-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 10.5v.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
          <button type="button" className="pf-error__dismiss" onClick={() => setError(null)} aria-label="Dismiss error">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="pf-form">
        <div className="pf-form__main">
          {/* Section: Basic Info */}
          <section className="pf-card">
            <h2 className="pf-card__heading">Basic Information</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-title">
                Title <span className="pf-required">*</span>
              </label>
              <input
                id="pf-title"
                type="text"
                className="form-input"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. March 2026 - Qwizzeria Monthly"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-desc">Description</label>
              <textarea
                id="pf-desc"
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of this pack..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-category">Category</label>
              <input
                id="pf-category"
                type="text"
                className="form-input"
                list="pack-categories"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g. Geography, Sports..."
              />
              <datalist id="pack-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <small className="pf-hint">Type to search existing categories or enter a new one.</small>
            </div>
          </section>

          {/* Section: Cover Image */}
          <section className="pf-card">
            <h2 className="pf-card__heading">Cover Image</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-cover">Image URL</label>
              <input
                id="pf-cover"
                type="url"
                className="form-input"
                value={form.cover_image_url}
                onChange={(e) => handleChange('cover_image_url', e.target.value)}
                placeholder="https://i.imgur.com/..."
              />
            </div>

            {form.cover_image_url && (
              <div className="pf-image-preview">
                {!imgError ? (
                  <img
                    src={form.cover_image_url}
                    alt="Cover preview"
                    className="pf-image-preview__img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="pf-image-preview__fallback">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M3 16l5-5 4 4 3-3 6 6" />
                      <circle cx="15" cy="9" r="2" />
                    </svg>
                    <span>Image failed to load</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section: Doubles Settings */}
          <section className="pf-card">
            <div className="pf-card__heading-row">
              <h2 className="pf-card__heading">Doubles Settings</h2>
              <label className="pf-toggle" htmlFor="pf-doubles-toggle">
                <input
                  id="pf-doubles-toggle"
                  type="checkbox"
                  className="pf-toggle__input"
                  checked={form.config?.doubles_enabled || false}
                  onChange={(e) => handleChange('config', { ...form.config, doubles_enabled: e.target.checked })}
                />
                <span className="pf-toggle__track">
                  <span className="pf-toggle__thumb" />
                </span>
                <span className="pf-toggle__label">
                  {form.config?.doubles_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {form.config?.doubles_enabled && (
              <div className="pf-doubles-grid">
                <div className="pf-doubles-part">
                  <h3 className="pf-doubles-part__title">Part 1</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-d-p1q">Questions</label>
                    <input
                      id="pf-d-p1q"
                      type="number"
                      className="form-input"
                      value={form.config?.doubles_part1_questions ?? ''}
                      onChange={(e) => handleChange('config', { ...form.config, doubles_part1_questions: parseInt(e.target.value) || undefined })}
                      min="1"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-d-p1t">Timer (minutes)</label>
                    <input
                      id="pf-d-p1t"
                      type="number"
                      className="form-input"
                      value={form.config?.doubles_part1_timer_minutes ?? 60}
                      onChange={(e) => handleChange('config', { ...form.config, doubles_part1_timer_minutes: parseInt(e.target.value) || 60 })}
                      min="1"
                      max="180"
                    />
                  </div>
                </div>

                <div className="pf-doubles-divider" aria-hidden="true">
                  <span className="pf-doubles-divider__line" />
                  <span className="pf-doubles-divider__label">Break</span>
                  <span className="pf-doubles-divider__line" />
                </div>

                <div className={`pf-doubles-part ${form.config?.doubles_part2_questions === 0 ? 'pf-doubles-part--disabled' : ''}`}>
                  <h3 className="pf-doubles-part__title">Part 2</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-d-p2q">Questions</label>
                    <input
                      id="pf-d-p2q"
                      type="number"
                      className="form-input"
                      value={form.config?.doubles_part2_questions ?? ''}
                      onChange={(e) => handleChange('config', { ...form.config, doubles_part2_questions: parseInt(e.target.value) ?? undefined })}
                      min="0"
                      placeholder="0 to skip Part 2"
                    />
                    <small className="pf-hint">Set to 0 for a single-part quiz.</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pf-d-p2t">Timer (minutes)</label>
                    <input
                      id="pf-d-p2t"
                      type="number"
                      className="form-input"
                      value={form.config?.doubles_part2_timer_minutes ?? 60}
                      onChange={(e) => handleChange('config', { ...form.config, doubles_part2_timer_minutes: parseInt(e.target.value) || 60 })}
                      min="1"
                      max="180"
                      disabled={form.config?.doubles_part2_questions === 0}
                    />
                    {form.config?.doubles_part2_questions === 0 && (
                      <small className="pf-hint">N/A when Part 2 is skipped.</small>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="pf-form__sidebar">
          {/* Status & Scheduling */}
          <section className="pf-card">
            <h2 className="pf-card__heading">Publishing</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-status">Status</label>
              <select
                id="pf-status"
                className="form-select"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pf-expires">Expires at</label>
              <div className="pf-expires-row">
                <input
                  id="pf-expires"
                  type="datetime-local"
                  className="form-input"
                  value={form.expires_at}
                  onChange={(e) => handleChange('expires_at', e.target.value)}
                />
                {form.expires_at && (
                  <button
                    type="button"
                    className="pf-expires-clear"
                    onClick={() => handleChange('expires_at', '')}
                    aria-label="Clear expiration date"
                    title="Remove expiration"
                  >
                    &times;
                  </button>
                )}
              </div>
              <small className="pf-hint">Leave empty for no expiration.</small>
            </div>
          </section>

          {/* Visibility */}
          <section className="pf-card">
            <h2 className="pf-card__heading">Visibility</h2>

            <div className="pf-switch-group">
              <label className="pf-switch" htmlFor="pf-public">
                <input
                  id="pf-public"
                  type="checkbox"
                  className="pf-switch__input"
                  checked={form.is_public}
                  onChange={(e) => handleChange('is_public', e.target.checked)}
                />
                <span className="pf-switch__track"><span className="pf-switch__thumb" /></span>
                <div className="pf-switch__text">
                  <span className="pf-switch__label">Public</span>
                  <span className="pf-switch__desc">Visible to all users</span>
                </div>
              </label>

              <label className="pf-switch" htmlFor="pf-premium">
                <input
                  id="pf-premium"
                  type="checkbox"
                  className="pf-switch__input"
                  checked={form.is_premium}
                  onChange={(e) => handleChange('is_premium', e.target.checked)}
                />
                <span className="pf-switch__track"><span className="pf-switch__thumb" /></span>
                <div className="pf-switch__text">
                  <span className="pf-switch__label">Premium</span>
                  <span className="pf-switch__desc">Requires paid subscription</span>
                </div>
              </label>

              <label className="pf-switch" htmlFor="pf-host">
                <input
                  id="pf-host"
                  type="checkbox"
                  className="pf-switch__input"
                  checked={form.is_host}
                  onChange={(e) => handleChange('is_host', e.target.checked)}
                />
                <span className="pf-switch__track"><span className="pf-switch__thumb" /></span>
                <div className="pf-switch__text">
                  <span className="pf-switch__label">Host</span>
                  <span className="pf-switch__desc">Available for hosted quizzes</span>
                </div>
              </label>
            </div>
          </section>

          {/* Actions */}
          <section className="pf-card pf-card--actions">
            <button
              type="submit"
              className="btn btn-primary pf-action-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="pf-spinner" />
                  Saving...
                </>
              ) : isEdit ? 'Update Pack' : 'Create Pack'}
            </button>
            <button
              type="button"
              className="btn btn-secondary pf-action-btn pf-action-btn--secondary"
              onClick={() => navigate('/admin/packs')}
            >
              Cancel
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
