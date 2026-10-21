import { useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Check,
  ClipboardList,
  Package,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

const starterPrompts = [
  { icon: ClipboardList, text: 'Summarize my open tickets' },
  { icon: Package, text: 'What order needs attention?' },
  { icon: BookOpen, text: 'What policies are in my knowledge base?' },
];

export default function AssistantPage({ user, onAsk, aiReady, messages, onMessagesChange, busy, error }) {
  const [prompt, setPrompt] = useState('');

  const ask = async (text = prompt) => {
    const question = text.trim();
    if (!question || busy) return;
    setPrompt('');
    const history = messages;
    onMessagesChange((items) => [...items, { role: 'user', text: question }]);
    await onAsk(question, history);
  };

  return (
    <div className="page-content assistant-page">
      <div className="assistant-page-head">
        <div>
          <div className="eyebrow">YOUR PRIVATE WORKSPACE</div>
          <h1>Your AI assistant</h1>
          <p>Ask about your tickets, orders, policies, or how to use SmartDesk.</p>
        </div>
        <div className={`assistant-live ${aiReady ? 'is-live' : ''}`}>
          <span />
          {aiReady ? 'Gemini connected' : 'AI key needed'}
        </div>
      </div>

      <section className="assistant-workspace">
        <div className="assistant-welcome">
          <div className="assistant-avatar">
            <WandSparkles size={23} />
          </div>
          <div>
            <span>SMARTDESK ASSISTANT</span>
            <h2>Hi {user.name.split(' ')[0]}, what can I help with?</h2>
            <p>
              I can look across the information saved in your account and help you find the next
              step.
            </p>
          </div>
        </div>

        {!messages.length ? (
          <div className="assistant-starters">
            <span className="starter-label">TRY ASKING</span>
            {starterPrompts.map(({ icon: Icon, text }) => (
              <button key={text} onClick={() => ask(text)}>
                <Icon size={17} />
                {text}
                <ArrowUp size={15} />
              </button>
            ))}
          </div>
        ) : (
          <div className="assistant-conversation" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <article
                className={`assistant-message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.role === 'assistant' && (
                  <span className="message-spark">
                    <Sparkles size={15} />
                  </span>
                )}
                <div className="assistant-bubble">
                  <p>{message.text}</p>
                  {message.references && (
                    <div className="assistant-references">
                      <span>
                        <Check size={13} /> Account context
                      </span>
                      {message.references.articles?.map((article) => (
                        <span key={article.id}>
                          <BookOpen size={13} />
                          {article.title}
                        </span>
                      ))}
                      <small>
                        {message.references.tickets} tickets · {message.references.orders} orders
                        checked
                      </small>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {busy && (
              <div className="assistant-thinking">
                <span />
                <span />
                <span /> Looking through your workspace…
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="assistant-error" role="alert">
            {error}
          </div>
        )}
        <form
          className="assistant-composer"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                ask();
              }
            }}
            placeholder="Ask anything about your workspace…"
            rows="2"
            aria-label="Ask your assistant"
          />
          <div className="composer-foot">
            <span>
              <Sparkles size={14} /> Uses only your account's tickets, orders, and saved articles
            </span>
            <button type="submit" disabled={!prompt.trim() || busy} aria-label="Send question">
              <ArrowUp size={18} />
            </button>
          </div>
        </form>
        <p className="assistant-note">AI can make mistakes. Review answers before taking action.</p>
      </section>
    </div>
  );
}
