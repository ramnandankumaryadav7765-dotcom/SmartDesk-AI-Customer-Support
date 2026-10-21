import { randomUUID } from 'node:crypto';

const createId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`;

export const makeTicket = (body, ownerId) => ({
  id: createId('t'),
  ownerId,
  customer: String(body.customer || 'New customer').trim(),
  email: String(body.email || '')
    .trim()
    .toLowerCase(),
  subject: String(body.subject || 'New support request').trim(),
  preview: String(body.message || '')
    .trim()
    .slice(0, 160),
  status: 'open',
  priority: ['normal', 'high', 'urgent'].includes(body.priority) ? body.priority : 'normal',
  channel: String(body.channel || 'Web').trim(),
  orderNumber: String(body.orderNumber || '')
    .trim()
    .toUpperCase(),
  createdAt: new Date().toISOString(),
  messages: [{ role: 'customer', text: String(body.message || '').trim() }],
});

export const makeOrder = (body, ownerId) => ({
  orderNumber: String(body.orderNumber || createId('order'))
    .trim()
    .toUpperCase(),
  ownerId,
  customer: String(body.customer || '').trim(),
  email: String(body.email || '')
    .trim()
    .toLowerCase(),
  items: String(body.items || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  total: Number(body.total || 0),
  currency: String(body.currency || 'USD')
    .trim()
    .toUpperCase(),
  status: ['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(body.status)
    ? body.status
    : 'Processing',
  placedAt: new Date().toISOString(),
  tracking: String(body.tracking || '').trim() || null,
});

export const makeArticle = (body, ownerId) => ({
  id: createId('k'),
  ownerId,
  title: String(body.title || '').trim(),
  category: String(body.category || 'General').trim(),
  updatedAt: new Date().toISOString(),
  content: String(body.content || '').trim(),
});
