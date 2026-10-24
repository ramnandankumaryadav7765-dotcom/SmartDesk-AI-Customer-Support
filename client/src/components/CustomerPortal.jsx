import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CornerUpRight,
  Headphones,
  LifeBuoy,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import UserAvatar from './UserAvatar.jsx';

const dateLabel = (value) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );

export default function CustomerPortal({
  user,
  tickets,
  orders,
  knowledge,
  loading,
  error,
  theme,
  onToggleTheme,
  onProfile,
  onSubmit,
  onRefresh,
  onRequestReturn,
  onAskAssistant,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [selectedRequestType, setSelectedRequestType] = useState('return');
  const [articleQuery, setArticleQuery] = useState('');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantError, setAssistantError] = useState('');

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

  const submitReturnRequest = async (event) => {
    event.preventDefault();
    if (returnSubmitting) return;
    setReturnSubmitting(true);
    setReturnError('');
    const form = event.currentTarget;
    try {
      const saved = await onRequestReturn(Object.fromEntries(new FormData(form)));
      if (saved) form.reset();
    } catch (requestError) {
      setReturnError(requestError.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  const askAssistant = async (event) => {
    event.preventDefault();
    const question = assistantPrompt.trim();
    if (!question || assistantBusy) return;
    const history = assistantMessages;
    setAssistantPrompt('');
    setAssistantError('');
    setAssistantBusy(true);
    setAssistantMessages((messages) => [...messages, { role: 'user', text: question }]);
    try {
      const response = await onAskAssistant(question, history);
      setAssistantMessages((messages) => [
        ...messages,
        { role: 'assistant', text: response.answer },
      ]);
    } catch (requestError) {
      setAssistantError(requestError.message);
    } finally {
      setAssistantBusy(false);
    }
  };

  const eligibleThrough = (deliveredAt, windowDays) => {
    if (!deliveredAt || !windowDays) return null;
    const deadline = new Date(`${deliveredAt}T00:00:00.000Z`);
    deadline.setUTCDate(deadline.getUTCDate() + windowDays);
    return deadline.toISOString().slice(0, 10);
  };

  const policyForItem = (order, item) =>
    order?.itemPolicies?.find((policy) => policy.item === item) || order || {};

  const isEligible = (order, type, policy = order) => {
    if (!order || order.status !== 'Delivered' || !order.deliveredAt) return false;
    if (order.deliveredAt > new Date().toISOString().slice(0, 10)) return false;
    const days = type === 'return' ? policy?.returnWindowDays : policy?.exchangeWindowDays;
    const deadline = eligibleThrough(order.deliveredAt, days);
    return Boolean(deadline && new Date().toISOString().slice(0, 10) <= deadline);
  };

  const returnableOrders = orders.filter((order) =>
    order.items?.some((item) => isEligible(order, selectedRequestType, policyForItem(order, item))),
  );
  const selectedOrder = orders.find((order) => order.orderNumber === selectedOrderNumber);
  const eligibleItems =
    selectedOrder?.items?.filter((item) =>
      isEligible(selectedOrder, selectedRequestType, policyForItem(selectedOrder, item)),
    ) || [];
  const visibleArticles = knowledge.filter((article) =>
    `${article.title} ${article.category} ${article.content}`
      .toLowerCase()
      .includes(articleQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    const availableOrders = returnableOrders.length ? returnableOrders : orders;
    if (
      availableOrders.length &&
      !availableOrders.some((order) => order.orderNumber === selectedOrderNumber)
    ) {
      setSelectedOrderNumber(availableOrders[0].orderNumber);
    }
  }, [orders, selectedOrderNumber, selectedRequestType]);

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
          <nav className="customer-help-links" aria-label="Customer help shortcuts">
            <a href="#orders-help">
              <PackageCheck size={14} /> Orders & returns
            </a>
            <a href="#help-center">
              <BookOpen size={14} /> Help center
            </a>
            <a href="#ask-assistant">
              <Sparkles size={14} /> Ask AI
            </a>
          </nav>
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
              <button
                className="customer-ticket-refresh"
                type="button"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh your support requests"
                title="Refresh requests"
              >
                <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
              </button>
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
                  const staffReplies = (ticket.messages || []).filter(
                    (message) => message.role === 'staff',
                  );
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
                      {staffReplies.length ? (
                        <div className="customer-staff-replies" aria-label="Replies from support">
                          <strong className="customer-staff-reply-label">
                            <MessageCircle size={14} /> Replies from support
                          </strong>
                          {staffReplies.map((message, index) => (
                            <p key={`${message.createdAt || 'reply'}-${index}`}>{message.text}</p>
                          ))}
                        </div>
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

        <section className="customer-self-service" id="orders-help">
          <div className="customer-section-heading customer-self-service-heading">
            <span className="customer-section-icon ticket">
              <PackageCheck size={18} />
            </span>
            <div>
              <h2>Orders, returns & exchanges</h2>
              <p>Return and exchange windows are set for each order’s service type.</p>
            </div>
          </div>
          {orders.length ? (
            <div className="customer-orders-layout">
              <div className="customer-orders-list">
                {orders.map((order) => (
                  <article className="customer-order-card" key={order.orderNumber}>
                    <div className="customer-order-card-top">
                      <strong>{order.orderNumber}</strong>
                      <span className={`customer-order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <p>{order.items.join(', ')}</p>
                    <div className="customer-item-policy-list">
                      {order.items.map((item) => {
                        const policy = policyForItem(order, item);
                        return (
                          <div className="customer-item-policy" key={item}>
                            <strong>{item}</strong>
                            <span>{policy.serviceType || 'Service policy'}</span>
                            <span>Return {policy.returnWindowDays || 0}d</span>
                            <span>Exchange {policy.exchangeWindowDays || 0}d</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.deliveredAt ? (
                      <small>Delivered {dateLabel(order.deliveredAt)}</small>
                    ) : (
                      <small>Eligibility starts when delivery is recorded.</small>
                    )}
                    {order.deliveredAt && (
                      <div className="customer-order-deadlines">
                        {order.items.map((item) => {
                          const policy = policyForItem(order, item);
                          return (
                            <span key={`deadline-${item}`}>
                              {item}:{' '}
                              {policy.returnWindowDays > 0 && isEligible(order, 'return', policy)
                                ? `return through ${dateLabel(eligibleThrough(order.deliveredAt, policy.returnWindowDays))}`
                                : 'no active return window'}
                              {policy.exchangeWindowDays > 0 &&
                              isEligible(order, 'exchange', policy)
                                ? ` · exchange through ${dateLabel(eligibleThrough(order.deliveredAt, policy.exchangeWindowDays))}`
                                : ''}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <form className="customer-return-form" onSubmit={submitReturnRequest}>
                <span className="customer-help-kicker">
                  <CornerUpRight size={14} /> SELF-SERVICE
                </span>
                <h3>Request a return or exchange</h3>
                {!returnableOrders.length && (
                  <p className="customer-service-empty">
                    No delivered order is currently within the selected request window. You can
                    still contact support for help.
                  </p>
                )}
                {orders.length ? (
                  <>
                    <label>
                      Order
                      <select
                        name="orderNumber"
                        required
                        value={selectedOrderNumber}
                        onChange={(event) => setSelectedOrderNumber(event.target.value)}
                      >
                        {(returnableOrders.length ? returnableOrders : orders).map((order) => (
                          <option key={order.orderNumber} value={order.orderNumber}>
                            {order.orderNumber} · {order.serviceType || 'Order'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Item
                      <select name="item" required>
                        {(eligibleItems.length ? eligibleItems : selectedOrder?.items || []).map(
                          (item) => (
                            <option key={item}>{item}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      What would you like to do?
                      <select
                        name="requestType"
                        value={selectedRequestType}
                        onChange={(event) => setSelectedRequestType(event.target.value)}
                      >
                        <option value="return">Return</option>
                        <option value="exchange">Exchange</option>
                      </select>
                    </label>
                    <label>
                      Tell us a little more <span className="customer-optional">Optional</span>
                      <textarea
                        name="message"
                        rows={3}
                        maxLength={3000}
                        placeholder="Share the reason or preferred exchange…"
                      />
                    </label>
                    {returnError && (
                      <p className="customer-form-error" role="alert">
                        {returnError}
                      </p>
                    )}
                    <button
                      className="customer-submit-button"
                      type="submit"
                      disabled={returnSubmitting || !eligibleItems.length}
                    >
                      <Send size={15} /> {returnSubmitting ? 'Sending request…' : 'Submit request'}
                    </button>
                    <p className="customer-form-footnote">
                      We’ll verify eligibility and follow up in your support requests.
                    </p>
                  </>
                ) : (
                  <p className="customer-service-empty">
                    Add an order number to your account or contact support if you need help with a
                    purchase.
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="customer-service-empty customer-panel-empty">
              Your account doesn’t have any orders yet. If you need help with an order, contact
              support above and include its order number.
            </div>
          )}
        </section>

        <section className="customer-self-service" id="help-center">
          <div className="customer-section-heading customer-self-service-heading">
            <span className="customer-section-icon">
              <BookOpen size={18} />
            </span>
            <div>
              <h2>Help center</h2>
              <p>Browse the service and product guidance from our team.</p>
            </div>
            <input
              className="customer-article-search"
              type="search"
              value={articleQuery}
              onChange={(event) => setArticleQuery(event.target.value)}
              placeholder="Search help articles"
              aria-label="Search help articles"
            />
          </div>
          {visibleArticles.length ? (
            <div className="customer-article-grid">
              {visibleArticles.map((article) => (
                <article className="customer-article-card" key={article.id}>
                  <span>{article.category || 'Help article'}</span>
                  <h3>{article.title}</h3>
                  <p>{article.content}</p>
                  <small>Updated {dateLabel(article.updatedAt)}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="customer-service-empty customer-panel-empty">
              {knowledge.length
                ? 'No help articles match your search.'
                : 'Our help articles will appear here when they are available.'}
            </div>
          )}
        </section>

        <section className="customer-self-service customer-ai-help" id="ask-assistant">
          <div className="customer-section-heading customer-self-service-heading">
            <span className="customer-section-icon ai">
              <Sparkles size={18} />
            </span>
            <div>
              <h2>Ask SmartDesk</h2>
              <p>Get quick answers from service articles and your own order and request history.</p>
            </div>
          </div>
          <div className="customer-ai-layout">
            <div className="customer-ai-intro">
              <span className="customer-ai-mark">
                <Sparkles size={20} />
              </span>
              <h3>Need a quick answer?</h3>
              <p>
                Ask about a policy, delivery, return windows, or how to get help. For decisions that
                need a person, send a support request.
              </p>
              <div className="customer-ai-suggestions">
                <button
                  type="button"
                  onClick={() => setAssistantPrompt('What is your return policy?')}
                >
                  What is your return policy?
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantPrompt('How can I check my order?')}
                >
                  How can I check my order?
                </button>
              </div>
            </div>
            <div className="customer-ai-chat">
              <div className="customer-ai-messages" role="log" aria-live="polite">
                {!assistantMessages.length && (
                  <p className="customer-ai-empty">
                    <Headphones size={17} /> Ask a basic service question to get started.
                  </p>
                )}
                {assistantMessages.map((message, index) => (
                  <p
                    className={`customer-ai-message ${message.role}`}
                    key={`${message.role}-${index}`}
                  >
                    {message.text}
                  </p>
                ))}
                {assistantBusy && (
                  <p className="customer-ai-thinking">Checking your help information…</p>
                )}
              </div>
              {assistantError && (
                <p className="customer-form-error" role="alert">
                  {assistantError}
                </p>
              )}
              <form className="customer-ai-composer" onSubmit={askAssistant}>
                <textarea
                  value={assistantPrompt}
                  maxLength={2000}
                  onChange={(event) => setAssistantPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      askAssistant(event);
                    }
                  }}
                  rows={2}
                  placeholder="Ask about a service or order…"
                  aria-label="Ask SmartDesk a question"
                />
                <button
                  type="submit"
                  disabled={!assistantPrompt.trim() || assistantBusy}
                  aria-label="Send question"
                >
                  <Send size={16} />
                </button>
              </form>
              <small className="customer-ai-disclaimer">
                AI answers are a guide and don’t approve returns, exchanges, refunds, or changes to
                an order.
              </small>
            </div>
          </div>
        </section>
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
