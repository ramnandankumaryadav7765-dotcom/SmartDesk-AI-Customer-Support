import { Router } from 'express';
import { makeArticle, makeTicket } from '../data.js';
import { findOne, insert, list, storageMode, update } from '../store.js';
import { callGemini, findRelevantArticle } from '../services/assistant.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({
    ok: true,
    storage: storageMode(),
    ai: process.env.GEMINI_API_KEY ? 'gemini' : 'preview',
  }),
);

router.get('/overview', async (_req, res, next) => {
  try {
    const [tickets, orders] = await Promise.all([list('tickets'), list('orders')]);
    const openTickets = tickets.filter(
      (ticket) => ticket.status === 'open' || ticket.status === 'pending',
    );
    res.json({
      openTickets: openTickets.length,
      urgentTickets: openTickets.filter((ticket) => ticket.priority === 'urgent').length,
      ordersToday: orders.filter(
        (order) => new Date(order.placedAt).toDateString() === new Date().toDateString(),
      ).length,
      tickets,
      orders,
      storage: storageMode(),
      ai: process.env.GEMINI_API_KEY ? 'gemini' : 'preview',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tickets', async (req, res, next) => {
  try {
    res.json(
      await list(
        'tickets',
        req.query.status && req.query.status !== 'all' ? { status: req.query.status } : {},
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/tickets', async (req, res, next) => {
  try {
    if (!req.body.message?.trim()) return res.status(400).json({ error: 'A message is required.' });
    const ticket = await insert('tickets', makeTicket(req.body));
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

router.patch('/tickets/:id', async (req, res, next) => {
  try {
    const status = ['open', 'pending', 'resolved'].includes(req.body.status)
      ? req.body.status
      : null;
    if (!status) return res.status(400).json({ error: 'Choose open, pending, or resolved.' });
    const ticket = await update('tickets', { id: req.params.id }, { status });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.post('/tickets/:id/reply', async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'A reply cannot be empty.' });
    const ticket = await findOne('tickets', { id: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    const messages = [
      ...(ticket.messages || []),
      { role: 'staff', text, createdAt: new Date().toISOString() },
    ];
    const updated = await update('tickets', { id: req.params.id }, { messages });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (_req, res, next) => {
  try {
    res.json(await list('orders'));
  } catch (error) {
    next(error);
  }
});

router.get('/knowledge', async (_req, res, next) => {
  try {
    res.json(await list('knowledge'));
  } catch (error) {
    next(error);
  }
});

router.post('/knowledge', async (req, res, next) => {
  try {
    if (!req.body.title?.trim() || !req.body.content?.trim())
      return res.status(400).json({ error: 'An article title and content are required.' });
    const article = await insert('knowledge', makeArticle(req.body));
    res.status(201).json(article);
  } catch (error) {
    next(error);
  }
});

router.post('/assistant/draft', async (req, res, next) => {
  try {
    const question = String(req.body.message || '').trim();
    if (!question) return res.status(400).json({ error: 'Add a customer message first.' });
    const articles = await list('knowledge');
    const relevant = findRelevantArticle(question, articles);
    if (process.env.GEMINI_API_KEY) {
      const draft = await callGemini(question, relevant);
      return res.json({
        draft,
        source: 'Gemini',
        articles: relevant.map(({ id, title }) => ({ id, title })),
      });
    }
    const orderNumber = question.match(/\bSD-\d{4}\b/i)?.[0]?.toUpperCase();
    const order = orderNumber ? await findOne('orders', { orderNumber }) : null;
    let draft =
      'Thanks for reaching out. I want to make sure we give you the right information, so I’m flagging this for a support specialist to review.';
    if (order)
      draft = `Thanks for reaching out. Order ${order.orderNumber} is currently ${order.status.toLowerCase()}${order.tracking ? ` (tracking: ${order.tracking})` : ''}. A member of our team can help with the next step.`;
    else if (relevant.length)
      draft = `Thanks for reaching out. ${relevant[0].content.split('. ').slice(0, 2).join('. ')}. Please let us know if there’s anything else we can help with.`;
    res.json({
      draft,
      source: 'Preview mode',
      articles: relevant.map(({ id, title }) => ({ id, title })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
