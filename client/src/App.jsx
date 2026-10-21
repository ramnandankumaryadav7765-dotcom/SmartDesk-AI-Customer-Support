import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import NewTicketModal from './components/NewTicketModal.jsx';
import Toast from './components/Toast.jsx';
import OverviewPage from './components/pages/OverviewPage.jsx';
import InboxPage from './components/pages/InboxPage.jsx';
import OrdersPage from './components/pages/OrdersPage.jsx';
import KnowledgePage from './components/pages/KnowledgePage.jsx';
import { CircleHelp } from 'lucide-react';
import { smartdeskApi } from './api/smartdesk.js';

function App() {
  const [page, setPage] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [sources, setSources] = useState([]);
  const [aiSource, setAiSource] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    try {
      const workspace = await smartdeskApi.loadWorkspace();
      setOverview(workspace.overview);
      setTickets(workspace.tickets);
      setOrders(workspace.orders);
      setKnowledge(workspace.knowledge);
      setSelectedId((current) => current || workspace.tickets[0]?.id || null);
      setError('');
    } catch (err) {
      setError(`${err.message} Start the app with npm run dev.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        `${ticket.customer} ${ticket.subject} ${ticket.orderNumber}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [tickets, query],
  );

  const openTicket = (ticket) => {
    setSelectedId(ticket.id);
    setReply('');
    setSources([]);
    setAiSource('');
  };
  const draftReply = async (ticket = selected) => {
    if (!ticket) return;
    const customerMessage =
      ticket.messages
        ?.filter((message) => message.role === 'customer')
        .map((message) => message.text)
        .join('\n') || ticket.preview;
    setLoadingAI(true);
    setReply('');
    try {
      const data = await smartdeskApi.draftReply(
        `${customerMessage}\n\nOrder number: ${ticket.orderNumber}`,
      );
      setReply(data.draft);
      setSources(data.articles || []);
      setAiSource(data.source || 'AI draft');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const tryDraft = () => {
    const ticket = tickets.find((item) => item.status !== 'resolved') || tickets[0];
    if (!ticket) {
      setNotice('Add a ticket before drafting a reply.');
      return;
    }
    openTicket(ticket);
    setPage('Inbox');
    draftReply(ticket);
  };

  const markResolved = async () => {
    if (!selected) return;
    try {
      const updated = await smartdeskApi.setTicketStatus(
        selected.id,
        selected.status === 'resolved' ? 'open' : 'resolved',
      );
      setTickets((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.status === 'resolved' ? 'Ticket marked as resolved' : 'Ticket reopened');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const saveReply = async () => {
    if (!selected || !reply.trim()) return;
    try {
      const data = await smartdeskApi.saveReply(selected.id, reply);
      setTickets((items) => items.map((item) => (item.id === data.id ? data : item)));
      setReply('');
      setNotice('Reply saved to the ticket timeline');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await smartdeskApi.createTicket(Object.fromEntries(form));
      await refresh();
      setSelectedId(data.id);
      setPage('Inbox');
      setShowNew(false);
      setNotice('New ticket added to the inbox');
    } catch (err) {
      setNotice(err.message);
    }
  };

  const createArticle = async (event) => {
    event.preventDefault();
    try {
      const data = await smartdeskApi.createArticle(
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      setKnowledge((items) => [data, ...items]);
      setNotice('Knowledge article added');
      return true;
    } catch (err) {
      setNotice(err.message);
      return false;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} openCount={overview?.openTickets || 0} onNavigate={setPage} />

      <main className="main-area">
        <Topbar
          page={page}
          query={query}
          onQueryChange={setQuery}
          onNotify={() => setNotice('You’re all caught up.')}
        />
        {error && (
          <div className="error-banner">
            <CircleHelp size={17} />
            <span>{error}</span>
          </div>
        )}
        {page === 'Overview' && (
          <OverviewPage
            overview={overview}
            tickets={tickets}
            orders={orders}
            onPage={setPage}
            onTicket={openTicket}
            onNew={() => setShowNew(true)}
            onTryDraft={tryDraft}
            loading={loading}
          />
        )}
        {page === 'Inbox' && (
          <InboxPage
            tickets={filteredTickets}
            query={query}
            onQueryChange={setQuery}
            selected={selected}
            onSelect={openTicket}
            onNew={() => setShowNew(true)}
            onDraft={draftReply}
            onResolve={markResolved}
            onSaveReply={saveReply}
            reply={reply}
            setReply={setReply}
            sources={sources}
            aiSource={aiSource}
            loadingAI={loadingAI}
          />
        )}
        {page === 'Orders' && <OrdersPage orders={orders} query={query} />}
        {page === 'Knowledge base' && (
          <KnowledgePage knowledge={knowledge} onCreate={createArticle} />
        )}
      </main>
      <NewTicketModal open={showNew} onClose={() => setShowNew(false)} onSubmit={createTicket} />
      <Toast message={notice} />
    </div>
  );
}

export default App;
