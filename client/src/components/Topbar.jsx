import { useEffect, useRef } from 'react';
import { Bell, Command, Search } from 'lucide-react';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function Topbar({ page, user, query, onQueryChange, onNotify }) {
  const searchRef = useRef(null);
  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>SmartDesk</span>
        <span className="crumb-slash">/</span>
        <strong>{page}</strong>
      </div>
      <div className="top-actions">
        <label className="search-box">
          <Search size={17} />
          <input
            ref={searchRef}
            placeholder="Search this workspace…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Search this workspace"
          />
          <kbd>
            <Command size={12} /> K
          </kbd>
        </label>
        <button
          className="icon-button notification"
          aria-label="Notifications"
          type="button"
          onClick={onNotify}
        >
          <Bell size={19} />
        </button>
        <div className="top-avatar avatar" aria-label={user?.name}>
          {initials(user?.name)}
        </div>
      </div>
    </header>
  );
}
