import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UNITS = ['piece', 'kg', 'gram', 'litre', 'ml', 'pack', 'box', 'bag', 'bottle', 'plate', 'session'];

const defaultForm = { name: '', description: '', category: '', price: '', costPrice: '', stock: '', lowStockThreshold: 10, unit: 'piece', sku: '', isAvailable: true, isMenuVisible: true, tags: '' };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [activeTab, setActiveTab] = useState('products');
  const [stockAdj, setStockAdj] = useState({ type: 'set', value: 0 });

  useEffect(() => { fetchAll(); }, [filters]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, aRes, cRes] = await Promise.all([
        api.get('/inventory', { params: { category: filters.category, search: filters.search, limit: 100 } }),
        api.get('/inventory/analytics'),
        api.get('/inventory/categories')
      ]);
      setProducts(pRes.data.products);
      setAnalytics(aRes.data.analytics);
      setCategories(cRes.data.categories);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [filters]);

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ ...p, tags: p.tags?.join(', ') || '' });
    setShowModal(true);
  };
  const openNew = () => { setEditProduct(null); setForm(defaultForm); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: +form.price, costPrice: +form.costPrice, stock: +form.stock, lowStockThreshold: +form.lowStockThreshold, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
    try {
      if (editProduct) {
        await api.put(`/inventory/${editProduct._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/inventory', payload);
        toast.success('Product added');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving product'); }
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/inventory/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Delete failed'); }
  };

  const updateStock = async () => {
    try {
      await api.put(`/inventory/${showStockModal._id}/stock`, { adjustment: +stockAdj.value, type: stockAdj.type });
      toast.success('Stock updated');
      setShowStockModal(null);
      fetchAll();
    } catch { toast.error('Stock update failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">{products.length} products tracked</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Product</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['products', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Products', value: analytics.totalProducts, icon: '📦' },
              { label: 'Low Stock', value: analytics.lowStockCount, icon: '⚠️' },
              { label: 'Out of Stock', value: analytics.outOfStock, icon: '❌' },
              { label: 'Inventory Value', value: `₹${analytics.inventoryValue.toLocaleString('en-IN')}`, icon: '💰' }
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-display font-bold text-2xl text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-display font-bold text-gray-900 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {analytics.topSelling.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.category}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{p.totalSold} sold</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-gray-900 mb-4">Low Stock Alerts</h3>
              {analytics.lowStockProducts.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-6">All products well stocked! ✅</div>
              ) : analytics.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>{p.stock} left</div>
                    <button onClick={() => { setShowStockModal(p); setStockAdj({ type: 'add', value: 0 }); }}
                      className="text-xs text-primary-600 hover:underline">Restock</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input className="input max-w-xs" placeholder="Search products..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
            <select className="input w-auto" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(filters.search || filters.category) && (
              <button className="btn-secondary text-sm" onClick={() => setFilters({ category: '', search: '' })}>Clear ✕</button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="card p-4 h-40 bg-gray-50 animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-4xl mb-3">📦</div>
              <div className="font-display font-bold text-gray-900 mb-1">No products found</div>
              <div className="text-gray-500 text-sm mb-4">Add your first product to get started</div>
              <button onClick={openNew} className="btn-primary">+ Add Product</button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                          {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{p.category}</td>
                        <td className="px-4 py-4 text-sm text-right font-semibold text-gray-900">₹{p.price}</td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : p.isLowStock ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {p.stock} {p.unit}
                          </span>
                          {p.isLowStock && p.stock > 0 && <div className="text-xs text-yellow-500">Low stock</div>}
                          {p.stock === 0 && <div className="text-xs text-red-500">Out of stock</div>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={p.isAvailable ? 'badge-completed' : 'badge-cancelled'}>
                            {p.isAvailable ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setShowStockModal(p); setStockAdj({ type: 'add', value: 0 }); }}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Stock</button>
                            <button onClick={() => openEdit(p)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Edit</button>
                            <button onClick={() => deleteProduct(p._id, p.name)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="font-display font-bold text-xl">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <input className="input" list="cats" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                  <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Selling Price (₹) *</label>
                  <input type="number" className="input" min="0" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cost Price (₹)</label>
                  <input type="number" className="input" min="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Current Stock</label>
                  <input type="number" className="input" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Low Stock Threshold</label>
                  <input type="number" className="input" min="0" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))} />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Tags (comma-separated)</label>
                  <input className="input" placeholder="popular, veg, spicy" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isMenuVisible} onChange={e => setForm(f => ({ ...f, isMenuVisible: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">Show in Menu</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editProduct ? 'Update' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-display font-bold text-xl">Update Stock</h2>
              <p className="text-sm text-gray-500 mt-1">{showStockModal.name} • Current: {showStockModal.stock} {showStockModal.unit}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Adjustment Type</label>
                <select className="input" value={stockAdj.type} onChange={e => setStockAdj(s => ({ ...s, type: e.target.value }))}>
                  <option value="set">Set to exact value</option>
                  <option value="add">Add to stock</option>
                  <option value="subtract">Remove from stock</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input type="number" className="input" min="0" value={stockAdj.value} onChange={e => setStockAdj(s => ({ ...s, value: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStockModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={updateStock} className="btn-primary flex-1">Update Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
