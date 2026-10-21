import { useState } from 'react';
import { ArrowRight, BookOpen, Plus, X } from 'lucide-react';

export default function KnowledgePage({ knowledge, onCreate }) {
  const [active, setActive] = useState(null);
  const [adding, setAdding] = useState(false);
  const submitArticle = async (event) => {
    const saved = await onCreate(event);
    if (saved) setAdding(false);
  };
  return (
    <div className="page-content data-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR ANSWER LIBRARY</div>
          <h1>Knowledge base</h1>
          <p>Helpful shop policies the assistant can use when drafting replies.</p>
        </div>
        <button className="primary-button" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add an article
        </button>
      </div>
      <div className="knowledge-intro">
        <div className="knowledge-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <strong>Answers grounded in your shop’s knowledge</strong>
          <p>AI drafts use these articles as a starting point and show the source used.</p>
        </div>
        <span className="article-total">{knowledge.length} ARTICLES</span>
      </div>
      <div className="knowledge-grid">
        {knowledge.map((article, index) => (
          <button className="knowledge-card" key={article.id} onClick={() => setActive(article)}>
            <div className={`knowledge-card-icon icon-tone-${index % 4}`}>
              <BookOpen size={17} />
            </div>
            <div className="knowledge-category">{article.category}</div>
            <h3>{article.title}</h3>
            <p>{article.content}</p>
            <div className="knowledge-card-footer">
              <span>
                Updated{' '}
                {new Date(article.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>
      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="article-modal" onClick={(e) => e.stopPropagation()}>
            <button className="icon-button article-close" onClick={() => setActive(null)}>
              <X size={18} />
            </button>
            <span className="knowledge-category">{active.category}</span>
            <h2>{active.title}</h2>
            <p>{active.content}</p>
            <div className="article-modal-foot">
              <BookOpen size={14} /> Used as a reference when drafting AI replies
            </div>
          </div>
        </div>
      )}
      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <form
            className="new-ticket-modal"
            onSubmit={submitArticle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">ANSWER LIBRARY</span>
                <h2>Add an article</h2>
                <p>Give the assistant a trusted source for shop questions.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setAdding(false)}>
                <X size={18} />
              </button>
            </div>
            <label>
              Article title
              <input name="title" placeholder="e.g. Gift card policy" required />
            </label>
            <label>
              Category
              <input
                name="category"
                placeholder="Orders, Returns, Products..."
                defaultValue="General"
              />
            </label>
            <label>
              Article content
              <textarea
                name="content"
                rows="6"
                placeholder="Add the policy or answer in clear language..."
                required
              />
            </label>
            <div className="modal-footer">
              <span>Saved articles can be used in AI reply drafts.</span>
              <button className="primary-button" type="submit">
                Save article <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
