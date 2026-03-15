import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchAllUsersWithEmail,
    fetchUserManagementKPIs,
    updateUserRole,
} from '@qwizzeria/supabase-client';

const ROLES = ['user', 'premium', 'editor', 'admin', 'superadmin'];

function formatRelativeTime(dateStr) {
    if (!dateStr) return '—';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function isActiveUser(lastActive) {
    if (!lastActive) return false;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return new Date(lastActive).getTime() > thirtyDaysAgo;
}

function isPremiumRole(role) {
    return ['premium', 'editor', 'admin', 'superadmin'].includes(role);
}

function exportCSV(users) {
    const headers = ['Name', 'Email', 'Role', 'Quizzes', 'Tournaments', 'Avg Score', 'Last Active', 'Joined'];
    const rows = users.map((u) => [
        u.display_name || '',
        u.email || '',
        u.role || '',
        u.quiz_count ?? '',
        u.tournament_count ?? '',
        u.avg_score ?? '',
        u.last_active ? new Date(u.last_active).toISOString() : '',
        u.created_at ? new Date(u.created_at).toISOString() : '',
    ]);

    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qwizzeria-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [kpisLoading, setKpisLoading] = useState(true);
    const [actionMenuOpen, setActionMenuOpen] = useState(null);

    const dropdownRef = useRef(null);
    const tableRef = useRef(null);
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActionMenuOpen(null);
            }
        }
        if (actionMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [actionMenuOpen]);

    const loadKpis = useCallback(async () => {
        setKpisLoading(true);
        try {
            const data = await fetchUserManagementKPIs();
            setKpis(data);
        } catch (err) {
            console.error('Failed to fetch KPIs:', err);
        } finally {
            setKpisLoading(false);
        }
    }, []);

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
        loadKpis();
    }, [loadKpis]);

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
        setActionMenuOpen(null);
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
            loadKpis();
        } catch (err) {
            setFeedback({ type: 'error', message: `Failed to update role: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleCreateAdmin = () => {
        setFilters((prev) => ({ ...prev, search: '' }));
        setSearchInput('');
        tableRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            const input = tableRef.current?.parentElement?.querySelector('.filters-bar .form-input');
            input?.focus();
        }, 400);
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header__title-group">
                    <h1>User Management</h1>
                    <span className="page-header__subtitle">
                        Manage users, roles, and permissions
                    </span>
                </div>
                <div className="page-header__actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => exportCSV(users)}
                        disabled={users.length === 0}
                    >
                        Export CSV
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleCreateAdmin}
                    >
                        Create Admin
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`alert alert--${feedback.type}`}>
                    {feedback.message}
                </div>
            )}

            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__header">
                        <div className="stat-card__icon stat-card__icon--users">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <span className="stat-card__label">Total Users</span>
                    </div>
                    <div className="stat-card__value">
                        {kpisLoading ? '...' : (kpis?.total_users ?? 0)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__header">
                        <div className="stat-card__icon stat-card__icon--active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span className="stat-card__label">Active (24h)</span>
                    </div>
                    <div className="stat-card__value">
                        {kpisLoading ? '...' : (kpis?.active_24h ?? 0)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__header">
                        <div className="stat-card__icon stat-card__icon--premium">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <span className="stat-card__label">Premium Users</span>
                    </div>
                    <div className="stat-card__value">
                        {kpisLoading ? '...' : (kpis?.premium_count ?? 0)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__header">
                        <div className="stat-card__icon stat-card__icon--tournament">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                        </div>
                        <span className="stat-card__label">Tournament %</span>
                    </div>
                    <div className="stat-card__value">
                        {kpisLoading ? '...' : `${kpis?.tournament_participation_pct ?? 0}%`}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar" ref={tableRef}>
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

            {/* Table */}
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
                                <th>Subscription</th>
                                <th className="col-quizzes">Quizzes</th>
                                <th className="col-tournaments">Tournaments</th>
                                <th className="col-avg-score">Avg Score</th>
                                <th className="col-last-active">Last Active</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => {
                                const isEditing = editingUser?.id === u.id;
                                const selectedRole = isEditing ? editingUser.newRole : u.role;
                                const hasChanged = isEditing && editingUser.newRole !== u.role;
                                const active = isActiveUser(u.last_active);

                                return (
                                    <tr key={u.id}>
                                        {/* User (avatar + name + email) */}
                                        <td>
                                            <div className="user-table__name-cell">
                                                {u.avatar_url ? (
                                                    <img
                                                        src={u.avatar_url}
                                                        alt=""
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            flexShrink: 0,
                                                        }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background: 'var(--bg-card-hover)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-muted)',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {(u.display_name || u.email || '?')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="user-table__name-info">
                                                    <span className="user-table__name">
                                                        {u.display_name || '—'}
                                                    </span>
                                                    <span className="user-table__email">
                                                        {u.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Subscription badge */}
                                        <td>
                                            <span className={`badge ${isPremiumRole(u.role) ? 'badge--subscription-premium' : 'badge--subscription-free'}`}>
                                                {isPremiumRole(u.role) ? 'Premium' : 'Free'}
                                            </span>
                                        </td>

                                        {/* Quizzes */}
                                        <td className="col-quizzes">
                                            {u.quiz_count ?? 0}
                                        </td>

                                        {/* Tournaments */}
                                        <td className="col-tournaments">
                                            {u.tournament_count ?? 0}
                                        </td>

                                        {/* Avg Score */}
                                        <td className="col-avg-score">
                                            {u.avg_score != null ? `${u.avg_score}%` : '—'}
                                        </td>

                                        {/* Last Active */}
                                        <td className="col-last-active" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {formatRelativeTime(u.last_active)}
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`badge badge--status ${active ? 'badge--status-active' : 'badge--status-inactive'}`}>
                                                <span className={`status-dot ${active ? 'status-dot--active' : 'status-dot--inactive'}`} />
                                                {active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
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
                                            ) : isEditing ? (
                                                <select
                                                    className="form-select user-role-select"
                                                    value={selectedRole}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    autoFocus
                                                >
                                                    {ROLES.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div
                                                    className="action-dropdown"
                                                    ref={actionMenuOpen === u.id ? dropdownRef : null}
                                                >
                                                    <button
                                                        className="action-dropdown__trigger"
                                                        onClick={() =>
                                                            setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)
                                                        }
                                                        aria-label="Actions"
                                                    >
                                                        &#8942;
                                                    </button>
                                                    {actionMenuOpen === u.id && (
                                                        <div className="action-dropdown__menu">
                                                            <button
                                                                className="action-dropdown__item"
                                                                onClick={() => {
                                                                    setEditingUser({ id: u.id, newRole: u.role });
                                                                    setActionMenuOpen(null);
                                                                }}
                                                            >
                                                                Change Role
                                                            </button>
                                                            <button
                                                                className="action-dropdown__item"
                                                                disabled
                                                                title="Coming soon"
                                                            >
                                                                Suspend User
                                                            </button>
                                                            <button
                                                                className="action-dropdown__item action-dropdown__item--danger"
                                                                disabled
                                                                title="Coming soon"
                                                            >
                                                                Ban User
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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

            {/* Confirmation Dialog */}
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
                                Superadmin has full system access including user management.
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
