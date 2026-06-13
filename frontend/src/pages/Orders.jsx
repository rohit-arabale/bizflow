import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_NEXT = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered' };
const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const defaultForm = {
  customer: { name: '', phone: '', email: '', address: '' },
  items: [],
  notes: '',
  tableNumber: '',
  paymentMethod: 'cash',
  source: 'walk-in'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', {
        params: { status: filters.status, page: filters.page, limit: 20 }
      });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      const res = await api.get('/inventory?available=true&limit=200');
      setProducts(res.data.products);
    } catch (err) {
      setProducts([]);
      setProductsError(err.response?.data?.message || 'Failed to load products');
      toast.error('Could not load products');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (showModal) {
      fetchProducts();
    } else {
      setProductSearch('');
      setProductsError('');
    }
  }, [showModal]);

  const openCreateModal = () => {
    setForm(defaultForm);
    setCart([]);
    setProductSearch('');
    setProductsError('');
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setCart([]);
    setProductSearch('');
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product === product._id);
      if (existing) {
        return prev.map(item =>
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: product._id, name: product.name, price: product.price, quantity: 1 }];
    });
    setProductSearch('');
    toast.success(`${product.name} added to order`, { duration: 1500 });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) {
      setCart(current => current.filter(item => item.product !== productId));
      return;
    }
    setCart(current =>
      current.map(item => (item.product === productId ? { ...item, quantity: qty } : item))
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const orderTotal = subtotal + tax;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      toast.error('Add items to cart');
      return;
    }

    try {
      await api.post('/orders', { ...form, items: cart });
      toast.success('Order created');
      closeCreateModal();
      setForm(defaultForm);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating order');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchOrders();
    } catch {
      toast.error('Update failed');
    }
  };

  const filteredProducts = products.filter(product => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return true;
    return [product.name, product.category, product.sku]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(query));
  });

  const firstMatchingProduct = filteredProducts[0] || null;

  const addFirstMatchingProduct = () => {
    if (!firstMatchingProduct) {
      toast.error(productSearch ? `No product found for "${productSearch}"` : 'No products available to add');
      return;
    }
    addToCart(firstMatchingProduct);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} total orders</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">+ New Order</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilters(current => ({ ...current, status: '', page: 1 }))}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filters.status === '' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {STATUSES.map(status => (
          <button
            key={status}
            onClick={() => setFilters(current => ({ ...current, status, page: 1 }))}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${filters.status === status ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card p-5 h-20 animate-pulse bg-gray-50" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">Orders</div>
          <div className="font-display font-bold text-gray-900 mb-1">No orders found</div>
          <button onClick={openCreateModal} className="btn-primary mt-4">Create First Order</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Items</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-gray-900">{order.orderNumber}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {order.tableNumber && <div className="text-xs text-gray-400">Table {order.tableNumber}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900">{order.customer?.name}</div>
                      <div className="text-xs text-gray-400">{order.customer?.phone}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="text-xs text-gray-600">
                        {order.items?.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(', ')}
                        {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-sm text-gray-900">Rs. {order.total}</div>
                      <div className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`badge-${order.status}`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewOrder(order)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">View</button>
                        {STATUS_NEXT[order.status] && (
                          <button
                            onClick={() => updateStatus(order._id, STATUS_NEXT[order.status])}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium capitalize"
                          >
                            {STATUS_NEXT[order.status]}
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => updateStatus(order._id, 'cancelled')}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{orders.length} of {total} orders</span>
            <div className="flex gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}
                className="btn-secondary text-xs py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={orders.length < 20}
                onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}
                className="btn-secondary text-xs py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-display font-bold text-xl">New Order</h2>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name *</label>
                      <input
                        className="input"
                        required
                        value={form.customer.name}
                        onChange={e => setForm(current => ({ ...current, customer: { ...current.customer, name: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input
                        className="input"
                        required
                        value={form.customer.phone}
                        onChange={e => setForm(current => ({ ...current, customer: { ...current.customer, phone: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="label">Table No.</label>
                      <input
                        className="input"
                        placeholder="Optional"
                        value={form.tableNumber}
                        onChange={e => setForm(current => ({ ...current, tableNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Payment</label>
                      <select
                        className="input"
                        value={form.paymentMethod}
                        onChange={e => setForm(current => ({ ...current, paymentMethod: e.target.value }))}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900">Select Items</h3>
                    <span className="text-xs text-gray-500">
                      {cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''} selected` : 'Choose at least one item'}
                    </span>
                  </div>
                  <input
                    className="input mb-2"
                    placeholder="Search products and press Enter to add..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFirstMatchingProduct();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mb-3">Click a product card to add it, or press Enter to add the first match.</p>

                  {productsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />)}
                    </div>
                  ) : productsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{productsError}</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                      {productSearch ? `No products match "${productSearch}". Try another search term.` : 'No active products found. Add products in Inventory first.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <button
                          type="button"
                          key={product._id}
                          onClick={() => addToCart(product)}
                          className="p-3 rounded-xl border border-gray-200 text-left hover:border-primary-300 hover:bg-primary-50 transition-all"
                        >
                          <div className="text-xs font-semibold text-gray-900 line-clamp-1">{product.name}</div>
                          <div className="text-xs text-gray-500">Rs. {product.price}</div>
                          <div className="text-xs text-gray-400">Stock: {product.stock}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {cart.map(item => (
                        <div key={item.product} className="flex items-center gap-3">
                          <div className="flex-1 text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQty(item.product, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.product, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 w-16 text-right">Rs. {item.price * item.quantity}</div>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
                        <div className="flex justify-between text-sm text-gray-600"><span>GST (5%)</span><span>Rs. {tax}</span></div>
                        <div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span>Rs. {orderTotal}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Add at least one product to enable the Place Order button.
                  </div>
                )}

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Special instructions..."
                    value={form.notes}
                    onChange={e => setForm(current => ({ ...current, notes: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeCreateModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={cart.length === 0 || productsLoading} className="btn-primary flex-1">
                    {cart.length === 0 ? 'Select Items To Place Order' : `Place Order (Rs. ${orderTotal})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between">
              <div>
                <h2 className="font-display font-bold text-xl">{viewOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{new Date(viewOrder.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`badge-${viewOrder.status}`}>{viewOrder.status}</span>
                <span className={viewOrder.paymentStatus === 'paid' ? 'badge-completed' : 'badge-pending'}>{viewOrder.paymentStatus}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-900">{viewOrder.customer?.name}</div>
                <div className="text-xs text-gray-500">Phone: {viewOrder.customer?.phone}</div>
                {viewOrder.tableNumber && <div className="text-xs text-gray-500">Table {viewOrder.tableNumber}</div>}
              </div>
              <div className="space-y-2">
                {viewOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-semibold">Rs. {item.subtotal}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>Rs. {viewOrder.subtotal}</span></div>
                  <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>Rs. {viewOrder.tax}</span></div>
                  <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>Rs. {viewOrder.total}</span></div>
                </div>
              </div>
              {viewOrder.notes && <div className="text-sm text-gray-500 italic">Note: {viewOrder.notes}</div>}
              <div className="flex gap-2">
                {STATUS_NEXT[viewOrder.status] && (
                  <button
                    onClick={() => {
                      updateStatus(viewOrder._id, STATUS_NEXT[viewOrder.status]);
                      setViewOrder(null);
                    }}
                    className="btn-primary flex-1 text-sm capitalize"
                  >
                    Mark {STATUS_NEXT[viewOrder.status]}
                  </button>
                )}
                {viewOrder.paymentStatus !== 'paid' && (
                  <button
                    onClick={async () => {
                      await api.put(`/orders/${viewOrder._id}/status`, { paymentStatus: 'paid' });
                      toast.success('Marked paid');
                      setViewOrder(null);
                      fetchOrders();
                    }}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
