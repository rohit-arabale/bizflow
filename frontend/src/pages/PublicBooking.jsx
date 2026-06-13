import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import api from '../utils/api';
import { DEVELOPER_CREDIT } from '../utils/branding';

export default function PublicBooking() {
  const { slug } = useParams();
  const [businessName, setBusinessName] = useState('');
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booked, setBooked] = useState(null);
  const [form, setForm] = useState({ customer: { name: '', phone: '', email: '' }, service: '', servicePrice: '', notes: '' });

  useEffect(() => { fetchSlots(); }, [selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get(`/appointments/public/slots/${slug}/${selectedDate}`);
      setSlots(res.data.slots);
      setBusinessName(res.data.businessName);
      setSelectedSlot('');
    } catch { toast.error('Failed to load slots'); }
    finally { setSlotsLoading(false); }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return toast.error('Please select a time slot');
    setLoading(true);
    try {
      const res = await api.post(`/appointments/public/${slug}`, {
        ...form, date: selectedDate, timeSlot: selectedSlot
      });
      setBooked(res.data.appointment);
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setLoading(false); }
  };

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd'), full: format(d, 'MMM d') };
  });

  if (booked) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-6">See you soon!</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold">{booked.service}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold">{format(new Date(booked.date), 'MMMM d, yyyy')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-semibold">{booked.timeSlot}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{booked.customer?.name}</span></div>
          {booked.servicePrice > 0 && <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold">₹{booked.servicePrice}</span></div>}
        </div>
        <p className="text-xs text-gray-400 mt-4">Please arrive 5 minutes early. For changes, call us directly.</p>
        <button onClick={() => { setBooked(null); setStep(1); setForm({ customer: { name: '', phone: '', email: '' }, service: '', servicePrice: '', notes: '' }); setSelectedSlot(''); }} className="btn-secondary w-full mt-4">Book Another</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center mx-auto mb-2 text-2xl">💅</div>
          <h1 className="font-display font-bold text-2xl text-gray-900">{businessName || 'Book Appointment'}</h1>
          <p className="text-gray-500 text-sm mt-1">Choose your service and time</p>
        </div>

        {/* Steps */}
        <div className="max-w-lg mx-auto px-4 pb-4 flex items-center gap-2">
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{s}</div>
                <span className="text-sm font-medium hidden sm:block">{s === 1 ? 'Pick Date & Time' : 'Your Details'}</span>
              </div>
              {i < 1 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {step === 1 && (
          <>
            {/* Date picker */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Select Date</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map(d => (
                  <button key={d.value} onClick={() => setSelectedDate(d.value)}
                    className={`flex flex-col items-center p-3 rounded-xl flex-shrink-0 min-w-[56px] transition-all ${selectedDate === d.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <span className={`text-xs font-semibold ${selectedDate === d.value ? 'text-primary-200' : 'text-gray-400'}`}>{d.label}</span>
                    <span className="font-bold text-lg">{d.day}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">{dates.find(d => d.value === selectedDate)?.full}</p>
            </div>

            {/* Time Slots */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Available Time Slots</h3>
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : slots.length === 0 ? (
                <p className="text-gray-400 text-sm">No slots available for this date</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot.time} disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${selectedSlot === slot.time ? 'bg-primary-600 text-white border-primary-600' : slot.available ? 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50' : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 line-through'}`}>
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button disabled={!selectedSlot} onClick={() => setStep(2)} className="btn-primary w-full py-3 disabled:opacity-50">
              Continue with {selectedSlot || '—'} →
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleBook} className="space-y-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">📅</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{format(new Date(selectedDate), 'MMMM d, yyyy')} at {selectedSlot}</div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-600 hover:underline">Change</button>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Service Details</h3>
              <div>
                <label className="label">Service *</label>
                <input className="input" required placeholder="Haircut, Facial, Massage..." value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
              </div>
              <div>
                <label className="label">Expected Price (₹)</label>
                <input type="number" className="input" min="0" placeholder="Optional" value={form.servicePrice} onChange={e => setForm(f => ({ ...f, servicePrice: e.target.value }))} />
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Your Details</h3>
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={form.customer.name} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, name: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className="input" required value={form.customer.phone} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, phone: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.customer.email} onChange={e => setForm(f => ({ ...f, customer: { ...f.customer, email: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} placeholder="Any specific requests?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">{loading ? 'Booking...' : 'Confirm Booking'}</button>
            </div>
          </form>
        )}
        <div className="text-center text-xs text-gray-400">{DEVELOPER_CREDIT}</div>
      </div>
    </div>
  );
}
