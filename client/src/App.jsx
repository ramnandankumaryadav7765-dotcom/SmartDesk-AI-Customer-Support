import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import NewTicketModal from './components/NewTicketModal.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import CustomerPortal from './components/CustomerPortal.jsx';
import Toast from './components/Toast.jsx';
import OverviewPage from './components/pages/OverviewPage.jsx';
import InboxPage from './components/pages/InboxPage.jsx';
import OrdersPage from './components/pages/OrdersPage.jsx';
import KnowledgePage from './components/pages/KnowledgePage.jsx';
import AssistantPage from './components/pages/AssistantPage.jsx';
import { smartdeskApi } from './api/smartdesk.js';
import { signInWithGoogle, signOutFromFirebase } from './firebase.js';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('smartdesk-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerKnowledge, setCustomerKnowledge] = useState([]);
  const [customerTicketLoading, setCustomerTicketLoading] = useState(false);
  const [customerTicketError, setCustomerTicketError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [sources, setSources] = useState([]);
  const [aiSource, setAiSource] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const assistantRequestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('smartdesk-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  const refresh = async () => {
    const workspace = await smartdeskApi.loadWorkspace();
    setOverview(workspace.overview);
    setTickets(workspace.tickets);
    setOrders(workspace.orders);
    setKnowledge(workspace.knowledge);
    setSelectedId((current) => current || workspace.tickets[0]?.id || null);
    setError('');
  };

  const refreshCustomerTickets = async ({ silent = false } = {}) => {
    if (!silent) setCustomerTicketLoading(true);
    setCustomerTicketError('');
    try {
      const myTickets = await smartdeskApi.loadMyTickets();
      setCustomerTickets(myTickets);
    } catch (requestError) {
      setCustomerTicketError(requestError.message);
    } finally {
      if (!silent) setCustomerTicketLoading(false);
    }
  };

  const refreshCustomerPortal = async () => {
    setCustomerTicketLoading(true);
    setCustomerTicketError('');
    try {
      const portal = await smartdeskApi.loadCustomerPortal();
      setCustomerTickets(portal.tickets);
      setCustomerOrders(portal.orders);
      setCustomerKnowledge(portal.knowledge);
    } catch (requestError) {
      setCustomerTicketError(requestError.message);
    } finally {
      setCustomerTicketLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    smartdeskApi
      .me()
      .then(async ({ user: signedInUser }) => {
        if (!mounted) return;
        setUser(signedInUser);
        if (signedInUser) {
          if (signedInUser.role === 'admin') {
            try {
              await refresh();
            } catch (requestError) {
              setError(`${requestError.message} Restart the app with npm run dev.`);
            }
          } else {
            await refreshCustomerPortal();
          }
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message);
      })
      .finally(() => {
        if (mounted) {
          setCheckingSession(false);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'customer') return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshCustomerTickets({ silent: true });
      }
    };
    const interval = window.setInterval(refreshWhenVisible, 15000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user?.role]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        `${ticket.customer} ${ticket.subject} ${ticket.orderNumber} ${ticket.email} ${ticket.preview}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [tickets, query],
  );

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const ticketResults = tickets
      .filter((ticket) =>
        `${ticket.customer} ${ticket.subject} ${ticket.orderNumber} ${ticket.email} ${ticket.preview}`
          .toLowerCase()
          .includes(term),
      )
      .map((item) => ({
        kind: 'Ticket',
        target: 'Inbox',
        item,
        title: item.subject || 'Support ticket',
        detail: `${item.customer || 'Customer'}${item.orderNumber ? ` · ${item.orderNumber}` : ''}`,
      }));
    const orderResults = orders
      .filter((order) =>
        `${order.orderNumber} ${order.customer} ${order.email} ${order.status} ${order.items?.join(' ')}`
          .toLowerCase()
          .includes(term),
      )
      .map((item) => ({
        kind: 'Order',
        target: 'Orders',
        item,
        title: item.orderNumber,
        detail: `${item.customer || 'Customer'} · ${item.status}`,
      }));
    const articleResults = knowledge
      .filter((article) =>
        `${article.title} ${article.category} ${article.content}`.toLowerCase().includes(term),
      )
      .map((item) => ({
        kind: 'Article',
        target: 'Knowledge base',
        item,
        title: item.title,
        detail: item.category || 'Knowledge base',
      }));
    return [...ticketResults, ...orderResults, ...articleResults].slice(0, 8);
  }, [tickets, orders, knowledge, query]);

  const openSearchResult = (result) => {
    if (result.target === 'Inbox') {
      setSelectedId(result.item.id);
      setReply('');
    }
    setPage(result.target);
  };

  const authenticate = async (mode, values) => {
    const result =
      mode === 'signup' ? await smartdeskApi.signup(values) : await smartdeskApi.login(values);
    setUser(result.user);
    setPage('Overview');
    setQuery('');
    setError('');
    if (result.user.role === 'admin') await refresh();
    else await refreshCustomerPortal();
  };

  const authenticateWithGoogle = async () => {
    const idToken = await signInWithGoogle();
    try {
      const result = await smartdeskApi.loginWithFirebase(idToken);
      setUser(result.user);
      setPage('Overview');
      setQuery('');
      setError('');
      if (result.user.role === 'admin') await refresh();
      else await refreshCustomerPortal();
    } catch (error) {
      await signOutFromFirebase();
      throw error;
    }
  };

  const signOut = async () => {
    assistantRequestId.current += 1;
    setAssistantBusy(false);
    try {
      await smartdeskApi.logout();
    } catch {
      /* Clear local account view even if the API is unavailable. */
    }
    try {
      await signOutFromFirebase();
    } catch {
      /* Clear the SmartDesk session even if Firebase sign-out is unavailable. */
    }
    setUser(null);
    setOverview(null);
    setTickets([]);
    setOrders([]);
    setKnowledge([]);
    setCustomerTickets([]);
    setCustomerOrders([]);
    setCustomerKnowledge([]);
    setCustomerTicketError('');
    setSelectedId(null);
    setReply('');
    setAssistantMessages([]);
    setAssistantError('');
    setPage('Overview');
    setNotice('You are signed out.');
  };

  const saveProfile = async (profile) => {
    try {
      const result = await smartdeskApi.updateProfile(profile);
      setUser(result.user);
      setNotice('Your profile has been updated.');
      return true;
    } catch (requestError) {
      setNotice(requestError.message);
      return false;
    }
  };

  const createCustomerSupportTicket = async (ticket) => {
    const saved = await smartdeskApi.createSupportTicket(ticket);
    setCustomerTickets((items) => [saved, ...items]);
    return true;
  };

  const createCustomerReturnRequest = async (request) => {
    const saved = await smartdeskApi.requestReturn(request);
    setCustomerTickets((items) => [saved, ...items]);
    return true;
  };

  const askCustomerAssistant = async (question, history) => {
    const result = await smartdeskApi.askCustomerAssistant(question, history);
    return result;
  };

  const askAssistant = async (question, history) => {
    const requestId = ++assistantRequestId.current;
    setAssistantBusy(true);
    setAssistantError('');
    try {
      const result = await smartdeskApi.askAssistant(question, history);
      if (requestId !== assistantRequestId.current) return;
      setAssistantMessages((items) => [
        ...items,
        { role: 'assistant', text: result.answer, references: result.references },
      ]);
    } catch (requestError) {
      if (requestId !== assistantRequestId.current) return;
      setAssistantError(requestError.message);
    } finally {
      if (requestId === assistantRequestId.current) setAssistantBusy(false);
    }
  };

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
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const markResolved = async () => {
    if (!selected) return;
    try {
      const updated = await smartdeskApi.setTicketStatus(
        selected.id,
        selected.status === 'resolved' ? 'open' : 'resolved',
      );
      setTickets((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.status === 'resolved' ? 'Ticket marked as resolved.' : 'Ticket reopened.');
    } catch (requestError) {
      setNotice(requestError.message);
    }
  };

  const saveReply = async () => {
    if (!selected || !reply.trim()) return;
    try {
      const data = await smartdeskApi.saveReply(selected.id, reply);
      setTickets((items) => items.map((item) => (item.id === data.id ? data : item)));
      setReply('');
      setNotice('Reply saved to the ticket timeline.');
    } catch (requestError) {
      setNotice(requestError.message);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    try {
      const data = await smartdeskApi.createTicket(
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      await refresh();
      setSelectedId(data.id);
      setPage('Inbox');
      setShowNew(false);
      setNotice('New ticket added to your inbox.');
    } catch (requestError) {
      setNotice(requestError.message);
    }
  };

  const createOrder = async (order) => {
    const saved = await smartdeskApi.createOrder(order);
    setOrders((items) => [saved, ...items]);
    setNotice('Order saved to your workspace.');
  };

  const updateOrderPolicy = async (orderNumber, details) => {
    const updated = await smartdeskApi.updateOrderPolicy(orderNumber, details);
    setOrders((items) => items.map((item) => (item.orderNumber === orderNumber ? updated : item)));
    setNotice('Order service and return policy updated.');
  };

  const createArticle = async (articleData) => {
    try {
      const article = await smartdeskApi.createArticle(articleData);
      setKnowledge((items) => [article, ...items]);
      setNotice('Knowledge article added.');
      return true;
    } catch (requestError) {
      setNotice(requestError.message);
      return false;
    }
  };

  const updateArticle = async (id, articleData) => {
    try {
      const updated = await smartdeskApi.updateArticle(id, articleData);
      setKnowledge((items) => items.map((article) => (article.id === id ? updated : article)));
      setNotice('Knowledge article updated.');
      return true;
    } catch (requestError) {
      setNotice(requestError.message);
      return false;
    }
  };

  const deleteArticle = async (id) => {
    try {
      await smartdeskApi.deleteArticle(id);
      setKnowledge((items) => items.filter((article) => article.id !== id));
      setNotice('Knowledge article deleted.');
      return true;
    } catch (requestError) {
      setNotice(requestError.message);
      return false;
    }
  };

  if (checkingSession)
    return (
      <div className="app-loading">
        <span className="loading-mark">
          <i />
          <i />
          <i />
        </span>
        <p>Opening your workspace…</p>
      </div>
    );
  if (!user)
    return (
      <>
        <AuthPage
          onAuthenticate={authenticate}
          onGoogleAuthenticate={authenticateWithGoogle}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <Toast message={notice} />
      </>
    );

  if (user.role === 'customer') {
    return (
      <>
        <CustomerPortal
          user={user}
          tickets={customerTickets}
          orders={customerOrders}
          knowledge={customerKnowledge}
          loading={customerTicketLoading}
          error={customerTicketError}
          theme={theme}
          onToggleTheme={toggleTheme}
          onProfile={() => setShowProfile(true)}
          onSubmit={createCustomerSupportTicket}
          onRefresh={refreshCustomerPortal}
          onRequestReturn={createCustomerReturnRequest}
          onAskAssistant={askCustomerAssistant}
        />
        <ProfileModal
          open={showProfile}
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={saveProfile}
          onSignOut={signOut}
        />
        <Toast message={notice} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        openCount={overview?.openTickets || 0}
        user={user}
        onNavigate={setPage}
        onProfile={() => setShowProfile(true)}
      />
      <main className="main-area">
        <Topbar
          page={page}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          query={query}
          onQueryChange={setQuery}
          searchResults={searchResults}
          onSearchResult={openSearchResult}
          onNotify={() => setNotice('You’re all caught up.')}
          onProfile={() => setShowProfile(true)}
        />
        {error && (
          <div className="error-banner">
            <CircleHelp size={18} />
            <span>{error}</span>
          </div>
        )}
        {page === 'Overview' && (
          <OverviewPage
            overview={overview}
            tickets={tickets}
            orders={orders}
            user={user}
            onPage={setPage}
            onTicket={openTicket}
            onNew={() => setShowNew(true)}
            onAskAssistant={() => setPage('AI assistant')}
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
            loading={loading}
            user={user}
            theme={theme}
          />
        )}
        {page === 'Orders' && (
          <OrdersPage
            orders={orders}
            query={query}
            onCreate={createOrder}
            onUpdate={updateOrderPolicy}
          />
        )}
        {page === 'Knowledge base' && (
          <KnowledgePage
            knowledge={knowledge}
            query={query}
            onCreate={createArticle}
            onUpdate={updateArticle}
            onDelete={deleteArticle}
          />
        )}
        {page === 'AI assistant' && (
          <AssistantPage
            user={user}
            onAsk={askAssistant}
            messages={assistantMessages}
            onMessagesChange={setAssistantMessages}
            busy={assistantBusy}
            error={assistantError}
            aiReady={overview?.ai === 'gemini'}
          />
        )}
      </main>
      <NewTicketModal open={showNew} onClose={() => setShowNew(false)} onSubmit={createTicket} />
      <ProfileModal
        open={showProfile}
        user={user}
        onClose={() => setShowProfile(false)}
        onSave={saveProfile}
        onSignOut={signOut}
      />
      <Toast message={notice} />
    </div>
  );
}

export default App;
