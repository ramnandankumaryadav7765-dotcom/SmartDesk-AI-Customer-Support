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
    .slice(0, 4)
    .map((item) => item.article);
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callAssistant(question, accountContext, history = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI is not connected yet. Add a Gemini API key in server/.env.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const contents = [
    ...history.slice(-8).map(({ role, text }) => ({
      role: role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(text).slice(0, 1500) }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];
  const systemInstruction = {
    parts: [
      {
        text: `You are SmartDesk's helpful account assistant. Answer general product and support questions. For account questions, use only the private account information below. Be clear when information is missing. Never claim you changed a record, contacted a customer, sent an email, approved or denied a return, exchange, refund, or other request, or completed an action. Explain published policies and direct customers to submit a request for team review when an action is needed. Keep answers concise and useful.\n\nPrivate account information:\n${accountContext}`,
      },
    ],
  };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: { temperature: 0.25, maxOutputTokens: 450 },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      const answer = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();
      if (answer) return answer;
      throw new Error('Gemini returned an empty response. Please try again.');
    }
    const message = payload.error?.message || `Gemini request failed (${response.status}).`;
    if (![500, 502, 503, 504].includes(response.status) || attempt === 1) throw new Error(message);
    lastError = new Error(message);
    await pause(400);
  }
  throw lastError || new Error('The assistant could not answer right now. Please try again.');
}
