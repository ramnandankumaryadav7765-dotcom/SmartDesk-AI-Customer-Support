import { Activity, BookOpen, Bot, Box, Inbox, Sparkles } from 'lucide-react';
import UserAvatar from './UserAvatar.jsx';

const navigation = [
  { label: 'Overview', icon: Activity },
  { label: 'AI assistant', icon: Bot },
  { label: 'Inbox', icon: Inbox },
  { label: 'Orders', icon: Box },
  { label: 'Knowledge base', icon: BookOpen },
];

export default function Sidebar({ page, openCount = 0, user, onNavigate, onProfile }) {
  return (
    <aside className="sidebar">
      <button
        className="brand brand-button"
        type="button"
        onClick={() => onNavigate('Overview')}
        aria-label="SmartDesk overview"
      >
        <span className="brand-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>smartdesk</span>
      </button>
      <div className="workspace-switch">
        <UserAvatar user={user} className="shop-avatar" />
        <div className="workspace-copy">
          <strong>{user?.name}</strong>
          <small>Personal workspace</small>
        </div>
      </div>
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${page === label ? 'active' : ''}`}
            onClick={() => onNavigate(label)}
            aria-current={page === label ? 'page' : undefined}
          >
            <Icon size={19} strokeWidth={1.9} />
            <span>{label}</span>
            {label === 'Inbox' && openCount > 0 && <b className="nav-count">{openCount}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="plan-card" type="button" onClick={() => onNavigate('AI assistant')}>
          <div className="plan-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <strong>Ask your assistant</strong>
            <small>Across your account</small>
          </div>
          <span className="online-dot" />
        </button>
        <button className="profile-button" type="button" onClick={onProfile} title="Open profile settings">
          <UserAvatar user={user} className="avatar profile-avatar" />
          <div className="profile-copy">
            <strong>{user?.name}</strong>
            <small>Edit profile</small>
          </div>
          <span className="profile-open-label">Profile</span>
        </button>
      </div>
    </aside>
  );
}
