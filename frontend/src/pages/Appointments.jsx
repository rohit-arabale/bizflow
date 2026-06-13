import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
const STATUS_COLORS = { pending: 'badge-pending', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled', 'no-show': 'badge-cancelled' };

const defaultForm = { customer: { name: '', phone: '', email: '' }, service: '', servicePrice: '', duration: 45, date: format(new Date(), 'yyyy-MM-dd'), timeSlot: '', staffName: '', notes: '' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('list'); // list | calendar
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchAppointments(); }, [selectedDate, filterStatus]);
  useEffect(() => { if (showModal) fetchSlots(form.date); }, [form.date, showModal]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments', {
        params: { date: format(selectedDate, 'yyyy-MM-dd'), status: filterStatus, limit: 100 }
      });
      setAppointments(res.data.appointments);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, [selectedDate, filterStatus]);

  const fetchSlots = async (date) => {
    try {
      const res = await api.get(`/appointments/slots/${date}`);
      setSlots(res.data.slots);
    } catch { setSlots([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, servicePrice: +form.servicePrice, duration: +form.duration };
    try {
      if (editAppt) {
        await api.put(`/appointments/${editAppt._id}`, payload);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', payload);
        toast.success('Appointment booked');
      }
      setShowModal(false);
      fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Marked as ${status}`);
      fetchAppointments();
    } catch { toast.error('Update failed'); }
  };

  const deleteAppt = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    try { await api.delete(`/appointments/${id}`); toast.success('Deleted'); fetchAppointments(); }
    catch { toast.error('Delete failed'); }
  };

  const openEdit = (a) => {
    setEditAppt(a);
    setForm({ customer: a.customer, service: a.service, servicePrice: a.servicePrice, duration: a.duration, date: format(new Date(a.date), 'yyyy-MM-dd'), timeSlot: a.timeSlot, staffName: a.staffName || '', notes: a.notes || '' });
    setShowModal(true);
  };

  // Generate week days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} on {format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {['list', 'calendar'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${viewMode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                {m === 'list' ? '≡ List' : '📅 Calendar'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditAppt(null); setForm(defaultForm); setShowModal(true); }} className="btn-primary">+ Book</button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setSelectedDate(d => subDays(d, 7))} className="p-2 hover:bg-gray-100 rounded-lg">‹</button>
          <span className="font-semibold text-gray-700 text-sm">{format(weekStart, 'MMMM yyyy')}</span>
          <button onClick={() => setSelectedDate(d => addDays(d, 7))} className="p-2 hover:bg-gray-100 rounded-lg">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all text-xs ${isSelected ? 'bg-primary-600 text-white' : isToday ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                <span className="uppercase font-semibold opacity-70">{format(day, 'EEE')}</span>
                <span className={`font-bold text-sm mt-0.5 ${isSelected ? 'text-white' : ''}`}>{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === '' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${filterStatus === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* List View */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-50" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-display font-bold text-gray-900 mb-1">No appointments</div>
          <div className="text-gray-500 text-sm mb-4">for {format(selectedDate, 'MMMM d, yyyy')}</div>
          <button onClick={() => { setEditAppt(null); setForm({ ...defaultForm, date: format(selectedDate, 'yyyy-MM-dd') }); setShowModal(true); }} className="btn-primary">Book Appointment</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center text-center flex-shrink-0">
                    <span className="text-primary-700 font-bold text-sm">{a.timeSlot}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{a.customer?.name}</div>
                    <div className="text-sm text-gray-500">{a.service}</div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>📞 {a.customer?.phone}</span>
                      {a.staffName && <span>👤 {a.staffName}</span>}
                      <span>⏱ {a.duration} min</span>
                      {a.servicePrice > 0 && <span>💰 ₹{a.servicePrice}</span>}
                    </div>
                    {a.notes && <div className="text-xs text-gray-500 mt-1 italic">"{a.notes}"</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={STATUS_COLORS[a.status]}>{a.status}</span>
                  {a.status === 'pending' && (
                    <button onClick={() => updateStatus(a._id, 'confirmed')} className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Confirm</button>
                  )}
                  {(a.status === 'confirmed' || a.status === 'pending') && (
                    <button onClick={() => updateStatus(a._id, 'completed')} className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium">Complete</button>
                  )}
                  {a.status !== 'cancelled' && a.status !== 'completed' && (
                    <button onClick={() => updateStatus(a._id, 'cancelled')} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">Cancel</button>
                  )}
                  <button onClick={() => openEdit(a)} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Edit</button>
                  <button onClick={() => deleteAppt(a._id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex justify-between">
                <h2 className="font-display font-bold text-xl">{editAppt ? 'Edit Appointment' : 'Book Appointment'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Customer Name *</label>
                  <input className="input" required value={form.customer.name} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, name: e.target.value } }))} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" required value={form.customer.phone} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, phone: e.target.value } }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.customer.email} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, email: e.target.value } }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Service *</label>
                  <input className="input" required placeholder="Haircut, Facial, Massage..." value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Service Price (₹)</label>
                  <input type="number" className="input" min="0" value={form.servicePrice} onChange={e => setForm(f => ({ ...f, servicePrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <select className="input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}>
                    {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input" required value={form.date} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setForm(f => ({ ...f, date: e.target.value, timeSlot: '' }))} />
                </div>
                <div>
                  <label className="label">Staff Name</label>
                  <input className="input" placeholder="Optional" value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="label">Select Time Slot *</label>
                {slots.length === 0 ? (
                  <p className="text-sm text-gray-400">No slots available for this date</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {slots.map(slot => (
                      <button type="button" key={slot.time} disabled={!slot.available}
                        onClick={() => setForm(f => ({ ...f, timeSlot: slot.time }))}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all border ${form.timeSlot === slot.time ? 'bg-primary-600 text-white border-primary-600' : slot.available ? 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50' : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'}`}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editAppt ? 'Update' : 'Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
