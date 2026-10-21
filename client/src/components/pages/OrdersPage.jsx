import { Box, Truck } from 'lucide-react';
import { initial, money, timeAgo } from '../../lib/formatters.js';

export default function OrdersPage({ orders, query }) {
  const visible = orders.filter((order) =>
    `${order.orderNumber} ${order.customer} ${order.email} ${order.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page-content data-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">SHOP ACTIVITY</div>
          <h1>Orders</h1>
          <p>A clear view of what’s moving through the shop.</p>
        </div>
        <div className="data-count">
          <Truck size={16} /> {orders.length} recent orders
        </div>
      </div>
      <div className="panel data-panel">
        <div className="panel-heading">
          <div>
            <h2>All orders</h2>
            <p>Order lookups are available to the AI assistant.</p>
          </div>
          <span className="subtle-pill">
            <span className="green-dot" /> Connected to workspace
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
          {!visible.length && <div className="empty-state">No matching orders.</div>}
        </div>
      </div>
      <p className="page-footnote">
        <Box size={14} /> Orders are sample shop records for the first build.
      </p>
    </div>
  );
}
