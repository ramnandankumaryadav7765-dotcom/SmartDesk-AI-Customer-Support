const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
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
  setTicketStatus: (id, status) => sendJson(`/tickets/${id}`, { status }, 'PATCH'),
  saveReply: (id, text) => sendJson(`/tickets/${id}/reply`, { text }),
  draftReply: (message) => sendJson('/assistant/draft', { message }),
  createArticle: (article) => sendJson('/knowledge', article),
};
