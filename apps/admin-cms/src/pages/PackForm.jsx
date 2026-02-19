import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchPackById,
  createPack,
  updatePack,
  fetchPackCategories,
} from '@qwizzeria/supabase-client/src/packs.js';

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
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await updatePack(id, form);
        navigate('/packs');
      } else {
        const created = await createPack(form);
        // Redirect to edit so admin can add questions
        navigate(`/packs/${created.id}/edit`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Pack' : 'Create Pack'}</h1>
      </div>

      {error && (
        <div className="alert alert--error" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: '6px', color: '#f44336' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-layout">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            type="text"
            className="form-input"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cover Image URL</label>
          <input
            type="text"
            className="form-input"
            value={form.cover_image_url}
            onChange={(e) => handleChange('cover_image_url', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <input
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
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_premium}
              onChange={(e) => handleChange('is_premium', e.target.checked)}
            />
            Premium Pack
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => handleChange('is_public', e.target.checked)}
            />
            Public
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_host}
              onChange={(e) => handleChange('is_host', e.target.checked)}
            />
            Host
          </label>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Pack' : 'Create Pack'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/packs')}
          >
            Cancel
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/packs/${id}/questions`)}
            >
              Manage Questions
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
