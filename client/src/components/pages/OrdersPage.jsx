import { useState } from 'react';
import { ArrowRight, Box, Plus, Truck, X } from 'lucide-react';
import { initial, money } from '../../lib/formatters.js';

export default function OrdersPage({ orders, query, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const visible = orders.filter((order) =>
    `${order.orderNumber} ${order.customer} ${order.email} ${order.status} ${order.items?.join(' ')}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onCreate(Object.fromEntries(new FormData(event.currentTarget)));
      setAdding(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-content data-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR SHOP DATA</div>
          <h1>Orders</h1>
          <p>Keep order details in your workspace for quick lookups and useful AI answers.</p>
        </div>
        <button className="primary-button" onClick={() => setAdding(true)}>
          <Plus size={17} /> Add an order
        </button>
      </div>
      <div className="panel data-panel">
        <div className="panel-heading">
          <div>
            <h2>Orders in your account</h2>
            <p>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} saved to this workspace
            </p>
          </div>
          <span className="subtle-pill">
            <span className="green-dot" /> Private workspace
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>ITEMS</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.orderNumber}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    <div className="table-person">
                      <div className="avatar tiny-avatar">{initial(order.customer)}</div>
                      <span>{order.customer}</span>
                    </div>
                  </td>
                  <td className="items-cell">{order.items.join(', ')}</td>
                  <td>
                    {new Date(order.placedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className={`order-status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="order-total">{money(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="orders-empty">
              <div>
                <Box size={22} />
              </div>
              <strong>
                {orders.length ? 'No orders match that search' : 'Your orders will show up here'}
              </strong>
              <p>Add an order to make it available in your account and to your assistant.</p>
              {!orders.length && (
                <button className="text-button" onClick={() => setAdding(true)}>
                  Add your first order <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="page-footnote">
        <Truck size={15} /> Orders are visible only to your signed-in account.
      </p>
      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <form
            className="new-ticket-modal order-modal"
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">SHOP DATA</span>
                <h2>Add an order</h2>
                <p>Save an order so you can find it and ask your assistant about it.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setAdding(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="form-two">
              <label>
                Order number
                <input name="orderNumber" placeholder="e.g. ORD-1008" />
              </label>
              <label>
                Status
                <select name="status" defaultValue="Processing">
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </label>
            </div>
            <div className="form-two">
              <label>
                Customer name
                <input name="customer" placeholder="Taylor Morgan" required />
              </label>
              <label>
                Email address
                <input name="email" type="email" placeholder="taylor@example.com" />
              </label>
            </div>
            <label>
              Items <input name="items" placeholder="Linen shirt, Ceramic mug" required />
            </label>
            <div className="form-two">
              <label>
                Order total
                <input name="total" type="number" min="0" step="0.01" placeholder="0.00" />
              </label>
              <label>
                Tracking number
                <input name="tracking" placeholder="Optional" />
              </label>
            </div>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-footer">
              <span>Order details are stored in your account.</span>
              <button className="primary-button" type="submit">
                Save order <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
