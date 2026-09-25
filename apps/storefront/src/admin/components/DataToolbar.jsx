import React from "react";
import Icon from "./Icon";

function DataToolbar({
  query,
  setQuery,
  filter,
  setFilter,
  options = ["Semua status", "Aktif", "Draf"],
  placeholder = "Cari data…",
  searchLabel = "Cari data",
  filterLabel = "Filter status",
}) {
  return (
    <div className="adm-toolbar">
      <label className="adm-search">
        <Icon name="search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
        />
      </label>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label={filterLabel}
      >
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </div>
  );
}

export default DataToolbar;
