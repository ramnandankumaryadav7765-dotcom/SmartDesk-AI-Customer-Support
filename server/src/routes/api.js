import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { makeArticle, makeOrder, makeTicket, normalizeItemPolicies } from '../data.js';
import { findOne, insert, list, remove, storageMode, update } from '../store.js';
import {
  createSession,
  deleteSession,
  getSessionUser,
  hashPassword,
  publicUser,
  requireAdmin,
  requireAuth,
  requireCustomer,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
} from '../services/auth.js';
import { callAssistant, findRelevantArticle } from '../services/assistant.js';
import { verifyFirebaseIdToken } from '../services/firebase-auth.js';
import { allowedClientOrigins } from '../origins.js';

const router = Router();
const isDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

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
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return res
        .status(403)
        .json({ error: 'The owner account cannot be created through customer sign-up.' });
    }

    const user = {
      id: randomUUID(),
      name,
      email,
      role: 'customer',
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

router.post('/auth/firebase', async (req, res, next) => {
  try {
    const origin = req.get('origin');
    if (!origin || !allowedClientOrigins().has(origin)) {
      return res.status(403).json({ error: 'Firebase sign-in must start from the SmartDesk app.' });
    }
    const idToken = String(req.body.idToken || '');
    if (!idToken || idToken.length > 12000) {
      return res.status(400).json({ error: 'Firebase sign-in could not be completed. Try again.' });
    }

    const identity = await verifyFirebaseIdToken(idToken);
    let user = await findOne('users', { firebaseUid: identity.uid });

    if (!user) {
      const existingEmailUser = await findOne('users', { email: identity.email });
      if (existingEmailUser?.firebaseUid && existingEmailUser.firebaseUid !== identity.uid) {
        return res
          .status(409)
          .json({ error: 'That email is linked to a different Google account.' });
      }
      if (existingEmailUser) {
        user = await update(
          'users',
          { id: existingEmailUser.id },
          {
            firebaseUid: identity.uid,
            role:
              identity.email === process.env.ADMIN_EMAIL?.trim().toLowerCase()
                ? 'admin'
                : 'customer',
            authProvider: existingEmailUser.passwordHash ? 'password+google' : 'firebase-google',
            firebaseLinkedAt: new Date().toISOString(),
          },
        );
      } else {
        user = {
          id: randomUUID(),
          name: identity.name || identity.email.split('@')[0],
          email: identity.email,
          firebaseUid: identity.uid,
          role:
            identity.email === process.env.ADMIN_EMAIL?.trim().toLowerCase() ? 'admin' : 'customer',
          authProvider: 'firebase-google',
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
      return res
        .status(409)
        .json({ error: 'This Google account is already linked to another user.' });
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

router.patch('/profile', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const contactEmail = String(req.body.contactEmail || '')
      .trim()
      .toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();
    const profilePicture = String(req.body.profilePicture || '');

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: 'Enter your name (2–60 characters).' });
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Enter a valid contact email address.' });
    }
    if (phone.length > 32 || address.length > 300) {
      return res.status(400).json({ error: 'Phone or address is too long.' });
    }
    if (
      profilePicture.length > 250_000 ||
      (profilePicture &&
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(profilePicture))
    ) {
      return res
        .status(400)
        .json({ error: 'Choose a smaller JPEG, PNG, or WebP profile picture.' });
    }

    const user = await update(
      'users',
      { id: req.user.id },
      { name, contactEmail, phone, address, profilePicture },
    );
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

async function getConfiguredOwnerId() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return null;
  const owner = await findOne('users', { email: adminEmail });
  return owner?.id || null;
}

router.get('/support/tickets', requireCustomer, async (req, res, next) => {
  try {
    const ownerId = await getConfiguredOwnerId();
    if (!ownerId) {
      return res
        .status(503)
        .json({ error: 'Customer support is not configured yet. Contact the business owner.' });
    }
    return res.json(await list('tickets', { ownerId, customerId: req.user.id }));
  } catch (error) {
    return next(error);
  }
});

router.get('/support/portal', requireCustomer, async (req, res, next) => {
  try {
    const ownerId = await getConfiguredOwnerId();
    if (!ownerId) {
      return res
        .status(503)
        .json({ error: 'Customer support is not configured yet. Contact the business owner.' });
    }
    const [tickets, orders, knowledge] = await Promise.all([
      list('tickets', { ownerId, customerId: req.user.id }),
      list('orders', { ownerId, email: req.user.email }),
      list('knowledge', { ownerId }),
    ]);
    return res.json({
      tickets,
      orders: orders.map(
        ({
          orderNumber,
          items,
          itemPolicies,
          status,
          placedAt,
          deliveredAt,
          serviceType,
          returnWindowDays,
          exchangeWindowDays,
        }) => ({
          orderNumber,
          items,
          itemPolicies,
          status,
          placedAt,
          deliveredAt,
          serviceType,
          returnWindowDays,
          exchangeWindowDays,
        }),
      ),
      knowledge: knowledge.map(({ id, title, category, content, updatedAt }) => ({
        id,
        title,
        category,
        content,
        updatedAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/support/tickets', requireCustomer, async (req, res, next) => {
  try {
    const ownerId = await getConfiguredOwnerId();
    if (!ownerId) {
      return res
        .status(503)
        .json({ error: 'Customer support is not configured yet. Contact the business owner.' });
    }
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    if (!subject || subject.length > 140 || !message || message.length > 5000) {
      return res
        .status(400)
        .json({ error: 'Add a subject and a message (up to 5,000 characters).' });
    }

    const ticket = makeTicket(
      {
        ...req.body,
        customer: req.user.name,
        email: req.user.contactEmail || req.user.email,
        subject,
        message,
        priority: 'normal',
        channel: 'Web',
      },
      ownerId,
    );
    ticket.customerId = req.user.id;
    ticket.phone = req.user.phone;
    ticket.updatedAt = ticket.createdAt;
    return res.status(201).json(await insert('tickets', ticket));
  } catch (error) {
    return next(error);
  }
});

router.post('/support/returns', requireCustomer, async (req, res, next) => {
  try {
    const ownerId = await getConfiguredOwnerId();
    if (!ownerId) {
      return res
        .status(503)
        .json({ error: 'Customer support is not configured yet. Contact the business owner.' });
    }
    const orderNumber = String(req.body.orderNumber || '')
      .trim()
      .toUpperCase();
    const item = String(req.body.item || '').trim();
    const requestType = req.body.requestType === 'exchange' ? 'exchange' : 'return';
    const message = String(req.body.message || '').trim();
    const order = orderNumber
      ? await findOne('orders', { ownerId, email: req.user.email, orderNumber })
      : null;
    if (!order)
      return res.status(404).json({ error: 'We could not find that order under your account.' });
    if (!order.items?.includes(item)) {
      return res.status(400).json({ error: 'Choose an item from this order.' });
    }
    const itemPolicy = order.itemPolicies?.find((policy) => policy.item === item) || order;
    const allowedDays =
      requestType === 'exchange' ? itemPolicy.exchangeWindowDays : itemPolicy.returnWindowDays;
    if (!allowedDays || order.status !== 'Delivered' || !order.deliveredAt) {
      return res
        .status(400)
        .json({ error: `This order is not currently eligible for a ${requestType}.` });
    }
    if (order.deliveredAt > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'This order has not reached its delivery date yet.' });
    }
    const lastEligibleDay = new Date(`${order.deliveredAt}T00:00:00.000Z`);
    lastEligibleDay.setUTCDate(lastEligibleDay.getUTCDate() + allowedDays);
    if (new Date().toISOString().slice(0, 10) > lastEligibleDay.toISOString().slice(0, 10)) {
      return res
        .status(400)
        .json({ error: `The ${requestType} window for this order has closed.` });
    }
    if (message.length > 3000)
      return res.status(400).json({ error: 'Keep your note under 3,000 characters.' });

    const subject = `${requestType === 'return' ? 'Return' : 'Exchange'} request — ${item}`;
    const ticket = makeTicket(
      {
        customer: req.user.name,
        email: req.user.email,
        orderNumber,
        subject,
        message: message || `Customer requested a ${requestType} for ${item}.`,
        priority: 'normal',
        channel: 'Customer portal',
      },
      ownerId,
    );
    ticket.customerId = req.user.id;
    ticket.phone = req.user.phone;
    ticket.requestType = requestType;
    ticket.item = item;
    ticket.updatedAt = ticket.createdAt;
    return res.status(201).json(await insert('tickets', ticket));
  } catch (error) {
    return next(error);
  }
});

router.post('/support/assistant', requireCustomer, async (req, res, next) => {
  try {
    const ownerId = await getConfiguredOwnerId();
    if (!ownerId) {
      return res
        .status(503)
        .json({ error: 'Customer support is not configured yet. Contact the business owner.' });
    }
    const question = String(req.body.message || '').trim();
    if (!question || question.length > 2000) {
      return res.status(400).json({ error: 'Write a question up to 2,000 characters.' });
    }
    const [tickets, orders, articles] = await Promise.all([
      list('tickets', { ownerId, customerId: req.user.id }),
      list('orders', { ownerId, email: req.user.email }),
      list('knowledge', { ownerId }),
    ]);
    const relevantArticles = findRelevantArticle(question, articles);
    const context = JSON.stringify({
      customer: { name: req.user.name },
      orders: orders.map(
        ({
          orderNumber,
          items,
          itemPolicies,
          status,
          placedAt,
          deliveredAt,
          serviceType,
          returnWindowDays,
          exchangeWindowDays,
        }) => ({
          orderNumber,
          items,
          itemPolicies,
          status,
          placedAt,
          deliveredAt,
          serviceType,
          returnWindowDays,
          exchangeWindowDays,
        }),
      ),
      supportRequests: tickets.slice(0, 10).map(({ subject, status, messages }) => ({
        subject,
        status,
        latestReply:
          [...(messages || [])].reverse().find((message) => message.role === 'staff')?.text || '',
      })),
      helpArticles: (relevantArticles.length ? relevantArticles : articles)
        .slice(0, 8)
        .map(({ title, category, content }) => ({
          title,
          category,
          content: String(content || '').slice(0, 1200),
        })),
    }).slice(0, 14000);
    const history = Array.isArray(req.body.history)
      ? req.body.history
          .filter(
            (item) => ['user', 'assistant'].includes(item?.role) && typeof item?.text === 'string',
          )
          .slice(-8)
      : [];
    const answer = await callAssistant(question, context, history);
    return res.json({
      answer,
      references: relevantArticles.map(({ id, title }) => ({ id, title })),
    });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAdmin);

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
    const ticket = await update(
      'tickets',
      { id: req.params.id, ownerId: req.user.id },
      { status, updatedAt: new Date().toISOString() },
    );
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
    res.json(await update('tickets', filter, { messages, updatedAt: new Date().toISOString() }));
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

router.patch('/orders/:orderNumber', async (req, res, next) => {
  try {
    const deliveredAt = String(req.body.deliveredAt || '');
    const customer = String(req.body.customer || '').trim();
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const status = ['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(req.body.status)
      ? req.body.status
      : null;
    if (
      !status ||
      !customer ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      (deliveredAt && !isDateOnly(deliveredAt))
    ) {
      return res
        .status(400)
        .json({ error: 'Check the order status, delivery date, and return windows.' });
    }
    const filter = {
      ownerId: req.user.id,
      orderNumber: String(req.params.orderNumber).toUpperCase(),
    };
    const existing = await findOne('orders', filter);
    if (!existing) return res.status(404).json({ error: 'Order not found.' });
    const itemPolicies = normalizeItemPolicies(existing.items || [], req.body.itemPolicies, {
      serviceType: existing.serviceType,
      returnWindowDays: existing.returnWindowDays,
      exchangeWindowDays: existing.exchangeWindowDays,
    });
    const updated = await update('orders', filter, {
      status,
      customer,
      email,
      deliveredAt,
      itemPolicies,
      serviceType: itemPolicies[0]?.serviceType || 'Standard product',
      returnWindowDays: itemPolicies[0]?.returnWindowDays || 0,
      exchangeWindowDays: itemPolicies[0]?.exchangeWindowDays || 0,
    });
    if (!updated) return res.status(404).json({ error: 'Order not found.' });
    return res.json(updated);
  } catch (error) {
    return next(error);
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

router.patch('/knowledge/:id', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();
    if (!title || !content) {
      return res.status(400).json({ error: 'An article title and content are required.' });
    }
    const article = await update(
      'knowledge',
      { id: req.params.id, ownerId: req.user.id },
      {
        title,
        category: String(req.body.category || 'General').trim() || 'General',
        content,
        updatedAt: new Date().toISOString(),
      },
    );
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    return res.json(article);
  } catch (error) {
    return next(error);
  }
});

router.delete('/knowledge/:id', async (req, res, next) => {
  try {
    const deleted = await remove('knowledge', { id: req.params.id, ownerId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Article not found.' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
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
      .slice(-12)
      .map(({ customer, subject, status, priority, orderNumber, messages }) => ({
        customer,
        subject,
        status,
        priority,
        orderNumber,
        latestMessage: messages?.at(-1)?.text,
      })),
    orders: orders
      .slice(-12)
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
      .slice(0, 6)
      .map(({ title, category, content }) => ({
        title,
        category,
        content: String(content || '').slice(0, 1400),
      })),
  };
  return {
    context: JSON.stringify(context).slice(0, 16000),
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
    const history = Array.isArray(req.body.history)
      ? req.body.history
          .filter(
            (item) => ['user', 'assistant'].includes(item?.role) && typeof item?.text === 'string',
          )
          .slice(-8)
      : [];
    const answer = await callAssistant(question, account.context, history);
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
