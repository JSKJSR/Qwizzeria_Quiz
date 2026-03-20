export default function UserRoleConfirmModal({ target, saving, onConfirm, onCancel }) {
  if (!target) return null;
  
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Change User Role</h3>
        <p>
          Change <strong>{target.displayName}</strong> from{' '}
          <span className={`badge badge--${target.currentRole}`}>
            {target.currentRole}
          </span>{' '}
          to{' '}
          <span className={`badge badge--${target.newRole}`}>
            {target.newRole}
          </span>
          ?
        </p>
        {target.newRole === 'superadmin' && (
          <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
            Superadmin has full system access including user management.
          </div>
        )}
        <div className="confirm-dialog__actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
