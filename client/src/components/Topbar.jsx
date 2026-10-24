import { useEffect, useRef, useState } from 'react';
import { Bell, Command, FileText, MessageSquare, Package, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import UserAvatar from './UserAvatar.jsx';

export default function Topbar({
  page,
  user,
  query,
  onQueryChange,
  searchResults,
  onSearchResult,
  onNotify,
  onProfile,
  theme,
  onToggleTheme,
}) {
  const searchRef = useRef(null);
  const searchAreaRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const showSearchResults = searchOpen && query.trim().length > 0;

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

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!searchAreaRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const selectResult = (result) => {
    onSearchResult(result);
    searchRef.current?.blur();
    setSearchOpen(false);
  };

  const iconFor = (kind) => {
    if (kind === 'Ticket') return MessageSquare;
    if (kind === 'Order') return Package;
    return FileText;
  };

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>SmartDesk</span>
        <span className="crumb-slash">/</span>
        <strong>{page}</strong>
      </div>
      <div className="top-actions">
        <div className="search-control" ref={searchAreaRef}>
          <label className="search-box">
            <Search size={17} />
            <input
              ref={searchRef}
              placeholder="Search tickets, orders, articles…"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                } else if (event.key === 'Enter' && searchResults.length) {
                  event.preventDefault();
                  selectResult(searchResults[0]);
                }
              }}
              aria-label="Search tickets, orders, and articles"
              aria-autocomplete="list"
              aria-expanded={showSearchResults}
            />
            {query ? (
              <button
                className="search-clear"
                type="button"
                onClick={() => {
                  onQueryChange('');
                  setSearchOpen(true);
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            ) : (
              <kbd>
                <Command size={12} /> K
              </kbd>
            )}
          </label>
          {showSearchResults && (
            <div className="search-results" role="group" aria-label="Workspace search results">
              <div className="search-results-heading">
                <span>Workspace results</span>
                <kbd>Enter to open first</kbd>
              </div>
              {searchResults.length ? (
                searchResults.map((result) => {
                  const ResultIcon = iconFor(result.kind);
                  return (
                    <button
                      className="search-result-item"
                      key={`${result.kind}-${result.item.id || result.item.orderNumber}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectResult(result)}
                    >
                      <span className={`search-result-icon ${result.kind.toLowerCase()}`}>
                        <ResultIcon size={16} />
                      </span>
                      <span className="search-result-copy">
                        <strong>{result.title}</strong>
                        <small>{result.detail}</small>
                      </span>
                      <span className="search-result-kind">{result.kind}</span>
                    </button>
                  );
                })
              ) : (
                <div className="search-empty-state">No tickets, orders, or articles match “{query.trim()}”.</div>
              )}
            </div>
          )}
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
        <button
          className="icon-button notification"
          aria-label="Notifications"
          type="button"
          onClick={onNotify}
        >
          <Bell size={19} />
        </button>
        <button className="top-profile-button" type="button" onClick={onProfile} aria-label="Open your profile">
          <UserAvatar user={user} className="top-avatar avatar" />
        </button>
      </div>
    </header>
  );
}
