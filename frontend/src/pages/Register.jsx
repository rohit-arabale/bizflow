import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { APP_NAME, DEVELOPER_CREDIT } from '../utils/branding';

const bizTypes = [
  { value: 'restaurant', label: '🍛 Restaurant', desc: 'Dine-in, takeaway, delivery' },
  { value: 'salon', label: '💅 Salon/Spa', desc: 'Appointments & services' },
  { value: 'shop', label: '🛒 Retail Shop', desc: 'Products & inventory' },
  { value: 'other', label: '🏢 Other', desc: 'Any local business' }
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '', businessType: '' });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessType) return toast.error('Please select a business type');
    setLoading(true);
    try {
      await register(form);
      toast.success('Business registered! Welcome to BizFlow 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-200">B</div>
          <h1 className="font-display font-bold text-3xl text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 mt-1">Set up your business in 2 minutes</p>
          <p className="text-xs text-gray-400 mt-2">{DEVELOPER_CREDIT}</p>
        </div>

        <div className="card p-8">
          {/* Steps */}
          <div className="flex items-center mb-8">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                  <span className="text-sm font-medium hidden sm:block">{s === 1 ? 'Your Info' : 'Business'}</span>
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 mx-3 ${step > s ? 'bg-primary-400' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Your details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="Ramesh Kumar" value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="you@business.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="password" className="input" placeholder="6+ characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" placeholder="9876543210" value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => { if (!form.name || !form.email || !form.password) return toast.error('Fill all fields'); setStep(2); }}
                  className="btn-primary w-full py-3">Next →</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-xl text-gray-900 mb-4">About your business</h2>
                <div>
                  <label className="label">Business Name</label>
                  <input className="input" placeholder="Spice Garden Restaurant" value={form.businessName} onChange={e => update('businessName', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Business Type</label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {bizTypes.map(t => (
                      <button type="button" key={t.value} onClick={() => update('businessType', t.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.businessType === t.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-lg mb-1">{t.label.split(' ')[0]}</div>
                        <div className="text-xs font-semibold text-gray-800">{t.label.split(' ').slice(1).join(' ')}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                    {loading ? 'Creating...' : 'Launch Business 🚀'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
