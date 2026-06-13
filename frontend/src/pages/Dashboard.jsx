import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StatCard = ({ icon, label, value, sub, color = 'primary', link }) => {
  const colors = {
    primary: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };
  const card = (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-lg shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="font-display font-bold text-2xl text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
    } catch { } finally { setLoading(false); }
  };

  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n || 0}`;

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-32 bg-gray-100" />)}
    </div>
  );

  const { today = {}, month = {}, inventory = {}, revenueChart = [], recentOrders = [], upcomingAppointments = [], orderStatusBreakdown = [] } = stats || {};

  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6', ready: '#14b8a6', delivered: '#10b981', cancelled: '#ef4444' };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{user?.business?.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🛒" label="Today's Orders" value={today.orders || 0} sub="Total orders placed" color="primary" link="/orders" />
        <StatCard icon="💰" label="Today's Revenue" value={fmt(today.revenue)} sub="Before taxes" color="green" link="/orders" />
        <StatCard icon="📅" label="Today's Bookings" value={today.appointments || 0} sub="Appointments" color="blue" link="/appointments" />
        <StatCard icon={inventory.lowStockCount > 0 ? "⚠️" : "📦"} label="Low Stock Items" value={inventory.lowStockCount || 0} sub="Need restocking" color={inventory.lowStockCount > 0 ? 'red' : 'purple'} link="/inventory" />
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-sm font-semibold text-gray-500 mb-1">Monthly Revenue</div>
          <div className="font-display font-bold text-3xl text-gray-900">{fmt(month.revenue)}</div>
          <div className="text-xs text-gray-400 mt-1">{month.orders || 0} orders this month</div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold text-gray-500 mb-1">Avg Order Value</div>
          <div className="font-display font-bold text-3xl text-gray-900">
            {month.orders ? fmt(Math.round(month.revenue / month.orders)) : '₹0'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Per transaction</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-bold text-gray-900 mb-4">Revenue – Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-gray-900 mb-4">Order Status</h3>
          {orderStatusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {orderStatusBreakdown.map(s => (
                <div key={s._id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColors[s._id] || '#9ca3af' }} />
                  <div className="text-sm text-gray-700 capitalize flex-1">{s._id}</div>
                  <div className="font-bold text-sm text-gray-900">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-display font-bold text-gray-900">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-primary-600 font-semibold hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(o => (
                <div key={o._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{o.orderNumber}</div>
                    <div className="text-xs text-gray-500">{o.customer?.name} • {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900">₹{o.total}</span>
                    <span className={`badge-${o.status}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-display font-bold text-gray-900">Upcoming Appointments</h3>
            <Link to="/appointments" className="text-sm text-primary-600 font-semibold hover:underline">View all →</Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No upcoming appointments</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingAppointments.map(a => (
                <div key={a._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{a.customer?.name}</div>
                    <div className="text-xs text-gray-500">{a.service} • {a.timeSlot}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className={`badge-${a.status}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/orders" className="btn-primary text-sm">+ New Order</Link>
          <Link to="/appointments" className="btn-secondary text-sm">+ New Appointment</Link>
          <Link to="/inventory" className="btn-secondary text-sm">+ Add Product</Link>
          <Link to={`/menu/${user?.business?.slug}`} target="_blank" className="btn-secondary text-sm">🔗 View Menu</Link>
          <Link to={`/book/${user?.business?.slug}`} target="_blank" className="btn-secondary text-sm">🔗 Booking Page</Link>
        </div>
      </div>
    </div>
  );
}
