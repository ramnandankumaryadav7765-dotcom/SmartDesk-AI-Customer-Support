import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle, compact = false }) {
  const dark = theme === 'dark';
  return (
    <button
      className={`appearance-toggle ${compact ? 'is-compact' : ''}`}
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      aria-pressed={dark}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      {!compact && <span>{dark ? 'Use light mode' : 'Use dark mode'}</span>}
    </button>
  );
}
