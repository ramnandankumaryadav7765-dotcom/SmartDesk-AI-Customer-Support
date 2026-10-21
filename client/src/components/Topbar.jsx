import { Bell, Command, Search } from 'lucide-react';

export default function Topbar({ page, query, onQueryChange, onNotify }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Sunday Supply</span>
        <span className="crumb-slash">/</span>
        <strong>{page}</strong>
      </div>
      <div className="top-actions">
        <label className="search-box">
          <Search size={16} />
          <input
            placeholder="Search anything..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <kbd>
            <Command size={11} /> K
          </kbd>
        </label>
        <button
          className="icon-button notification"
          aria-label="Notifications"
          type="button"
          onClick={onNotify}
        >
          <Bell size={18} />
          <i />
        </button>
        <div className="top-avatar avatar">JL</div>
      </div>
    </header>
  );
}
