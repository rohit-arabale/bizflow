import React, { useState, useEffect } from 'react';
import api, { getBackendOrigin } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [bizForm, setBizForm] = useState({ name: '', description: '', phone: '', email: '', address: { street: '', city: '', state: '', pincode: '' } });
  const [settingsForm, setSettingsForm] = useState({ openingTime: '09:00', closingTime: '21:00', slotDuration: 30, currency: 'INR', whatsappEnabled: false, whatsappNumber: '' });
  const webhookUrl = `${getBackendOrigin()}/api/whatsapp/webhook?business=${business?.slug || ''}`;

  useEffect(() => { fetchBusiness(); }, []);

  const fetchBusiness = async () => {
    try {
      const res = await api.get('/businesses/my');
      const biz = res.data.business;
      setBusiness(biz);
      setBizForm({ name: biz.name, description: biz.description || '', phone: biz.phone || '', email: biz.email || '', address: biz.address || { street: '', city: '', state: '', pincode: '' } });
      setSettingsForm({ openingTime: biz.settings?.openingTime || '09:00', closingTime: biz.settings?.closingTime || '21:00', slotDuration: biz.settings?.slotDuration || 30, currency: biz.settings?.currency || 'INR', whatsappEnabled: biz.settings?.whatsappEnabled || false, whatsappNumber: biz.settings?.whatsappNumber || '' });
      setProfileForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const saveBusiness = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/businesses/my', { ...bizForm, settings: settingsForm });
      toast.success('Business settings saved!');
      fetchBusiness();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/auth/profile', profileForm);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card p-8 animate-pulse h-64" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your business and account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {['general', 'hours', 'whatsapp', 'profile'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'general' ? '🏢 Business' : t === 'hours' ? '⏰ Hours' : t === 'whatsapp' ? '💬 WhatsApp' : '👤 Profile'}
          </button>
        ))}
      </div>

      {/* General / Business Info */}
      {activeTab === 'general' && (
        <form onSubmit={saveBusiness} className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Business Name</label>
                <input className="input" value={bizForm.name} onChange={e => setBizForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={bizForm.description} onChange={e => setBizForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={bizForm.phone} onChange={e => setBizForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={bizForm.email} onChange={e => setBizForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Street Address</label>
                <input className="input" value={bizForm.address.street} onChange={e => setBizForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={bizForm.address.city} onChange={e => setBizForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={bizForm.address.state} onChange={e => setBizForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" value={bizForm.address.pincode} onChange={e => setBizForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={settingsForm.currency} onChange={e => setSettingsForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Public Links</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">🍽️ Digital Menu:</span>
                <a href={`/menu/${business?.slug}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium flex-1 truncate">
                  {window.location.origin}/menu/{business?.slug}
                </a>
                <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/menu/${business?.slug}`); toast.success('Copied!'); }} className="text-xs btn-secondary py-1">Copy</button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">📅 Booking:</span>
                <a href={`/book/${business?.slug}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium flex-1 truncate">
                  {window.location.origin}/book/{business?.slug}
                </a>
                <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${business?.slug}`); toast.success('Copied!'); }} className="text-xs btn-secondary py-1">Copy</button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}

      {/* Hours */}
      {activeTab === 'hours' && (
        <form onSubmit={saveBusiness} className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Business Hours & Appointments</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input type="time" className="input" value={settingsForm.openingTime} onChange={e => setSettingsForm(f => ({ ...f, openingTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input type="time" className="input" value={settingsForm.closingTime} onChange={e => setSettingsForm(f => ({ ...f, closingTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">Appointment Slot Duration</label>
                <select className="input" value={settingsForm.slotDuration} onChange={e => setSettingsForm(f => ({ ...f, slotDuration: +e.target.value }))}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
              <strong>Preview:</strong> {settingsForm.openingTime} – {settingsForm.closingTime} with {settingsForm.slotDuration}-minute slots
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Hours'}</button>
        </form>
      )}

      {/* WhatsApp */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={saveBusiness} className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-1">WhatsApp Integration</h2>
            <p className="text-sm text-gray-500 mb-4">Connect your WhatsApp via Twilio Sandbox to auto-reply to customers</p>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" checked={settingsForm.whatsappEnabled} onChange={e => setSettingsForm(f => ({ ...f, whatsappEnabled: e.target.checked }))} className="rounded" />
                <div>
                  <div className="font-semibold text-sm text-gray-900">Enable WhatsApp Bot</div>
                  <div className="text-xs text-gray-500">Auto-reply to incoming WhatsApp messages</div>
                </div>
              </label>
              <div>
                <label className="label">Your WhatsApp Number</label>
                <input className="input" placeholder="9876543210" value={settingsForm.whatsappNumber} onChange={e => setSettingsForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Without country code, e.g. 9876543210</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Twilio Webhook URL</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <code className="text-xs text-gray-700 flex-1 break-all">
                {webhookUrl}
              </code>
              <button type="button" onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success('Copied!');
              }} className="text-xs btn-secondary py-1 flex-shrink-0">Copy</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Set this URL in your Twilio WhatsApp Sandbox settings (Messaging → When a message comes in)</p>
          </div>
          <div className="card p-6 bg-amber-50 border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">⚠️ Setup Instructions</h3>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Sign up at <a href="https://twilio.com" target="_blank" rel="noreferrer" className="underline">twilio.com</a> (free trial available)</li>
              <li>Go to Messaging → Try WhatsApp → Sandbox</li>
              <li>Send the join code from your phone to activate</li>
              <li>Set the webhook URL above in "When a message comes in"</li>
              <li>Add your Twilio credentials to backend <code>.env</code></li>
              <li>Test using the simulator tab above</li>
            </ol>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save WhatsApp Settings'}</button>
        </form>
      )}

      {/* Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Your Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={profileForm.email} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-semibold text-gray-700">Role: <span className="capitalize text-primary-700">{user?.role}</span></div>
                <div className="text-sm text-gray-500 mt-1">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Update Profile'}</button>
        </form>
      )}
    </div>
  );
}
