import { useState } from 'react';
import { ArrowRight, BookOpen, Pencil, Plus, Trash2, X } from 'lucide-react';

export default function KnowledgePage({ knowledge, query = '', onCreate, onUpdate, onDelete }) {
  const [active, setActive] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const submitArticle = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const articleData = Object.fromEntries(new FormData(event.currentTarget));
      const saved = editing ? await onUpdate(editing.id, articleData) : await onCreate(articleData);
      if (saved) {
        setAdding(false);
        setEditing(null);
        setActive(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const startAdding = () => {
    setActive(null);
    setEditing(null);
    setAdding(true);
  };

  const startEditing = () => {
    setEditing(active);
    setActive(null);
    setAdding(true);
  };

  const deleteActiveArticle = async () => {
    if (!active || deleting) return;
    const confirmed = window.confirm(`Delete “${active.title}”? This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      if (await onDelete(active.id)) setActive(null);
    } finally {
      setDeleting(false);
    }
  };

  const visible = knowledge.filter((article) =>
    `${article.title} ${article.category} ${article.content}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <div className="page-content data-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR ANSWER LIBRARY</div>
          <h1>Knowledge base</h1>
          <p>Save guidance for your assistant and the customer help center.</p>
        </div>
        <button className="primary-button" onClick={startAdding}>
          <Plus size={16} /> Add an article
        </button>
      </div>
      <div className="knowledge-intro">
        <div className="knowledge-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <strong>Answers grounded in your shop’s knowledge</strong>
          <p>Your assistant can draw from these private articles when answering questions.</p>
        </div>
        <span className="article-total">{knowledge.length} ARTICLES</span>
      </div>
      <div className="knowledge-grid">
        {visible.map((article, index) => (
          <article className="knowledge-card" key={article.id}>
            <div className={`knowledge-card-icon icon-tone-${index % 4}`}>
              <BookOpen size={17} />
            </div>
            <div className="knowledge-category">{article.category}</div>
            <h3>{article.title}</h3>
            <span className="article-visibility-pill public">Customer help center</span>
            <p>{article.content}</p>
            <div className="knowledge-card-footer">
              <span>
                Updated{' '}
                {new Date(article.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <button
                type="button"
                className="article-open-button"
                onClick={() => setActive(article)}
                aria-label={`View ${article.title}`}
              >
                View <ArrowRight size={14} />
              </button>
            </div>
          </article>
        ))}
        {!visible.length && (
          <div className="knowledge-empty">
            <BookOpen size={23} />
            <strong>
              {knowledge.length
                ? 'No articles match your search'
                : 'Your answer library starts here'}
            </strong>
            <p>
              {knowledge.length
                ? 'Try a different search.'
                : 'Add shop policies, product details, or team guidance for your assistant.'}
            </p>
            {!knowledge.length && (
              <button className="text-button" onClick={startAdding}>
                Add your first article <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div
            className="article-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button article-close"
              onClick={() => setActive(null)}
              aria-label="Close article"
            >
              <X size={18} />
            </button>
            <span className="knowledge-category">{active.category}</span>
            <h2 id="article-dialog-title">{active.title}</h2>
            <p className="article-full-content">{active.content}</p>
            <div className="article-modal-foot">
              <BookOpen size={14} /> Used as a reference when drafting AI replies
            </div>
            <div className="article-modal-actions">
              <button
                className="article-action-button article-delete-button"
                onClick={deleteActiveArticle}
                disabled={deleting}
              >
                <Trash2 size={15} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button className="primary-button" onClick={startEditing} disabled={deleting}>
                <Pencil size={15} /> Edit article
              </button>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <form
            key={editing?.id || 'new-article'}
            className="new-ticket-modal"
            onSubmit={submitArticle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">ANSWER LIBRARY</span>
                <h2>{editing ? 'Edit article' : 'Add an article'}</h2>
                <p>
                  {editing
                    ? 'Update the trusted answer used by your assistant.'
                    : 'Give the assistant a trusted source for shop questions.'}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
                aria-label="Close article form"
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Article title
              <input
                name="title"
                placeholder="e.g. Gift card policy"
                defaultValue={editing?.title || ''}
                required
              />
            </label>
            <label>
              Category
              <input
                name="category"
                placeholder="Orders, Returns, Products..."
                defaultValue={editing?.category || 'General'}
              />
            </label>
            <label>
              Article content
              <textarea
                name="content"
                rows="6"
                placeholder="Add the policy or answer in clear language..."
                defaultValue={editing?.content || ''}
                required
              />
            </label>
            <div className="modal-footer">
              <span>Articles are available in the customer help center and AI answers.</span>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Save article'}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
