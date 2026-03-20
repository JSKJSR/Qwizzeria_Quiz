export default function UserFilters({
  searchInput,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
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
    </div>
  );
}
