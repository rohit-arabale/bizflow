import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { APP_NAME, DEVELOPER_CREDIT } from '../../utils/branding';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/orders', icon: '🛒', label: 'Orders' },
  { to: '/inventory', icon: '📦', label: 'Inventory' },
  { to: '/appointments', icon: '📅', label: 'Appointments' },
  { to: '/whatsapp', icon: '💬', label: 'WhatsApp Bot' },
  { to: '/staff', icon: '👥', label: 'Staff' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {}
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const bizType = user?.business?.type;
  const bizName = user?.business?.name || APP_NAME;

  const typeColors = { restaurant: 'bg-orange-500', salon: 'bg-pink-500', shop: 'bg-blue-500', other: 'bg-gray-500' };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${typeColors[bizType] || 'bg-primary-600'} flex items-center justify-center text-white font-bold text-lg`}>
              {bizName[0]}
            </div>
            <div>
              <div className="font-display font-bold text-gray-900 text-sm leading-tight">{bizName}</div>
              <div className="text-xs text-gray-400 capitalize">{bizType} • {user?.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Quick Links */}
        {bizType === 'restaurant' && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-400 font-semibold px-3 mb-1 uppercase tracking-wider">Public Links</p>
            <a href={`/menu/${user?.business?.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <span>🔗</span> View Menu
            </a>
          </div>
        )}
        {bizType === 'salon' && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-400 font-semibold px-3 mb-1 uppercase tracking-wider">Public Links</p>
            <a href={`/book/${user?.business?.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <span>🔗</span> Booking Page
            </a>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <div className="w-5 h-0.5 bg-gray-600 mb-1.5"></div>
            <div className="w-5 h-0.5 bg-gray-600 mb-1.5"></div>
            <div className="w-5 h-0.5 bg-gray-600"></div>
          </button>
          <h1 className="font-display font-bold text-gray-900 text-lg hidden sm:block">{APP_NAME}</h1>
          <div className="flex-1" />
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setShowNotif(!showNotif); if (!showNotif && unread > 0) markAllRead(); }}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Notifications</span>
                  <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                  ) : notifications.map(n => (
                    <div key={n._id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? 'bg-primary-50/30' : ''}`}>
                      <div className="font-semibold text-sm text-gray-900">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
          <div className="mt-6 text-center text-xs text-gray-400">{DEVELOPER_CREDIT}</div>
        </div>
      </main>
    </div>
  );
}
