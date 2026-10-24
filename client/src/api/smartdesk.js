const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });
  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(
      'The SmartDesk API did not return JSON. Stop the running app with Ctrl+C, then restart it from the project folder using npm run dev.',
    );
  }
  if (!response.ok) throw new Error(data.error || 'The SmartDesk request could not be completed.');
  return data;
}

function sendJson(path, body, method = 'POST') {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const smartdeskApi = {
  me: () => request('/auth/me'),
  signup: (account) => sendJson('/auth/signup', account),
  login: (credentials) => sendJson('/auth/login', credentials),
  loginWithFirebase: (idToken) => sendJson('/auth/firebase', { idToken }),
  logout: () => sendJson('/auth/logout', {}),
  updateProfile: (profile) => sendJson('/profile', profile, 'PATCH'),
  loadMyTickets: () => request('/support/tickets'),
  createSupportTicket: (ticket) => sendJson('/support/tickets', ticket),
  async loadWorkspace() {
    const [overview, tickets, orders, knowledge] = await Promise.all([
      request('/overview'),
      request('/tickets'),
      request('/orders'),
      request('/knowledge'),
    ]);
    return { overview, tickets, orders, knowledge };
  },
  createTicket: (ticket) => sendJson('/tickets', ticket),
  createOrder: (order) => sendJson('/orders', order),
  setTicketStatus: (id, status) => sendJson(`/tickets/${id}`, { status }, 'PATCH'),
  saveReply: (id, text) => sendJson(`/tickets/${id}/reply`, { text }),
  draftReply: (message) => sendJson('/assistant/draft', { message }),
  askAssistant: (message, history = []) =>
    sendJson('/assistant/ask', { message, history: history.slice(-8) }),
  createArticle: (article) => sendJson('/knowledge', article),
  updateArticle: (id, article) =>
    sendJson(`/knowledge/${encodeURIComponent(id)}`, article, 'PATCH'),
  deleteArticle: (id) => request(`/knowledge/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
