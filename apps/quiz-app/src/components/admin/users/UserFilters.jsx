const TIER_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'staff', label: 'Staff (bypass)' },
];

export default function UserFilters({
  searchInput,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  tierFilter,
  onTierFilterChange,
  roles,
  tableRef,
}) {
  return (
    <div className="filters-bar" ref={tableRef}>
      <input
        type="text"
        className="form-input"
        placeholder="Search by name or email..."
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="form-select"
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
      >
        <option value="">All Roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
      <select
        className="form-select"
        value={tierFilter}
        onChange={(e) => onTierFilterChange(e.target.value)}
      >
        {TIER_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
