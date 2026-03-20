export function formatRelativeTime(dateStr) {
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

export function isActiveUser(lastActive) {
  if (!lastActive) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(lastActive).getTime() > thirtyDaysAgo;
}

export function isStaffRole(role) {
  return ['editor', 'admin', 'superadmin'].includes(role);
}

export function exportCSV(users) {
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
