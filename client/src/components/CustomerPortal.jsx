import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, LifeBuoy, MessageCircle, Send } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import UserAvatar from './UserAvatar.jsx';

const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function CustomerPortal({
  user,
  tickets,
  loading,
  error,
  theme,
  onToggleTheme,
  onProfile,
  onSubmit,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const submitRequest = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError('');
    const form = event.currentTarget;
    try {
      const saved = await onSubmit(Object.fromEntries(new FormData(form)));
      if (saved) form.reset();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-portal">
      <header className="customer-portal-header">
        <a className="customer-brand" href="#home" aria-label="SmartDesk Support home">
          <span className="customer-brand-mark">
            <LifeBuoy size={18} />
          </span>
          <span>
            SmartDesk <small>SUPPORT</small>
          </span>
        </a>
        <div className="customer-header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
          <button
            className="customer-account-button"
            type="button"
            onClick={onProfile}
            aria-label="Open your account profile"
          >
            <UserAvatar user={user} className="avatar customer-account-avatar" />
            <span>{user.name}</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <main className="customer-portal-main" id="home">
        <section className="customer-portal-welcome">
          <span className="customer-portal-kicker">
            <span /> CUSTOMER SUPPORT
          </span>
          <h1>How can we help, {user.name.split(/\s+/)[0]}?</h1>
          <p>Send us a message and our support team will get back to you here.</p>
        </section>

        <div className="customer-portal-grid">
          <section className="customer-request-card">
            <div className="customer-section-heading">
              <span className="customer-section-icon">
                <MessageCircle size={18} />
              </span>
              <div>
                <h2>Contact support</h2>
                <p>Tell us what happened. Add your order number if it relates to a purchase.</p>
              </div>
            </div>
            <form className="customer-request-form" onSubmit={submitRequest}>
              <label>
                Subject
                <input
                  name="subject"
                  maxLength={140}
                  placeholder="What do you need help with?"
                  required
                />
              </label>
              <label>
                Order number <span className="customer-optional">Optional</span>
                <input name="orderNumber" maxLength={80} placeholder="e.g. SD-10482" />
              </label>
              <label>
                Your message
                <textarea
                  name="message"
                  rows={6}
                  maxLength={5000}
                  placeholder="Describe the issue and how we can help…"
                  required
                />
              </label>
              <div className="customer-contact-note">
                <span>We’ll reply to</span>
                <strong>{user.contactEmail || user.email}</strong>
                {user.phone && <span> · {user.phone}</span>}
                <button type="button" onClick={onProfile}>
                  Update contact info
                </button>
              </div>
              {formError && (
                <p className="customer-form-error" role="alert">
                  {formError}
                </p>
              )}
              <button className="customer-submit-button" type="submit" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Sending request…' : 'Send support request'}
              </button>
              <p className="customer-form-footnote">
                You can follow replies and updates in this account.
              </p>
            </form>
          </section>

          <section className="customer-ticket-panel">
            <div className="customer-section-heading customer-ticket-heading">
              <span className="customer-section-icon ticket">
                <Clock3 size={18} />
              </span>
              <div>
                <h2>Your requests</h2>
                <p>Private to your account</p>
              </div>
              <span className="customer-ticket-count">{tickets.length}</span>
            </div>
            {error && (
              <div className="customer-inline-error" role="alert">
                {error}
              </div>
            )}
            {loading ? (
              <div className="customer-ticket-empty">Loading your requests…</div>
            ) : tickets.length ? (
              <div className="customer-ticket-list">
                {tickets.map((ticket) => {
                  const staffReply = [...(ticket.messages || [])]
                    .reverse()
                    .find((message) => message.role === 'staff');
                  const resolved = ticket.status === 'resolved';
                  const statusLabel =
                    ticket.status === 'pending' ? 'Pending' : resolved ? 'Resolved' : 'Open';
                  return (
                    <article className="customer-ticket-card" key={ticket.id}>
                      <div className="customer-ticket-card-top">
                        <span className={`customer-ticket-status ${resolved ? 'resolved' : ''}`}>
                          {resolved ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                          {statusLabel}
                        </span>
                        <time dateTime={ticket.createdAt}>{dateLabel(ticket.createdAt)}</time>
                      </div>
                      <h3>{ticket.subject}</h3>
                      {ticket.orderNumber && (
                        <span className="customer-order-reference">Order {ticket.orderNumber}</span>
                      )}
                      <p className="customer-ticket-preview">{ticket.preview}</p>
                      {staffReply ? (
                        <details className="customer-staff-reply">
                          <summary>
                            <MessageCircle size={14} /> Support replied
                          </summary>
                          <p>{staffReply.text}</p>
                        </details>
                      ) : (
                        <div className="customer-waiting-note">Our team will reply here.</div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="customer-ticket-empty">
                <span>
                  <MessageCircle size={21} />
                </span>
                <strong>No requests yet</strong>
                <p>Your messages and support replies will appear here.</p>
              </div>
            )}
          </section>
        </div>
        <footer className="customer-portal-footer">
          <span>
            <LifeBuoy size={14} /> Your support history is private to your account.
          </span>
          <span>SmartDesk Support</span>
        </footer>
      </main>
    </div>
  );
}
