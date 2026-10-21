import { useRef, useState } from 'react';
import {
  ArrowDownLeft,
  BookOpen,
  CheckCheck,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { initial, timeAgo } from '../../lib/formatters.js';

export default function InboxPage({
  tickets,
  query,
  onQueryChange,
  selected,
  onSelect,
  onNew,
  onDraft,
  onResolve,
  onSaveReply,
  reply,
  setReply,
  sources,
  aiSource,
  loadingAI,
  user,
}) {
  const [filter, setFilter] = useState('All');
  const replyRef = useRef(null);
  const shown = tickets.filter((ticket) =>
    filter === 'All'
      ? ticket.status !== 'resolved'
      : filter === 'Resolved'
        ? ticket.status === 'resolved'
        : ticket.priority === 'urgent' && ticket.status !== 'resolved',
  );
  return (
    <div className="inbox-layout">
      <section className="inbox-list-pane">
        <div className="inbox-title-row">
          <div>
            <div className="eyebrow">SUPPORT</div>
            <h1>
              Inbox{' '}
              <span className="title-count">
                {tickets.filter((t) => t.status !== 'resolved').length}
              </span>
            </h1>
          </div>
          <button className="new-square" onClick={onNew} aria-label="Create ticket">
            <Plus size={18} />
          </button>
        </div>
        <div className="inbox-tools">
          <label className="inbox-search">
            <Search size={15} />
            <input
              placeholder="Search conversations"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>
        </div>
        <div className="filter-tabs">
          {['All', 'Urgent', 'Resolved'].map((name) => (
            <button
              onClick={() => setFilter(name)}
              className={filter === name ? 'selected' : ''}
              key={name}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="ticket-list">
          {shown.map((ticket) => (
            <button
              className={`ticket-row ${selected?.id === ticket.id ? 'selected' : ''}`}
              onClick={() => onSelect(ticket)}
              key={ticket.id}
            >
              <div
                className={`avatar customer-avatar ${ticket.priority === 'urgent' ? 'avatar-rose' : 'avatar-cyan'}`}
              >
                {initial(ticket.customer)}
              </div>
              <div className="ticket-row-main">
                <div className="ticket-row-top">
                  <strong>{ticket.customer}</strong>
                  <span>{timeAgo(ticket.createdAt)}</span>
                </div>
                <div className="ticket-row-subject">{ticket.subject}</div>
                <p>{ticket.preview}</p>
                <span className="ticket-channel">
                  {ticket.channel}
                  <i />
                  {ticket.orderNumber}
                </span>
              </div>
            </button>
          ))}
          {!shown.length && <div className="empty-state">Nothing in this view.</div>}
        </div>
      </section>
      <section className="ticket-detail-pane">
        {selected ? (
          <>
            <div className="ticket-detail-head">
              <div>
                <div className="ticket-breadcrumb">
                  Inbox <span>/</span> {selected.channel}
                </div>
                <h2>{selected.subject}</h2>
                <div className="ticket-head-meta">
                  <span className="status-chip">
                    <i className={selected.status} />
                    {selected.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                  <span>·</span>
                  <span>Created {timeAgo(selected.createdAt)}</span>
                  <span>·</span>
                  <span>{selected.orderNumber}</span>
                </div>
              </div>
              <div className="detail-actions">
                <button className="resolve-button" onClick={onResolve}>
                  {selected.status === 'resolved' ? (
                    <>
                      <ArrowDownLeft size={15} /> Reopen
                    </>
                  ) : (
                    <>
                      <CheckCheck size={15} /> Resolve
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="conversation-thread">
              <div className="thread-day">
                Today <span />
              </div>
              <div className="message-row">
                <div
                  className={`avatar customer-avatar ${selected.priority === 'urgent' ? 'avatar-rose' : 'avatar-cyan'}`}
                >
                  {initial(selected.customer)}
                </div>
                <div className="message-content">
                  <div className="message-byline">
                    <strong>{selected.customer}</strong>
                    <span>{timeAgo(selected.createdAt)}</span>
                  </div>
                  <div className="customer-bubble">
                    {selected.messages?.[0]?.text || selected.preview}
                  </div>
                  <div className="customer-mini">
                    <span>{selected.email || 'Customer'}</span>
                    <span className="mini-dot" /> <span>Order {selected.orderNumber}</span>
                  </div>
                </div>
              </div>
              {selected.messages?.length > 1 &&
                selected.messages.slice(1).map((message, i) => (
                  <div className="message-row own-message" key={i}>
                    <div className="avatar profile-avatar">
                      {user.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="message-content">
                      <div className="message-byline">
                        <strong>{user.name}</strong>
                        <span>{message.createdAt ? timeAgo(message.createdAt) : 'Just now'}</span>
                      </div>
                      <div className="staff-bubble">{message.text}</div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="reply-area">
              <div className="reply-toolbar">
                <span>Reply to {selected.customer.split(' ')[0]}</span>
                <button className="ai-draft-button" onClick={onDraft} disabled={loadingAI}>
                  <Sparkles size={14} />
                  {loadingAI ? 'Thinking…' : 'Draft with AI'}
                </button>
              </div>
              {reply && (
                <div className="ai-draft-card">
                  <div className="draft-card-head">
                    <span>
                      <Sparkles size={14} /> AI suggested reply
                    </span>
                    <span className="draft-mode">{aiSource}</span>
                  </div>
                  <div className="draft-text">{reply}</div>
                  {sources.length > 0 && (
                    <div className="source-chips">
                      <span>Based on</span>
                      {sources.map((source) => (
                        <span className="source-chip" key={source.id}>
                          <BookOpen size={11} />
                          {source.title}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="draft-actions">
                    <button onClick={() => setReply('')}>Discard</button>
                    <button className="use-draft" onClick={() => replyRef.current?.focus()}>
                      Edit reply <ArrowDownLeft size={13} />
                    </button>
                  </div>
                </div>
              )}
              <textarea
                ref={replyRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a thoughtful reply..."
              />
              <div className="reply-bottom">
                <span>
                  <span className="green-dot" /> Saved in SmartDesk only
                </span>
                <button className="send-button" onClick={onSaveReply} disabled={!reply.trim()}>
                  <Send size={14} /> Save reply
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-detail">
            <MessageCircle size={28} />
            <h2>Choose a conversation</h2>
            <p>Select a ticket from the inbox to read and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}
