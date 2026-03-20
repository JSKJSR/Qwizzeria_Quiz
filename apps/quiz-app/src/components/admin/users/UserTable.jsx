import { isActiveUser, isStaffRole, formatRelativeTime } from './userManagementUtils';

export default function UserTable({
  users,
  editingUser,
  actionMenuOpen,
  dropdownRef,
  onRoleChange,
  onSaveRole,
  onCancelEdit,
  onSetActionMenuOpen,
  roles,
}) {
  return (
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
                <span className={`badge ${isStaffRole(u.role) ? 'badge--subscription-premium' : 'badge--subscription-free'}`}>
                  {isStaffRole(u.role) ? 'Staff' : 'User'}
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
                        onSaveRole(u.id, u.display_name || u.email, u.role, editingUser.newRole)
                      }
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : isEditing ? (
                  <select
                    className="form-select user-role-select"
                    value={selectedRole}
                    onChange={(e) => onRoleChange(u.id, e.target.value)}
                    autoFocus
                  >
                    {roles.map((r) => (
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
                        onSetActionMenuOpen(actionMenuOpen === u.id ? null : u.id)
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
                            onRoleChange(u.id, u.role);
                            onSetActionMenuOpen(null);
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
  );
}
