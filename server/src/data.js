import { randomUUID } from 'node:crypto';

const createId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`;
const validDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

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

export function normalizeItemPolicies(items, rawPolicies, fallback = {}) {
  let policies = rawPolicies;
  if (typeof rawPolicies === 'string') {
    try {
      policies = JSON.parse(rawPolicies);
    } catch {
      policies = [];
    }
  }
  if (!Array.isArray(policies)) policies = [];
  return items.map((item) => {
    const supplied = policies.find((policy) => policy?.item === item) || {};
    const parseDays = (value, fallbackDays) => {
      const parsed = Number.parseInt(value ?? fallbackDays, 10);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(365, parsed)) : 0;
    };
    return {
      item,
      serviceType: String(supplied.serviceType || fallback.serviceType || 'Standard product')
        .trim()
        .slice(0, 80),
      returnWindowDays: parseDays(supplied.returnWindowDays, fallback.returnWindowDays),
      exchangeWindowDays: parseDays(supplied.exchangeWindowDays, fallback.exchangeWindowDays),
    };
  });
}

export const makeOrder = (body, ownerId) => {
  const items = String(body.items || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const itemPolicies = normalizeItemPolicies(items, body.itemPolicies, {
    serviceType: body.serviceType,
    returnWindowDays: body.returnWindowDays,
    exchangeWindowDays: body.exchangeWindowDays,
  });
  return {
    orderNumber: String(body.orderNumber || createId('order'))
      .trim()
      .toUpperCase(),
    ownerId,
    customer: String(body.customer || '').trim(),
    email: String(body.email || '')
      .trim()
      .toLowerCase(),
    items,
    itemPolicies,
    serviceType: itemPolicies[0]?.serviceType || 'Standard product',
    returnWindowDays: itemPolicies[0]?.returnWindowDays || 0,
    exchangeWindowDays: itemPolicies[0]?.exchangeWindowDays || 0,
    deliveredAt: validDateOnly(body.deliveredAt) ? String(body.deliveredAt) : '',
    total: Number(body.total || 0),
    currency: String(body.currency || 'USD')
      .trim()
      .toUpperCase(),
    status: ['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(body.status)
      ? body.status
      : 'Processing',
    placedAt: new Date().toISOString(),
    tracking: String(body.tracking || '').trim() || null,
  };
};

export const makeArticle = (body, ownerId) => ({
  id: createId('k'),
  ownerId,
  title: String(body.title || '').trim(),
  category: String(body.category || 'General').trim(),
  visibility: body.visibility === 'public' ? 'public' : 'private',
  updatedAt: new Date().toISOString(),
  content: String(body.content || '').trim(),
});
