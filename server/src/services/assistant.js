import { findOne } from '../store.js';

export function findRelevantArticle(question, articles) {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
  return articles
    .map((article) => ({
      article,
      score: words.reduce(
        (score, word) =>
          score + ((article.title + ' ' + article.content).toLowerCase().includes(word) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 2)
    .map((item) => item.article);
}

export async function callGemini(question, relevantArticles) {
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'get_order_status',
          description:
            'Look up an order by its exact order number to retrieve its current status, items, and tracking details.',
          parameters: {
            type: 'OBJECT',
            properties: {
              orderNumber: {
                type: 'STRING',
                description: 'The order number, for example SD-2841.',
              },
            },
            required: ['orderNumber'],
          },
        },
      ],
    },
  ];
  const context =
    relevantArticles.map((article) => `${article.title}: ${article.content}`).join('\n\n') ||
    'No matching policy article was found.';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Draft a concise, empathetic customer-support reply. Use only the supplied shop information. If it is insufficient, say what needs human confirmation. Never claim an action has been completed.\n\nShop information:\n${context}\n\nCustomer message:\n${question}`,
        },
      ],
    },
  ];
  let finalText = '';
  for (let turn = 0; turn < 4; turn++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools,
        generationConfig: { temperature: 0.35, maxOutputTokens: 500 },
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Gemini request failed.');
    const candidate = payload.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned an empty response.');
    contents.push(candidate.content);
    const functionCalls = (candidate.content.parts || []).filter((part) => part.functionCall);
    if (!functionCalls.length) {
      finalText = (candidate.content.parts || [])
        .map((part) => part.text || '')
        .join('')
        .trim();
      break;
    }
    const functionResponses = [];
    for (const part of functionCalls) {
      if (part.functionCall.name !== 'get_order_status') continue;
      const orderNumber = String(part.functionCall.args?.orderNumber || '')
        .trim()
        .toUpperCase();
      const order = orderNumber ? await findOne('orders', { orderNumber }) : null;
      functionResponses.push({
        functionResponse: {
          name: 'get_order_status',
          response: {
            result: order
              ? {
                  orderNumber: order.orderNumber,
                  status: order.status,
                  items: order.items,
                  tracking: order.tracking,
                }
              : { error: 'No order was found with that number.' },
          },
        },
      });
    }
    if (functionResponses.length) contents.push({ role: 'user', parts: functionResponses });
  }
  if (!finalText) throw new Error('Gemini did not return a text reply.');
  return finalText;
}
