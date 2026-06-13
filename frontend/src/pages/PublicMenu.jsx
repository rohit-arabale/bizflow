import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { DEVELOPER_CREDIT } from '../utils/branding';

export default function PublicMenu() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', tableNumber: '', notes: '' });
  const [orderPlaced, setOrderPlaced] = useState(null);

  useEffect(() => {
    api.get(`/menu/${slug}`).then(res => {
      setData(res.data);
      setActiveCategory(res.data.categories[0]);
    }).catch(() => setError('Menu not found or unavailable'))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added!`, { duration: 1500 });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) setCart(c => c.filter(i => i._id !== id));
    else setCart(c => c.map(i => i._id === id ? { ...i, qty } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartTax = Math.round(cartTotal * 0.05);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.phone) return toast.error('Name and phone required');
    try {
      const res = await api.post(`/orders/public/${slug}`, {
        customer: { name: orderForm.name, phone: orderForm.phone },
        items: cart.map(i => ({ product: i._id, quantity: i.qty })),
        tableNumber: orderForm.tableNumber,
        notes: orderForm.notes
      });
      setOrderPlaced(res.data.order);
      setCart([]);
      setShowCart(false);
      setShowOrderForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Order failed'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading menu...</p>
        <div className="pt-2 text-center text-xs text-gray-400">{DEVELOPER_CREDIT}</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Menu Not Found</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (orderPlaced) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-4">Your order has been received</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="font-bold text-lg text-primary-700">{orderPlaced.orderNumber}</div>
          <div className="text-sm text-gray-500 mt-1">Total: ₹{orderPlaced.total}</div>
          <div className="text-sm text-gray-500">Status: {orderPlaced.status}</div>
        </div>
        <Link to={`/track/${orderPlaced.orderNumber}`} className="btn-primary block w-full text-center mb-3">Track Order</Link>
        <button onClick={() => setOrderPlaced(null)} className="btn-secondary w-full">Order More</button>
      </div>
    </div>
  );

  const { business, menu, categories } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-gray-900">{business.name}</h1>
              {business.address?.city && <p className="text-sm text-gray-500">📍 {business.address.city}</p>}
            </div>
            <button onClick={() => setShowCart(true)} className="relative btn-primary text-sm py-2.5">
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Category Nav */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {(activeCategory ? [activeCategory] : categories).map(category => (
          <div key={category}>
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">{category}</h2>
            <div className="space-y-3">
              {(menu[category] || []).map(item => {
                const inCart = cart.find(i => i._id === item._id);
                return (
                  <div key={item._id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      {item.description && <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>}
                      {item.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {item.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      )}
                      <div className="font-bold text-primary-700 mt-2">₹{item.price}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item._id, inCart.qty - 1)} className="w-8 h-8 rounded-full border border-primary-300 text-primary-700 font-bold hover:bg-primary-50 flex items-center justify-center">−</button>
                          <span className="font-bold text-gray-900 w-5 text-center">{inCart.qty}</span>
                          <button onClick={() => updateQty(item._id, inCart.qty + 1)} className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold hover:bg-primary-700 flex items-center justify-center">+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} className="btn-primary text-sm px-4 py-2">Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="text-center text-xs text-gray-400">{DEVELOPER_CREDIT}</div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-display font-bold text-xl">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">🛒</div>
                  <div>Cart is empty</div>
                </div>
              ) : cart.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">₹{item.price} × {item.qty}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm flex items-center justify-center">−</button>
                    <span className="font-bold w-5 text-center text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 flex items-center justify-center">+</button>
                  </div>
                  <div className="font-bold text-sm w-14 text-right">₹{item.price * item.qty}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-100">
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>GST (5%)</span><span>₹{cartTax}</span></div>
                  <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>₹{cartTotal + cartTax}</span></div>
                </div>
                <button onClick={() => { setShowOrderForm(true); setShowCart(false); }} className="btn-primary w-full py-3">
                  Place Order (₹{cartTotal + cartTax})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOrderForm(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Your Details</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={placeOrder} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input className="input" required placeholder="Your name" value={orderForm.name} onChange={e => setOrderForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" required placeholder="Mobile number" value={orderForm.phone} onChange={e => setOrderForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Table Number</label>
                <input className="input" placeholder="Optional" value={orderForm.tableNumber} onChange={e => setOrderForm(f => ({ ...f, tableNumber: e.target.value }))} />
              </div>
              <div>
                <label className="label">Special Instructions</label>
                <textarea className="input" rows={2} placeholder="Any special requests?" value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
                <div className="flex justify-between"><span>{cartCount} items</span><span>₹{cartTotal + cartTax}</span></div>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base">Confirm Order →</button>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Cart Button */}
      {cartCount > 0 && !showCart && !showOrderForm && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
          <button onClick={() => setShowCart(true)}
            className="bg-primary-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-primary-200 font-semibold flex items-center gap-3">
            <span>🛒 {cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span className="h-4 w-px bg-white/40" />
            <span>₹{cartTotal + cartTax}</span>
          </button>
        </div>
      )}
    </div>
  );
}
