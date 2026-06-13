import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/auth/staff');
      setStaff(res.data.staff);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/auth/staff', form);
      toast.success('Staff member added!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create staff'); }
    finally { setSaving(false); }
  };

  const deactivate = async (id, name) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    try { await api.delete(`/auth/staff/${id}`); toast.success('Deactivated'); fetchStaff(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Staff</h1>
          <p className="text-gray-500 text-sm">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Staff</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-5 h-20 animate-pulse bg-gray-50" />)}</div>
      ) : staff.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="font-display font-bold text-gray-900 mb-1">No staff members yet</div>
          <div className="text-gray-500 text-sm mb-4">Add team members to help manage your business</div>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add First Staff Member</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {staff.map(s => (
              <div key={s._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base">
                    {s.name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.email}</div>
                    {s.phone && <div className="text-xs text-gray-400">📞 {s.phone}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={s.isActive !== false ? 'badge-completed' : 'badge-cancelled'}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{s.role}</span>
                  {s.isActive !== false && (
                    <button onClick={() => deactivate(s._id, s.name)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5 bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Staff Access</h3>
        <p className="text-sm text-blue-700">Staff members can view and manage orders, appointments, and inventory. They cannot access business settings or manage other staff members.</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between">
              <h2 className="font-display font-bold text-xl">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" required minLength={6} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
