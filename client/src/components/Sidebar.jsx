import {
  Activity,
  BookOpen,
  Box,
  ChevronDown,
  Inbox,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { label: 'Overview', icon: Activity },
  { label: 'Inbox', icon: Inbox },
  { label: 'Orders', icon: Box },
  { label: 'Knowledge base', icon: BookOpen },
];

export default function Sidebar({ page, openCount = 0, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <span>smartdesk</span>
      </div>
      <div className="workspace-switch">
        <div className="shop-avatar">S</div>
        <div className="workspace-copy">
          <strong>Sunday Supply</strong>
          <small>Support workspace</small>
        </div>
        <ChevronDown size={15} />
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${page === label ? 'active' : ''}`}
            onClick={() => onNavigate(label)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Inbox' && openCount > 0 && <b className="nav-count">{openCount}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-label team-label">YOUR TEAM</div>
      <div className="team-row">
        <span className="presence avatar peach">
          JL
          <i />
        </span>
        <span>Jamie Lee</span>
        <span className="you-label">You</span>
      </div>
      <div className="team-row">
        <span className="presence avatar lavender">
          MK
          <i />
        </span>
        <span>Marcus Kim</span>
      </div>
      <div className="team-row">
        <span className="presence avatar blue">
          AR
          <i />
        </span>
        <span>Ana Rivera</span>
      </div>
      <div className="sidebar-bottom">
        <div className="plan-card">
          <div className="plan-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <strong>Your AI sidekick</strong>
            <small>Ready when you are</small>
          </div>
          <span className="online-dot" />
        </div>
        <button className="profile-button" type="button">
          <div className="avatar profile-avatar">JL</div>
          <div>
            <strong>Jamie Lee</strong>
            <small>Workspace admin</small>
          </div>
          <MoreHorizontal size={18} />
        </button>
      </div>
    </aside>
  );
}
