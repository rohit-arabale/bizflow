import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['greeting', 'faq', 'order', 'hours', 'location', 'custom'];
const defaultForm = { trigger: '', triggerType: 'contains', response: '', category: 'custom', priority: 0, isActive: true };

export default function WhatsApp() {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { from: 'bot', text: "Hi! I'm your WhatsApp bot simulator. Type a message to test your chatbot rules." }
  ]);
  const [simulating, setSimulating] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const fetchAll = async () => {
    try {
      const [rRes, lRes, sRes] = await Promise.all([
        api.get('/whatsapp/rules'),
        api.get('/whatsapp/logs?limit=30'),
        api.get('/whatsapp/stats')
      ]);
      setRules(rRes.data.rules);
      setLogs(lRes.data.logs);
      setStats(sRes.data.stats);
    } catch { toast.error('Failed to load WhatsApp data'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editRule) {
        await api.put(`/whatsapp/rules/${editRule._id}`, form);
        toast.success('Rule updated');
      } else {
        await api.post('/whatsapp/rules', form);
        toast.success('Rule created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving rule'); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try { await api.delete(`/whatsapp/rules/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleRule = async (rule) => {
    try {
      await api.put(`/whatsapp/rules/${rule._id}`, { isActive: !rule.isActive });
      fetchAll();
    } catch { toast.error('Update failed'); }
  };

  const openEdit = (r) => { setEditRule(r); setForm({ ...r }); setShowModal(true); };
  const openNew = () => { setEditRule(null); setForm(defaultForm); setShowModal(true); };

  const sendSimulation = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatHistory(h => [...h, { from: 'user', text: userMsg }]);
    setChatInput('');
    setSimulating(true);
    try {
      const res = await api.post('/whatsapp/simulate', { message: userMsg });
      setTimeout(() => {
        setChatHistory(h => [...h, { from: 'bot', text: res.data.reply, matched: res.data.matchedRule?.trigger }]);
        setSimulating(false);
      }, 600);
    } catch {
      setChatHistory(h => [...h, { from: 'bot', text: "Error getting response" }]);
      setSimulating(false);
    }
  };

  const categoryColors = { greeting: 'bg-green-100 text-green-700', faq: 'bg-blue-100 text-blue-700', order: 'bg-orange-100 text-orange-700', hours: 'bg-purple-100 text-purple-700', location: 'bg-teal-100 text-teal-700', custom: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">WhatsApp Chatbot</h1>
          <p className="text-gray-500 text-sm">{rules.length} rules active</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Rule</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Rules', value: stats.totalRules, icon: '📋' },
            { label: 'Total Chats', value: stats.totalLogs, icon: '💬' },
            { label: 'Top Rule', value: stats.topRules[0]?.trigger || '—', icon: '🏆' },
            { label: 'Top Hits', value: stats.topRules[0]?.hitCount || 0, icon: '🎯' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-xl text-gray-900 truncate">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['rules', 'simulator', 'logs'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'simulator' ? '🧪 Simulator' : t === 'logs' ? '📝 Logs' : '⚙️ Rules'}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">💬</div>
              <div className="font-display font-bold text-gray-900 mb-1">No chatbot rules yet</div>
              <div className="text-gray-500 text-sm mb-4">Create rules to auto-reply to WhatsApp messages</div>
              <button onClick={openNew} className="btn-primary">+ Add First Rule</button>
            </div>
          ) : rules.map(r => (
            <div key={r._id} className={`card p-5 transition-opacity ${!r.isActive ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[r.category]}`}>{r.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.triggerType}</span>
                    <span className="text-xs text-gray-400">Priority: {r.priority}</span>
                    <span className="text-xs text-gray-400">Hits: {r.hitCount}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 mb-1">
                        Trigger: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-primary-700 font-mono">{r.trigger}</code>
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line">{r.response}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(r)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.isActive ? 'bg-primary-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${r.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button onClick={() => openEdit(r)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Edit</button>
                  <button onClick={() => deleteRule(r._id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="card overflow-hidden max-w-lg mx-auto">
          <div className="bg-green-600 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">B</div>
            <div>
              <div className="font-semibold text-white text-sm">Business Bot</div>
              <div className="text-green-200 text-xs">WhatsApp Simulator</div>
            </div>
          </div>
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 shadow-sm text-sm ${msg.from === 'user' ? 'bg-green-500 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'}`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  {msg.matched && <div className="text-xs opacity-60 mt-1">✓ matched: "{msg.matched}"</div>}
                </div>
              </div>
            ))}
            {simulating && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Type a message... (try: hi, menu, timing)"
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendSimulation()} />
            <button onClick={sendSimulation} className="btn-primary px-4 text-sm">Send</button>
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400">Try: "hi", "menu", "timing", "location", "delivery"</p>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No chat logs yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log._id} className="px-5 py-3.5 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">From: {log.from}</div>
                      <div className="text-sm font-medium text-gray-900">📨 {log.message}</div>
                      {log.reply && <div className="text-sm text-gray-600 mt-1">🤖 {log.reply.substring(0, 100)}{log.reply.length > 100 ? '...' : ''}</div>}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex justify-between">
                <h2 className="font-display font-bold text-xl">{editRule ? 'Edit Rule' : 'New Rule'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Trigger Keyword *</label>
                  <input className="input" required placeholder="hi, menu, timing..." value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Match Type</label>
                  <select className="input" value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}>
                    <option value="contains">Contains</option>
                    <option value="exact">Exact match</option>
                    <option value="starts_with">Starts with</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority (higher = first)</label>
                  <input type="number" className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="label">Auto-Reply Message *</label>
                  <textarea className="input" rows={6} required placeholder="Type your reply here... Use emojis for better engagement!" value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} />
                  <p className="text-xs text-gray-400 mt-1">Tip: Use *bold*, line breaks, and emojis for WhatsApp formatting</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editRule ? 'Update Rule' : 'Create Rule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
