import { randomUUID } from 'node:crypto';

export const seedTickets = [
  {
    id: 't-1048',
    customer: 'Maya Patel',
    email: 'maya.patel@example.com',
    subject: 'Package marked delivered but not received',
    preview: 'The tracking says delivered yesterday, but I checked with my building desk and...',
    status: 'open',
    priority: 'urgent',
    channel: 'Email',
    orderNumber: 'SD-2841',
    createdAt: '2026-10-21T08:22:00.000Z',
    messages: [
      {
        role: 'customer',
        text: 'The tracking says delivered yesterday, but I checked with my building desk and it is not there. Can you help?',
      },
    ],
  },
  {
    id: 't-1047',
    customer: 'Jonah Kim',
    email: 'jonah.kim@example.com',
    subject: 'Can I exchange for a different size?',
    preview: 'I ordered the large linen shirt but it runs a little big. Is an exchange possible?',
    status: 'open',
    priority: 'normal',
    channel: 'Web',
    orderNumber: 'SD-2838',
    createdAt: '2026-10-21T07:51:00.000Z',
    messages: [
      {
        role: 'customer',
        text: 'I ordered the large linen shirt but it runs a little big. Is an exchange possible?',
      },
    ],
  },
  {
    id: 't-1046',
    customer: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    subject: 'Question about the autumn collection',
    preview: 'Do you know when the new colors will be available in the...',
    status: 'open',
    priority: 'normal',
    channel: 'Instagram',
    orderNumber: 'SD-2829',
    createdAt: '2026-10-21T07:36:00.000Z',
    messages: [
      {
        role: 'customer',
        text: 'Do you know when the new colors will be available in the everyday tote?',
      },
    ],
  },
  {
    id: 't-1045',
    customer: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    subject: 'Address change request',
    preview: 'I just placed an order and noticed my old apartment address is saved...',
    status: 'pending',
    priority: 'high',
    channel: 'Email',
    orderNumber: 'SD-2845',
    createdAt: '2026-10-21T06:14:00.000Z',
    messages: [
      {
        role: 'customer',
        text: 'I just placed an order and noticed my old apartment address is saved. Can the shipping address still be changed?',
      },
    ],
  },
  {
    id: 't-1044',
    customer: 'Sofia Chen',
    email: 'sofia.chen@example.com',
    subject: 'Care instructions for the wool throw',
    preview: 'I love the throw! Should I hand wash it or is it safe to...',
    status: 'resolved',
    priority: 'normal',
    channel: 'Web',
    orderNumber: 'SD-2814',
    createdAt: '2026-10-20T16:20:00.000Z',
    messages: [
      {
        role: 'customer',
        text: 'I love the throw! Should I hand wash it or is it safe to machine wash?',
      },
    ],
  },
];

export const seedOrders = [
  {
    orderNumber: 'SD-2845',
    customer: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    items: ['Everyday Tote — Moss'],
    total: 42,
    currency: 'USD',
    status: 'Processing',
    placedAt: '2026-10-21T06:02:00.000Z',
    tracking: null,
  },
  {
    orderNumber: 'SD-2841',
    customer: 'Maya Patel',
    email: 'maya.patel@example.com',
    items: ['Linen Shirt — Ivory', 'Ceramic Mug — Sand'],
    total: 96,
    currency: 'USD',
    status: 'Delivered',
    placedAt: '2026-10-16T13:45:00.000Z',
    tracking: 'USPS 9400111899223856920147',
  },
  {
    orderNumber: 'SD-2838',
    customer: 'Jonah Kim',
    email: 'jonah.kim@example.com',
    items: ['Linen Shirt — Olive'],
    total: 68,
    currency: 'USD',
    status: 'Shipped',
    placedAt: '2026-10-18T10:11:00.000Z',
    tracking: 'UPS 1Z8A3W220394002188',
  },
  {
    orderNumber: 'SD-2829',
    customer: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    items: ['Everyday Tote — Natural'],
    total: 42,
    currency: 'USD',
    status: 'Shipped',
    placedAt: '2026-10-15T08:04:00.000Z',
    tracking: 'USPS 9400111899223856919922',
  },
  {
    orderNumber: 'SD-2814',
    customer: 'Sofia Chen',
    email: 'sofia.chen@example.com',
    items: ['Wool Throw — Oat'],
    total: 124,
    currency: 'USD',
    status: 'Delivered',
    placedAt: '2026-10-11T09:00:00.000Z',
    tracking: 'UPS 1Z8A3W220394000712',
  },
];

export const seedKnowledge = [
  {
    id: 'k-1',
    title: 'Shipping & delivery',
    category: 'Orders',
    updatedAt: '2026-10-18',
    content:
      'Standard shipping usually takes 3–5 business days after dispatch. Tracking can take up to 24 hours to update. If a package is marked delivered but cannot be found, ask the customer to check nearby entrances and with building staff. If it is still missing after one business day, contact the carrier and escalate to the support lead.',
  },
  {
    id: 'k-2',
    title: 'Returns & exchanges',
    category: 'Returns',
    updatedAt: '2026-10-17',
    content:
      'Unused items can be returned or exchanged within 30 days of delivery. Items must be in their original condition and packaging. Sale items and personalized products are final sale. The support team can start an exchange after confirming the order number and requested size or color.',
  },
  {
    id: 'k-3',
    title: 'Order changes',
    category: 'Orders',
    updatedAt: '2026-10-16',
    content:
      'Address changes are possible only before an order has been packed. Check the order status before promising a change. If the order is already shipped, explain that the carrier may offer a redirect, but do not guarantee it.',
  },
  {
    id: 'k-4',
    title: 'Product care',
    category: 'Products',
    updatedAt: '2026-10-12',
    content:
      'Linen garments should be washed cold on a gentle cycle and air dried. Wool throws should be spot cleaned or dry cleaned. Ceramic mugs are dishwasher safe.',
  },
];

export const makeTicket = (body) => ({
  id: `t-${randomUUID().slice(0, 8)}`,
  customer: String(body.customer || 'New customer'),
  email: String(body.email || ''),
  subject: String(body.subject || 'New support request'),
  preview: String(body.message || '').slice(0, 120),
  status: 'open',
  priority: ['normal', 'high', 'urgent'].includes(body.priority) ? body.priority : 'normal',
  channel: 'Web',
  orderNumber: String(body.orderNumber || ''),
  createdAt: new Date().toISOString(),
  messages: [{ role: 'customer', text: String(body.message || '') }],
});

export const makeArticle = (body) => ({
  id: `k-${randomUUID().slice(0, 8)}`,
  title: String(body.title || '').trim(),
  category: String(body.category || 'General').trim(),
  updatedAt: new Date().toISOString(),
  content: String(body.content || '').trim(),
});
