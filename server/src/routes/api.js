import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { makeArticle, makeOrder, makeTicket } from '../data.js';
import { findOne, insert, list, storageMode, update } from '../store.js';
import {
  createSession,
  deleteSession,
  getSessionUser,
  hashPassword,
  publicUser,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
} from '../services/auth.js';
import { callAssistant, findRelevantArticle } from '../services/assistant.js';
import { verifyGoogleCredential } from '../services/google-auth.js';
import { allowedClientOrigins } from '../origins.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({
    ok: true,
    storage: storageMode(),
    ai: process.env.GEMINI_API_KEY ? 'gemini' : 'offline',
  }),
);

router.post('/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 60)
      return res.status(400).json({ error: 'Enter your name (2–60 characters).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128)
      return res.status(400).json({ error: 'Use a password between 8 and 128 characters.' });
    if (await findOne('users', { email }))
      return res.status(409).json({ error: 'An account already exists for that email.' });

    const user = {
      id: randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await insert('users', user);
    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ error: 'An account already exists for that email.' });
    return next(error);
  }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    if (!email || password.length > 128)
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    const user = await findOne('users', { email });
    if (!user || !verifyPassword(password, user.passwordHash))
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/auth/google', async (req, res, next) => {
  try {
    const origin = req.get('origin');
    if (!origin || !allowedClientOrigins().has(origin)) {
      return res.status(403).json({ error: 'Google sign-in must start from the SmartDesk app.' });
    }
    const credential = String(req.body.credential || '');
    if (!credential || credential.length > 12000) {
      return res.status(400).json({ error: 'Google sign-in could not be completed. Try again.' });
    }

    const identity = await verifyGoogleCredential(credential);
    let user = await findOne('users', { googleSub: identity.subject });

    if (!user) {
      const existingEmailUser = await findOne('users', { email: identity.email });
      if (existingEmailUser?.googleSub && existingEmailUser.googleSub !== identity.subject) {
        return res.status(409).json({ error: 'That email is linked to a different Google account.' });
      }
      if (existingEmailUser) {
        if (!identity.emailIsAuthoritative) {
          return res.status(409).json({
            error: 'An account already uses this email. Sign in with its existing email and password.',
          });
        }
        user = await update(
          'users',
          { id: existingEmailUser.id },
          {
            googleSub: identity.subject,
            authProvider: existingEmailUser.passwordHash ? 'password+google' : 'google',
            googleLinkedAt: new Date().toISOString(),
          },
        );
      } else {
        user = {
          id: randomUUID(),
          name: identity.name || identity.email.split('@')[0],
          email: identity.email,
          googleSub: identity.subject,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
        };
        await insert('users', user);
      }
    }

    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This Google account is already linked to another user.' });
    }
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

router.get('/auth/me', async (req, res, next) => {
  try {
    const user = await getSessionUser(req);
    return res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    return next(error);
  }
});

router.post('/auth/logout', async (req, res, next) => {
  try {
    await deleteSession(req);
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAuth);

router.get('/overview', async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const [tickets, orders] = await Promise.all([
      list('tickets', { ownerId }),
      list('orders', { ownerId }),
    ]);
    const activeTickets = tickets.filter(
      (ticket) => ticket.status === 'open' || ticket.status === 'pending',
    );
    res.json({
      openTickets: activeTickets.length,
      urgentTickets: activeTickets.filter((ticket) => ticket.priority === 'urgent').length,
      ordersToday: orders.filter(
        (order) => new Date(order.placedAt).toDateString() === new Date().toDateString(),
      ).length,
      ticketCount: tickets.length,
      orderCount: orders.length,
      storage: storageMode(),
      ai: process.env.GEMINI_API_KEY ? 'gemini' : 'offline',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tickets', async (req, res, next) => {
  try {
    const filter = { ownerId: req.user.id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    res.json(await list('tickets', filter));
  } catch (error) {
    next(error);
  }
});

router.post('/tickets', async (req, res, next) => {
  try {
    if (!req.body.message?.trim()) return res.status(400).json({ error: 'A message is required.' });
    const ticket = await insert('tickets', makeTicket(req.body, req.user.id));
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
    const ticket = await update('tickets', { id: req.params.id, ownerId: req.user.id }, { status });
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
    const filter = { id: req.params.id, ownerId: req.user.id };
    const ticket = await findOne('tickets', filter);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    const messages = [
      ...(ticket.messages || []),
      { role: 'staff', text, createdAt: new Date().toISOString() },
    ];
    res.json(await update('tickets', filter, { messages }));
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    res.json(await list('orders', { ownerId: req.user.id }));
  } catch (error) {
    next(error);
  }
});

router.post('/orders', async (req, res, next) => {
  try {
    if (!req.body.customer?.trim() || !req.body.items?.trim())
      return res.status(400).json({ error: 'Add a customer and at least one item.' });
    const order = makeOrder(req.body, req.user.id);
    if (await findOne('orders', { ownerId: req.user.id, orderNumber: order.orderNumber }))
      return res.status(409).json({ error: 'That order number already exists in your account.' });
    res.status(201).json(await insert('orders', order));
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ error: 'That order number already exists in your account.' });
    next(error);
  }
});

router.get('/knowledge', async (req, res, next) => {
  try {
    res.json(await list('knowledge', { ownerId: req.user.id }));
  } catch (error) {
    next(error);
  }
});

router.post('/knowledge', async (req, res, next) => {
  try {
    if (!req.body.title?.trim() || !req.body.content?.trim())
      return res.status(400).json({ error: 'An article title and content are required.' });
    res.status(201).json(await insert('knowledge', makeArticle(req.body, req.user.id)));
  } catch (error) {
    next(error);
  }
});

async function accountContext(ownerId, question) {
  const [tickets, orders, articles] = await Promise.all([
    list('tickets', { ownerId }),
    list('orders', { ownerId }),
    list('knowledge', { ownerId }),
  ]);
  const relevantArticles = findRelevantArticle(question, articles);
  const context = {
    accountDataCounts: {
      tickets: tickets.length,
      orders: orders.length,
      knowledgeArticles: articles.length,
    },
    tickets: tickets
      .slice(0, 25)
      .map(({ customer, subject, status, priority, orderNumber, messages }) => ({
        customer,
        subject,
        status,
        priority,
        orderNumber,
        latestMessage: messages?.at(-1)?.text,
      })),
    orders: orders
      .slice(0, 40)
      .map(({ orderNumber, customer, items, total, currency, status, tracking, placedAt }) => ({
        orderNumber,
        customer,
        items,
        total,
        currency,
        status,
        tracking,
        placedAt,
      })),
    knowledge: (relevantArticles.length ? relevantArticles : articles)
      .slice(0, 20)
      .map(({ title, category, content }) => ({
        title,
        category,
        content,
      })),
  };
  return {
    context: JSON.stringify(context).slice(0, 28000),
    relevantArticles,
    tickets,
    orders,
    articles,
  };
}

router.post('/assistant/ask', async (req, res, next) => {
  try {
    const question = String(req.body.message || '').trim();
    if (!question) return res.status(400).json({ error: 'Write a question for your assistant.' });
    const account = await accountContext(req.user.id, question);
    const answer = await callAssistant(question, account.context);
    res.json({
      answer,
      source: 'Gemini',
      references: {
        tickets: account.tickets.length,
        orders: account.orders.length,
        articles: account.relevantArticles.map(({ id, title }) => ({ id, title })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/assistant/draft', async (req, res, next) => {
  try {
    const question = String(req.body.message || '').trim();
    if (!question) return res.status(400).json({ error: 'Add a customer message first.' });
    const account = await accountContext(req.user.id, question);
    const draft = await callAssistant(
      `Draft a concise, empathetic customer-support reply to this message. Use the account order and policy details where they match.\n\n${question}`,
      account.context,
    );
    res.json({
      draft,
      source: 'Gemini',
      articles: account.relevantArticles.map(({ id, title }) => ({ id, title })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
