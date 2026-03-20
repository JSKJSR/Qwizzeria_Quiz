import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchAllUsersWithEmail,
    fetchUserManagementKPIs,
    updateUserRole,
} from '@qwizzeria/supabase-client';
import UserKpis from '../../components/admin/users/UserKpis';
import UserFilters from '../../components/admin/users/UserFilters';
import UserTable from '../../components/admin/users/UserTable';
import UserRoleConfirmModal from '../../components/admin/users/UserRoleConfirmModal';
import { exportCSV } from '../../components/admin/users/userManagementUtils';

const ROLES = ['user', 'editor', 'admin', 'superadmin'];

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

            <UserKpis kpis={kpis} loading={kpisLoading} />

            <UserFilters
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              roleFilter={filters.role}
              onRoleFilterChange={handleRoleFilterChange}
              roles={ROLES}
              tableRef={tableRef}
            />

            {/* Table */}
            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
            ) : users.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
            ) : (
                <>
                    <UserTable
                      users={users}
                      editingUser={editingUser}
                      actionMenuOpen={actionMenuOpen}
                      dropdownRef={dropdownRef}
                      onRoleChange={handleRoleChange}
                      onSaveRole={handleSaveRole}
                      onCancelEdit={() => setEditingUser(null)}
                      onSetActionMenuOpen={setActionMenuOpen}
                      roles={ROLES}
                    />

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

            <UserRoleConfirmModal
              target={confirmTarget}
              saving={saving}
              onConfirm={handleConfirmSave}
              onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
