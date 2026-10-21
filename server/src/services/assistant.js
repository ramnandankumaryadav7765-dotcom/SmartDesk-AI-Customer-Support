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

export async function callAssistant(question, accountContext) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI is not connected yet. Add a Gemini API key in server/.env.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `You are SmartDesk's helpful account assistant. Answer general product and support questions. When the user asks about their account, use only the private account information provided below. Be clear when information is missing. Never claim you changed a record, contacted a customer, sent an email, or completed an action; explain how the user can do it in SmartDesk. Keep answers useful and concise.\n\nPrivate account information:\n${accountContext}\n\nUser request:\n${question}`,
        },
      ],
    },
  ];

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
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
    if (![500, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(message);
    lastError = new Error(message);
    await pause(800 * 2 ** attempt);
  }
  throw lastError || new Error('The assistant could not answer right now. Please try again.');
}
