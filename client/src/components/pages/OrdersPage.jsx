import { useState } from 'react';
import { ArrowRight, Box, Pencil, Plus, Truck, X } from 'lucide-react';
import { initial, money } from '../../lib/formatters.js';

export default function OrdersPage({ orders, query, onCreate, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [itemsText, setItemsText] = useState('');
  const [itemPolicies, setItemPolicies] = useState([]);
  const [error, setError] = useState('');

  const startNewOrder = () => {
    setEditingOrder(null);
    setItemsText('');
    setItemPolicies([]);
    setError('');
    setAdding(true);
  };

  const startEditingOrder = (order) => {
    setEditingOrder(order);
    setItemsText(order.items.join(', '));
    setItemPolicies(
      order.items.map(
        (item) =>
          order.itemPolicies?.find((policy) => policy.item === item) || {
            item,
            serviceType: order.serviceType || 'Standard product',
            returnWindowDays: order.returnWindowDays || 0,
            exchangeWindowDays: order.exchangeWindowDays || 0,
          },
      ),
    );
    setError('');
    setAdding(true);
  };

  const changeItems = (value) => {
    setItemsText(value);
    const names = value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setItemPolicies((current) =>
      names.map(
        (item) =>
          current.find((policy) => policy.item === item) || {
            item,
            serviceType: 'Standard product',
            returnWindowDays: 0,
            exchangeWindowDays: 0,
          },
      ),
    );
  };

  const updateItemPolicy = (index, field, value) => {
    setItemPolicies((current) =>
      current.map((policy, policyIndex) =>
        policyIndex === index ? { ...policy, [field]: value } : policy,
      ),
    );
  };

  const closeModal = () => {
    setAdding(false);
    setEditingOrder(null);
    setItemsText('');
    setItemPolicies([]);
  };
  const visible = orders.filter((order) =>
    `${order.orderNumber} ${order.customer} ${order.email} ${order.phone} ${order.status} ${order.items?.join(' ')}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const details = Object.fromEntries(new FormData(event.currentTarget));
      if (editingOrder) await onUpdate(editingOrder.orderNumber, details);
      else await onCreate(details);
      setAdding(false);
      setEditingOrder(null);
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
        <button className="primary-button" onClick={startNewOrder}>
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
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.orderNumber}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    <div className="table-person">
                      <div className="avatar tiny-avatar">{initial(order.customer)}</div>
                      <div>
                        <span>{order.customer}</span>
                        <small className="order-contact-note">
                          {[order.email, order.phone].filter(Boolean).join(' · ') ||
                            'No contact match'}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="items-cell">
                    {order.items.join(', ')}
                    <small className="order-policy-note">
                      {(order.itemPolicies || [])
                        .map(
                          (policy) =>
                            `${policy.item}: ${policy.serviceType}, return ${policy.returnWindowDays}d, exchange ${policy.exchangeWindowDays}d`,
                        )
                        .join(' · ') ||
                        `${order.serviceType || 'Standard product'} policy not configured`}
                    </small>
                  </td>
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
                  <td>
                    <button
                      type="button"
                      className="order-policy-edit"
                      onClick={() => {
                        startEditingOrder(order);
                      }}
                    >
                      <Pencil size={13} /> Edit policy
                    </button>
                  </td>
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
                <button className="text-button" onClick={startNewOrder}>
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
        <div className="modal-backdrop" onClick={closeModal}>
          <form
            className="new-ticket-modal order-modal"
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">SHOP DATA</span>
                <h2>{editingOrder ? `Update ${editingOrder.orderNumber}` : 'Add an order'}</h2>
                <p>
                  {editingOrder
                    ? 'Update its delivery status and service-specific return policy.'
                    : 'Save an order so you can find it and ask your assistant about it.'}
                </p>
              </div>
              <button type="button" className="icon-button" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="form-two">
              <label>
                Order number
                <input
                  name="orderNumber"
                  placeholder="e.g. ORD-1008"
                  defaultValue={editingOrder?.orderNumber || ''}
                  readOnly={Boolean(editingOrder)}
                />
              </label>
              <label>
                Status
                <select name="status" defaultValue={editingOrder?.status || 'Processing'}>
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
                <input
                  name="customer"
                  placeholder="Taylor Morgan"
                  defaultValue={editingOrder?.customer || ''}
                  required
                />
              </label>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  placeholder="taylor@example.com"
                  defaultValue={editingOrder?.email || ''}
                />
              </label>
              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  placeholder="+14155550123 (include country code)"
                  defaultValue={editingOrder?.phone || ''}
                />
              </label>
            </div>
            <label>
              Items{' '}
              <input
                name="items"
                placeholder="Linen shirt, Ceramic mug"
                value={itemsText}
                onChange={(event) => changeItems(event.target.value)}
                required
                readOnly={Boolean(editingOrder)}
              />
            </label>
            <input type="hidden" name="itemPolicies" value={JSON.stringify(itemPolicies)} />
            {!!itemPolicies.length && (
              <section
                className="order-item-policies"
                aria-label="Return and exchange policies per item"
              >
                <div className="order-item-policies-heading">
                  <strong>Service policies by item</strong>
                  <small>Set each product’s service type and request windows separately.</small>
                </div>
                {itemPolicies.map((policy, index) => (
                  <div className="order-item-policy-row" key={`${policy.item}-${index}`}>
                    <strong title={policy.item}>{policy.item}</strong>
                    <label>
                      Service type
                      <input
                        value={policy.serviceType}
                        maxLength={80}
                        onChange={(event) =>
                          updateItemPolicy(index, 'serviceType', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Return days
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={policy.returnWindowDays}
                        onChange={(event) =>
                          updateItemPolicy(index, 'returnWindowDays', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Exchange days
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={policy.exchangeWindowDays}
                        onChange={(event) =>
                          updateItemPolicy(index, 'exchangeWindowDays', event.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
              </section>
            )}
            <div className="form-two">
              <label>
                Order total
                <input
                  name="total"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={editingOrder?.total ?? ''}
                  readOnly={Boolean(editingOrder)}
                />
              </label>
              <label>
                Tracking number
                <input
                  name="tracking"
                  placeholder="Optional"
                  defaultValue={editingOrder?.tracking || ''}
                  readOnly={Boolean(editingOrder)}
                />
              </label>
            </div>
            <label>
              Delivered on
              <input
                name="deliveredAt"
                type="date"
                defaultValue={editingOrder?.deliveredAt?.slice(0, 10) || ''}
              />
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-footer">
              <span>
                Customer must sign in with this email or verified phone. Return windows start on
                delivery.
              </span>
              <button className="primary-button" type="submit">
                {editingOrder ? 'Save policy' : 'Save order'} <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
