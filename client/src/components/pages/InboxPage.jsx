import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowDownLeft,
  BarChart3,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  Clock3,
  Command,
  Inbox,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { initial, timeAgo } from '../../lib/formatters.js';

const filters = ['All conversations', 'Urgent', 'Resolved'];

function getLatestText(ticket) {
  return ticket.messages?.at(-1)?.text || ticket.preview || '';
}

function getSentiment(ticket) {
  const text = `${ticket.subject || ''} ${ticket.preview || ''} ${getLatestText(ticket)}`.toLowerCase();
  const negative = /angry|frustrat|broken|wrong|late|missing|refund|cancel|terrible|issue|problem|not received|unacceptable|urgent|disappointed/;
  const positive = /thank|great|love|perfect|excellent|appreciate|wonderful|happy/;
  if (ticket.priority === 'urgent' || negative.test(text)) return { label: 'Needs attention', tone: 'critical' };
  if (positive.test(text)) return { label: 'Positive', tone: 'positive' };
  return { label: 'Neutral', tone: 'neutral' };
}

function getIntent(ticket) {
  const text = `${ticket.subject || ''} ${ticket.preview || ''} ${getLatestText(ticket)}`.toLowerCase();
  if (/refund|return|exchange|cancel/.test(text)) return 'Refund or return';
  if (/track|where is|delivery|shipped|shipping|late|arriv/.test(text)) return 'Order tracking';
  if (/damaged|broken|defect|not working|wrong item/.test(text)) return 'Product issue';
  if (/bill|payment|charge|invoice/.test(text)) return 'Billing question';
  if (/account|password|sign in|login/.test(text)) return 'Account access';
  return 'General support';
}

function StatusPill({ ticket }) {
  const resolved = ticket.status === 'resolved';
  const escalated = ticket.priority === 'urgent' && !resolved;
  return (
    <span className={`sd-status ${resolved ? 'is-resolved' : escalated ? 'is-escalated' : 'is-open'}`}>
      <span className="sd-status-dot" />
      {resolved ? 'Resolved' : escalated ? 'Human review' : 'Open'}
    </span>
  );
}

function TicketRow({ ticket, active, onClick }) {
  const sentiment = getSentiment(ticket);
  const latest = getLatestText(ticket);
  return (
    <button
      type="button"
      className={`sd-queue-row ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      aria-label={`${ticket.customer}, ${ticket.subject}, ${ticket.priority} priority`}
    >
      <span className={`sd-avatar sd-avatar-${sentiment.tone}`} aria-hidden="true">
        {initial(ticket.customer)}
      </span>
      <span className="sd-queue-copy">
        <span className="sd-queue-top">
          <strong>{ticket.customer}</strong>
          <time dateTime={ticket.createdAt}>{timeAgo(ticket.createdAt)}</time>
        </span>
        <span className="sd-queue-subject">{ticket.subject}</span>
        <span className="sd-queue-preview">{latest}</span>
        <span className="sd-queue-meta">
          <span className={`sd-tag sd-tag-${ticket.priority || 'normal'}`}>
            {ticket.priority === 'urgent' ? 'Urgent' : ticket.priority === 'high' ? 'High' : 'Normal'}
          </span>
          <span className={`sd-sentiment sd-sentiment-${sentiment.tone}`}>
            <span /> {sentiment.label}
          </span>
        </span>
      </span>
    </button>
  );
}

function QueueColumn({ tickets, query, onQueryChange, selected, onSelect, onNew, loading }) {
  const [filter, setFilter] = useState('All conversations');
  const sortedTickets = useMemo(() => {
    const rank = { urgent: 0, high: 1, normal: 2 };
    return [...tickets].sort(
      (a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) ||
        new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [tickets]);
  const shown = sortedTickets.filter((ticket) => {
    if (filter === 'Resolved') return ticket.status === 'resolved';
    if (filter === 'Urgent') return ticket.priority === 'urgent' && ticket.status !== 'resolved';
    return true;
  });

  return (
    <aside className="sd-queue" aria-label="Conversation queue">
      <div className="sd-queue-heading">
        <div>
          <span className="sd-kicker">CUSTOMER CARE</span>
          <h1>Inbox <span>{tickets.filter((ticket) => ticket.status !== 'resolved').length}</span></h1>
        </div>
        <button className="sd-icon-button sd-create-button" type="button" onClick={onNew} aria-label="Create ticket">
          <Plus size={19} />
        </button>
      </div>

      <label className="sd-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search conversations</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search conversations" />
        <kbd><Command size={11} /> K</kbd>
      </label>

      <div className="sd-filter-wrap">
        {filters.map((name) => (
          <button
            key={name}
            type="button"
            className={`sd-filter ${filter === name ? 'is-selected' : ''}`}
            onClick={() => setFilter(name)}
            aria-pressed={filter === name}
          >
            {name === 'Urgent' && <CircleAlert size={14} />}
            {name}
            {name === 'Urgent' && tickets.filter((ticket) => ticket.priority === 'urgent' && ticket.status !== 'resolved').length > 0 && (
              <span className="sd-filter-count">{tickets.filter((ticket) => ticket.priority === 'urgent' && ticket.status !== 'resolved').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="sd-queue-subhead"><span>{filter}</span></div>

      <div className="sd-queue-list" role="region" aria-label="Tickets sorted by urgency">
        {loading && Array.from({ length: 5 }, (_, index) => (
          <div className="sd-skeleton-row" key={index} aria-hidden="true"><i /><span><b /><b /><b /></span></div>
        ))}
        {!loading && shown.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} active={selected?.id === ticket.id} onClick={() => onSelect(ticket)} />
        ))}
        {!loading && !shown.length && (
          <div className="sd-queue-empty">
            <Inbox size={23} />
            <strong>{query ? 'No matching conversations' : 'Your inbox is clear'}</strong>
            <span>{query ? 'Try another name or keyword.' : 'New customer messages will show up here.'}</span>
          </div>
        )}
      </div>
      <div className="sd-queue-footer"><span className="sd-live-dot" /> Your queue <span>·</span> Sorted by urgency</div>
    </aside>
  );
}

function MessageFeed({ ticket, user }) {
  return (
    <div className="sd-message-feed" role="log" aria-label={`Conversation with ${ticket.customer}`} aria-live="polite" aria-relevant="additions text">
      <div className="sd-feed-day"><span />Conversation history<span /></div>
      {(ticket.messages?.length ? ticket.messages : [{ role: 'customer', text: ticket.preview }]).map((message, index) => {
        const fromStaff = message.role === 'staff';
        return (
          <article className={`sd-message ${fromStaff ? 'from-agent' : 'from-customer'}`} key={`${ticket.id}-${index}`}>
            {!fromStaff && <div className="sd-avatar sd-avatar-customer" aria-hidden="true">{initial(ticket.customer)}</div>}
            <div className="sd-message-body">
              <div className="sd-message-byline">
                <strong>{fromStaff ? user.name : ticket.customer}</strong>
                <time>{message.createdAt ? timeAgo(message.createdAt) : index === 0 ? timeAgo(ticket.createdAt) : 'Just now'}</time>
              </div>
              <div className={`sd-bubble ${fromStaff ? 'sd-bubble-agent' : 'sd-bubble-customer'}`}>{message.text}</div>
              {!fromStaff && index === 0 && (
                <span className="sd-message-detail"><Mail size={12} /> {ticket.email || ticket.channel || 'Customer'}</span>
              )}
            </div>
            {fromStaff && <div className="sd-avatar sd-avatar-agent" aria-hidden="true">{initial(user.name)}</div>}
          </article>
        );
      })}
    </div>
  );
}

function ConversationColumn({ ticket, user, onResolve, onDraft, onSaveReply, onBack, reply, setReply, sources, aiSource, loadingAI }) {
  const replyRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  return (
    <section className="sd-conversation" aria-label="Active conversation">
      {ticket ? (
        <>
          <header className="sd-conversation-header">
            <button type="button" className="sd-mobile-back" onClick={onBack} aria-label="Back to inbox"><ArrowLeft size={17} /></button>
            <div className="sd-conversation-title">
              <div className="sd-breadcrumb">Inbox <span>/</span> {ticket.channel || 'Web'} <span>/</span> <span className="sd-ticket-id">{ticket.orderNumber || 'Support request'}</span></div>
              <h2>{ticket.subject}</h2>
              <div className="sd-title-meta"><StatusPill ticket={ticket} /><span>{ticket.priority === 'urgent' ? 'Escalated for human review' : ticket.priority === 'high' ? 'High priority' : 'Assigned to you'}</span></div>
            </div>
            <div className="sd-header-actions">
              <button type="button" className="sd-secondary-button" onClick={onResolve}>
                {ticket.status === 'resolved' ? <><ArrowDownLeft size={16} /> Reopen</> : <><CheckCheck size={16} /> Resolve</>}
              </button>
              <button type="button" className="sd-icon-button sd-more-button" onClick={() => setShowDetails((value) => !value)} aria-label="Toggle conversation details" aria-expanded={showDetails}><MoreHorizontal size={19} /></button>
            </div>
          </header>
          {showDetails && <div className="sd-inline-details"><span>Channel: {ticket.channel || 'Web'}</span><span>Priority: {ticket.priority || 'normal'}</span><span>Created: {new Date(ticket.createdAt).toLocaleString()}</span><button type="button" onClick={() => setShowDetails(false)} aria-label="Close details"><X size={14} /></button></div>}

          <MessageFeed ticket={ticket} user={user} />

          <div className="sd-composer-wrap">
            {reply && (
              <section className="sd-ai-suggestion" aria-label="AI suggested reply">
                <div className="sd-ai-suggestion-head">
                  <span><Sparkles size={15} /> Suggested reply</span>
                  <span className="sd-ai-source">{aiSource || 'AI draft'}</span>
                </div>
                <p>{reply}</p>
                {sources.length > 0 && <div className="sd-ai-sources"><BookOpen size={13} /> Grounded in {sources.map((source) => source.title).join(', ')}</div>}
                <div className="sd-suggestion-actions"><button type="button" onClick={() => setReply('')}>Discard</button><button type="button" className="sd-edit-suggestion" onClick={() => replyRef.current?.focus()}>Edit in composer <ArrowDownLeft size={14} /></button></div>
              </section>
            )}
            {loadingAI && <div className="sd-ai-loading" role="status"><span /><span /><span /> Drafting a thoughtful reply…</div>}
            <div className="sd-composer">
              <div className="sd-composer-top"><span>Reply to <strong>{ticket.customer.split(' ')[0]}</strong></span><button type="button" className="sd-ai-button" onClick={onDraft} disabled={loadingAI}><Sparkles size={15} />{loadingAI ? 'Thinking…' : 'Suggest reply'}</button></div>
              <label className="sr-only" htmlFor="sd-reply">Write a reply</label>
              <textarea id="sd-reply" ref={replyRef} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a thoughtful reply…" rows={3} />
              <div className="sd-composer-bottom"><span><ShieldCheck size={14} /> Saved to your SmartDesk timeline</span><button type="button" className="sd-send-button" onClick={onSaveReply} disabled={!reply.trim()}><Send size={15} /> Save reply</button></div>
            </div>
            <p className="sd-composer-hint">Press Enter for a new line <span>·</span> AI suggestions are drafts for you to review</p>
          </div>
        </>
      ) : (
        <div className="sd-no-selection"><div><MessageCircle size={25} /></div><h2>Select a conversation</h2><p>Choose a customer from your queue to see their message history and account context.</p></div>
      )}
    </section>
  );
}

function InsightsColumn({ ticket }) {
  if (!ticket) return <aside className="sd-insights sd-insights-empty" aria-label="Customer insights"><div className="sd-insights-placeholder"><BarChart3 size={24} /><strong>Customer insights</strong><span>Select a conversation to see its account context.</span></div></aside>;
  const sentiment = getSentiment(ticket);
  const intent = getIntent(ticket);
  const messageCount = ticket.messages?.length || (ticket.preview ? 1 : 0);
  const customerSince = new Date(ticket.createdAt);
  return (
    <aside className="sd-insights" aria-label="Customer profile and AI insights">
      <div className="sd-insights-heading"><div><span className="sd-kicker">CUSTOMER CONTEXT</span><h2>Insights</h2></div></div>
      <section className="sd-profile-card">
        <div className="sd-profile-top"><div className="sd-avatar sd-avatar-profile">{initial(ticket.customer)}</div><span className="sd-customer-online"><i /> Customer</span></div>
        <h3>{ticket.customer}</h3>
        <a href={ticket.email ? `mailto:${encodeURIComponent(ticket.email)}` : undefined} className={!ticket.email ? 'is-unavailable' : ''}><Mail size={14} />{ticket.email || 'Email not provided'}</a>
        <div className="sd-profile-divider" />
        <div className="sd-profile-facts"><div><span>Customer since</span><strong>{Number.isNaN(customerSince.getTime()) ? '—' : customerSince.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</strong></div><div><span>Conversation</span><strong>{ticket.channel || 'Web'}</strong></div></div>
      </section>

      <section className="sd-insight-card">
        <div className="sd-card-title"><span className="sd-title-icon sd-purple"><Sparkles size={15} /></span><h3>Message insights</h3><span className="sd-live-label">TEXT</span></div>
        <div className="sd-insight-row"><span>Detected intent</span><strong>{intent}</strong></div>
        <div className="sd-insight-row"><span>Priority</span><strong className={`sd-priority-value is-${ticket.priority || 'normal'}`}>{ticket.priority || 'Normal'}</strong></div>
        <div className={`sd-escalation ${ticket.priority === 'urgent' ? 'needs-human' : 'ai-ready'}`}>
          {ticket.priority === 'urgent' ? <CircleAlert size={15} /> : <Sparkles size={15} />}
          <span>{ticket.priority === 'urgent' ? 'Human review recommended' : 'AI reply assist available'}</span>
        </div>
      </section>

      <section className="sd-insight-card sd-sentiment-card">
        <div className="sd-card-title"><span className="sd-title-icon sd-green"><Smile size={15} /></span><h3>Sentiment signal</h3></div>
        <div className={`sd-sentiment-meter mood-${sentiment.tone}`}><div className="sd-meter-icon"><Smile size={19} /></div><div><strong>{sentiment.label}</strong><span>Estimated from this conversation</span></div></div>
        <div className="sd-meter-track" aria-label={`Sentiment estimate: ${sentiment.label}`}><span className={`meter-${sentiment.tone}`} /></div>
        <p className="sd-estimate-note">Keyword-based estimate; use your judgment for customer tone.</p>
      </section>

      <section className="sd-insight-card sd-activity-card">
        <div className="sd-card-title"><span className="sd-title-icon sd-blue"><BarChart3 size={15} /></span><h3>Conversation</h3></div>
        <div className="sd-activity-stats"><div><MessageCircle size={15} /><strong>{messageCount}</strong><span>messages</span></div><div><Clock3 size={15} /><strong>{timeAgo(ticket.createdAt)}</strong><span>started</span></div></div>
        {ticket.orderNumber && <div className="sd-linked-order"><span>Linked order</span><strong>{ticket.orderNumber}</strong><ChevronDown size={15} /></div>}
      </section>

      <div className="sd-insights-foot"><Check size={13} /> Private to your workspace</div>
    </aside>
  );
}

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
  loading = false,
  user,
}) {
  const [theme, setTheme] = useState('light');
  const [mobileConversation, setMobileConversation] = useState(false);
  return (
    <div className={`sd-inbox-workspace theme-${theme} ${mobileConversation ? 'mobile-conversation' : ''}`}>
      <QueueColumn tickets={tickets} query={query} onQueryChange={onQueryChange} selected={selected} onSelect={(ticket) => { onSelect(ticket); setMobileConversation(true); }} onNew={onNew} loading={loading} />
      <ConversationColumn ticket={selected} user={user} onResolve={onResolve} onDraft={onDraft} onSaveReply={onSaveReply} onBack={() => setMobileConversation(false)} reply={reply} setReply={setReply} sources={sources} aiSource={aiSource} loadingAI={loadingAI} />
      <InsightsColumn ticket={selected} />
      <button type="button" className="sd-theme-toggle" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title="Toggle appearance"><span className="sd-theme-swatch" />{theme === 'light' ? 'Light' : 'Dark'}</button>
    </div>
  );
}
