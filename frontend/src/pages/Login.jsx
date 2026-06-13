import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { APP_NAME, DEVELOPER_CREDIT } from '../utils/branding';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-200">B</div>
          <h1 className="font-display font-bold text-3xl text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 mt-1">Local Business Automation Platform</p>
          <p className="text-xs text-gray-400 mt-2">{DEVELOPER_CREDIT}</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-6">Sign in to your dashboard</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="admin@business.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-1.5">
              {[
                { label: '🍛 Restaurant Admin', email: 'ramesh@spicegarden.com' },
                { label: '💅 Salon Admin', email: 'priya@glamoursalon.com' },
                { label: '🛒 Shop Admin', email: 'suresh@dailyneeds.com' }
              ].map(a => (
                <button key={a.email} onClick={() => fillDemo(a.email)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600 font-medium border border-transparent hover:border-gray-200">
                  {a.label} — {a.email}
                </button>
              ))}
              <p className="text-xs text-gray-400 pt-1">All passwords: <code className="bg-gray-200 px-1 rounded">password123</code></p>
            </div>
          </div>
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          New business?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:underline">Create account →</Link>
        </p>
      </div>
    </div>
  );
}
