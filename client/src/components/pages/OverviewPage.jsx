import { ArrowRight, Box, Clock3, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { initial, timeAgo } from '../../lib/formatters.js';

export default function OverviewPage({
  overview,
  tickets,
  orders,
  user,
  onPage,
  onTicket,
  onNew,
  onAskAssistant,
  loading,
}) {
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';
  const open = tickets.filter((ticket) => ticket.status !== 'resolved');
  const recent = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  return (
    <div className="page-content overview-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">{currentDate.toUpperCase()}</div>
          <h1>
            {greeting}, {user.name.split(' ')[0]}
          </h1>
          <p>Here’s what’s happening with your support today.</p>
        </div>
        <button className="primary-button" onClick={onNew}>
          <Plus size={16} /> New ticket
        </button>
      </div>
      <button className="assistant-spotlight" onClick={onAskAssistant}>
        <div className="spotlight-symbol">
          <Sparkles size={23} />
        </div>
        <div className="spotlight-copy">
          <span>YOUR WORKSPACE ASSISTANT</span>
          <h2>What would you like help with?</h2>
          <p>Ask about your tickets, orders, policies, or anything you’re working on.</p>
        </div>
        <span className="spotlight-action">
          Ask your assistant <ArrowRight size={16} />
        </span>
        <span className="spotlight-glow" aria-hidden="true" />
      </button>
      <section className="metric-grid">
        <Metric
          title="Open conversations"
          value={loading ? '—' : open.length}
          note="Needs a reply"
          icon={MessageCircle}
          tone="mint"
        />
        <Metric
          title="Urgent to review"
          value={
            loading
              ? '—'
              : tickets.filter(
                  (ticket) => ticket.priority === 'urgent' && ticket.status !== 'resolved',
                ).length
          }
          note="A little attention goes a long way"
          icon={Clock3}
          tone="peach"
        />
        <Metric
          title="Orders today"
          value={loading ? '—' : overview?.ordersToday || 0}
          note="Across your storefront"
          icon={Box}
          tone="lavender"
        />
      </section>
      <section className="content-grid">
        <div className="panel conversation-panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Conversations waiting for a little help</p>
            </div>
            <button className="text-button" onClick={() => onPage('Inbox')}>
              View inbox <ArrowRight size={15} />
            </button>
          </div>
          <div className="attention-list">
            {recent.map((ticket) => (
              <button
                key={ticket.id}
                className="attention-item"
                onClick={() => {
                  onTicket(ticket);
                  onPage('Inbox');
                }}
              >
                <div
                  className={`avatar customer-avatar ${ticket.priority === 'urgent' ? 'avatar-rose' : ticket.channel === 'Instagram' ? 'avatar-lime' : 'avatar-cyan'}`}
                >
                  {initial(ticket.customer)}
                </div>
                <div className="attention-copy">
                  <div className="attention-title">
                    <strong>{ticket.customer}</strong>
                    <span className={`priority-dot ${ticket.priority}`} />
                    {ticket.priority === 'urgent' && <span className="priority-word">Urgent</span>}
                  </div>
                  <div className="attention-subject">{ticket.subject}</div>
                  <p>{ticket.preview}</p>
                </div>
                <div className="attention-meta">
                  <span>{timeAgo(ticket.createdAt)}</span>
                  <span className={`channel-pill ${ticket.channel.toLowerCase()}`}>
                    {ticket.channel}
                  </span>
                </div>
              </button>
            ))}
            {!recent.length && !loading && (
              <div className="empty-state">No conversations yet. Add a ticket to get started.</div>
            )}
          </div>
          <button className="panel-footer-link" onClick={() => onPage('Inbox')}>
            See all conversations <ArrowRight size={14} />
          </button>
        </div>
        <div className="right-stack">
          <div className="panel orders-panel">
            <div className="panel-heading compact">
              <div>
                <h2>Recent orders</h2>
                <p>Fresh from your shop</p>
              </div>
              <button className="round-link" onClick={() => onPage('Orders')}>
                <ArrowRight size={15} />
              </button>
            </div>
            {orders.slice(0, 3).map((order, i) => (
              <div className="mini-order" key={order.orderNumber}>
                <div className={`order-art art-${i + 1}`}>
                  <Box size={15} />
                </div>
                <div className="order-copy">
                  <strong>{order.orderNumber}</strong>
                  <small>
                    {order.customer} · {timeAgo(order.placedAt)}
                  </small>
                </div>
                <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
            ))}
            {!orders.length && (
              <div className="empty-state">Your workspace is ready for its first order.</div>
            )}
          </div>
        </div>
      </section>
      <div className="footer-note">
        <span>Made for the people behind the shop.</span>
        <span>
          <span className="green-dot" /> All systems looking good
        </span>
      </div>
    </div>
  );
}

function Metric({ title, value, note, icon: Icon, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
      <div className={`metric-squiggle ${tone}`} />
    </div>
  );
}
