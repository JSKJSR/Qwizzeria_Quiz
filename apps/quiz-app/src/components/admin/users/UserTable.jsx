import { isActiveUser, isStaffRole, formatRelativeTime } from './userManagementUtils';

function getTierDisplay(user) {
  if (isStaffRole(user.role)) return { label: 'Staff', badge: 'badge--subscription-staff', status: null };
  const tier = user.subscription_tier;
  const status = user.subscription_status;
  if (tier === 'pro' && status && status !== 'expired') return { label: 'Pro', badge: 'badge--subscription-pro', status };
  if (tier === 'basic' && status && status !== 'expired') return { label: 'Basic', badge: 'badge--subscription-basic', status };
  return { label: 'Free', badge: 'badge--subscription-free', status: null };
}

function getStatusHint(status) {
  if (status === 'canceled') return { text: 'Canceled', className: 'sub-status-text--warning' };
  if (status === 'past_due') return { text: 'Past due', className: 'sub-status-text--danger' };
  return null;
}

function getUserTier(user) {
  if (isStaffRole(user.role)) return 'pro';
  if (user.subscription_tier && user.subscription_status !== 'expired') return user.subscription_tier;
  return 'free';
}

export default function UserTable({
  users,
  editingUser,
  actionMenuOpen,
  dropdownRef,
  onRoleChange,
  onSaveRole,
  onCancelEdit,
  onSetActionMenuOpen,
  onSubscriptionChange,
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
          const tierInfo = getTierDisplay(u);
          const statusHint = getStatusHint(tierInfo.status);

          return (
            <tr key={u.id}>
              {/* User (avatar + name + email) */}
              <td>
                <div className="user-table__name-cell">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="user-table__avatar"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="user-table__avatar-placeholder">
                      {(u.display_name || u.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="user-table__name-info">
                    <span className="user-table__name">
                      {u.display_name || '\u2014'}
                    </span>
                    <span className="user-table__email">
                      {u.email}
                    </span>
                  </div>
                </div>
              </td>

              {/* Subscription badge + status hint */}
              <td>
                <span className={`badge ${tierInfo.badge}`}>{tierInfo.label}</span>
                {statusHint && (
                  <span className={`sub-status-text ${statusHint.className}`}>
                    {statusHint.text}
                  </span>
                )}
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
                {u.avg_score != null ? `${u.avg_score}%` : '\u2014'}
              </td>

              {/* Last Active */}
              <td className="col-last-active col-muted">
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
                  <div className="user-table__action-btns">
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
                      aria-label={`Actions for ${u.display_name || u.email}`}
                      aria-haspopup="true"
                      aria-expanded={actionMenuOpen === u.id || undefined}
                    >
                      &#8942;
                    </button>
                    {actionMenuOpen === u.id && (
                      <div className="action-dropdown__menu" role="menu">
                        <button
                          className="action-dropdown__item"
                          role="menuitem"
                          onClick={() => {
                            onRoleChange(u.id, u.role);
                            onSetActionMenuOpen(null);
                          }}
                        >
                          Change Role
                        </button>
                        <button
                          className="action-dropdown__item"
                          role="menuitem"
                          onClick={() => {
                            onSubscriptionChange(u.id, u.display_name || u.email, getUserTier(u));
                            onSetActionMenuOpen(null);
                          }}
                        >
                          Change Subscription
                        </button>
                        <button
                          className="action-dropdown__item"
                          role="menuitem"
                          disabled
                          title="Coming soon"
                        >
                          Suspend User
                        </button>
                        <button
                          className="action-dropdown__item action-dropdown__item--danger"
                          role="menuitem"
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
