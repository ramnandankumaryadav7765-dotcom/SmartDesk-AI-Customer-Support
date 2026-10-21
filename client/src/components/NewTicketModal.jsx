import { ArrowRight, X } from 'lucide-react';

export default function NewTicketModal({ open, onClose, onSubmit }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="new-ticket-modal"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">INBOX</span>
            <h2>Create a ticket</h2>
            <p>Add a customer message to the support queue.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          Customer name
          <input name="customer" placeholder="e.g. Alex Morgan" required />
        </label>
        <label>
          Email address
          <input name="email" type="email" placeholder="alex@example.com" />
        </label>
        <div className="form-two">
          <label>
            Subject
            <input name="subject" placeholder="What do they need help with?" required />
          </label>
          <label>
            Order number
            <input name="orderNumber" placeholder="SD-2841" />
          </label>
        </div>
        <label>
          Customer message
          <textarea
            name="message"
            rows="4"
            placeholder="Write or paste the customer’s message..."
            required
          />
        </label>
        <div className="modal-footer">
          <span>AI can help draft a response after you create it.</span>
          <button className="primary-button" type="submit">
            Create ticket <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
