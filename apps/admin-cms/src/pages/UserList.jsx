import { useState, useEffect, useCallback } from 'react';
import {
    fetchAllUsersWithEmail,
    updateUserRole,
} from '@qwizzeria/supabase-client/src/users.js';

const ROLES = ['user', 'premium', 'editor', 'admin', 'superadmin'];

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null); // { id, newRole }
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchAllUsersWithEmail({
                search: filters.search || undefined,
                role: filters.role || undefined,
                page,
                pageSize,
            });
            setUsers(result.users || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setFeedback({ type: 'error', message: `Failed to load users: ${err.message}` });
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchInput }));
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleRoleFilterChange = (value) => {
        setFilters((prev) => ({ ...prev, role: value }));
        setPage(1);
    };

    const handleRoleChange = (userId, newRole) => {
        setEditingUser({ id: userId, newRole });
    };

    const handleSaveRole = (userId, displayName, currentRole, newRole) => {
        setConfirmTarget({ userId, displayName, currentRole, newRole });
    };

    const handleConfirmSave = async () => {
        if (!confirmTarget) return;
        setSaving(true);
        setFeedback(null);
        try {
            await updateUserRole(confirmTarget.userId, confirmTarget.newRole);
            setFeedback({
                type: 'success',
                message: `${confirmTarget.displayName || 'User'} updated to ${confirmTarget.newRole}`,
            });
            setConfirmTarget(null);
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            setFeedback({ type: 'error', message: `Failed to update role: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    return (
        <div>
            <div className="page-header">
                <h1>User Management</h1>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                    {total} user{total !== 1 ? 's' : ''} total
                </span>
            </div>

            {feedback && (
                <div className={`alert alert--${feedback.type}`}>
                    {feedback.message}
                </div>
            )}

            <div className="filters-bar">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <select
                    className="form-select"
                    value={filters.role}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                >
                    <option value="">All Roles</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
            ) : users.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
            ) : (
                <>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => {
                                const isEditing = editingUser?.id === u.id;
                                const selectedRole = isEditing ? editingUser.newRole : u.role;
                                const hasChanged = isEditing && editingUser.newRole !== u.role;

                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                {u.avatar_url ? (
                                                    <img
                                                        src={u.avatar_url}
                                                        alt=""
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                        }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '50%',
                                                            background: 'var(--bg-card-hover)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-muted)',
                                                        }}
                                                    >
                                                        {(u.display_name || u.email || '?')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <span>{u.display_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                                            {u.email}
                                        </td>
                                        <td>
                                            <select
                                                className="form-select user-role-select"
                                                value={selectedRole}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                {ROLES.map((r) => (
                                                    <option key={r} value={r}>
                                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            {hasChanged ? (
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() =>
                                                            handleSaveRole(u.id, u.display_name || u.email, u.role, editingUser.newRole)
                                                        }
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`badge badge--${u.role}`}>
                                                    {u.role}
                                                </span>
                                            )}
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

            {confirmTarget && (
                <div className="confirm-overlay" onClick={() => setConfirmTarget(null)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>Change User Role</h3>
                        <p>
                            Change <strong>{confirmTarget.displayName}</strong> from{' '}
                            <span className={`badge badge--${confirmTarget.currentRole}`}>
                                {confirmTarget.currentRole}
                            </span>{' '}
                            to{' '}
                            <span className={`badge badge--${confirmTarget.newRole}`}>
                                {confirmTarget.newRole}
                            </span>
                            ?
                        </p>
                        {confirmTarget.newRole === 'superadmin' && (
                            <div
                                className="alert alert--error"
                                style={{ marginBottom: '1rem' }}
                            >
                                ⚠️ Superadmin has full system access including user management.
                            </div>
                        )}
                        <div className="confirm-dialog__actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmTarget(null)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConfirmSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
