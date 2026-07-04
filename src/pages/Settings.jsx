import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Wallet, Key, Save, Edit2, CheckCircle } from 'lucide-react';

export default function Settings({ user }) {
  const [activeSection, setActiveSection] = useState('account');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const sidebarItems = [
    { id: 'account', label: 'Account Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: Wallet },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 border-b-[4px] border-black pb-6">
        <div className="w-16 h-16 bg-[#EF4444] border-[3px] border-black flex items-center justify-center shadow-neo-button">
          <SettingsIcon size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Settings & Account</h1>
          <p className="font-bold text-gray-500 font-outfit">Manage your workspace preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <div className="col-span-1 space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 border-[3px] text-left font-black uppercase text-xs transition-all ${
                  activeSection === item.id
                    ? 'bg-black text-white border-black shadow-none'
                    : 'bg-white border-transparent hover:border-black text-gray-600 hover:text-black'
                }`}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="col-span-3 space-y-6">
          {activeSection === 'account' && (
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-button space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase">Account Details</h2>
                {saved && (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase text-green-700 bg-[#A3E635] border-[2px] border-black px-2 py-1">
                    <CheckCircle size={12} /> Saved
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Email</label>
                  <input
                    type="text"
                    value={formData.email}
                    disabled
                    className="w-full p-2.5 border-[2px] border-black bg-gray-100 font-bold font-outfit text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Email cannot be changed directly. Contact support.</p>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled={!editing}
                    onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                    className={`w-full p-2.5 border-[2px] border-black font-bold font-outfit text-sm transition-colors ${
                      editing ? 'bg-white focus:outline-none focus:border-[#3B82F6]' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="w-full p-2.5 border-[2px] border-black bg-gray-100 font-bold font-outfit text-sm cursor-not-allowed capitalize"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#A3E635] border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                      >
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setFormData({ username: user?.username || '', email: user?.email || '', role: user?.role || 'user' }); }}
                        className="px-4 py-2 bg-white border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FCD34D] border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-button">
              <h2 className="text-xl font-black uppercase mb-4">Security</h2>
              <div className="space-y-4">
                <div className="p-4 bg-[#FCD34D]/30 border-[2px] border-black">
                  <p className="text-sm font-bold">Your account is secured via Supabase Authentication.</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">Password resets are handled through your registered email.</p>
                </div>
                <button className="px-4 py-2 bg-white border-[2px] border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  Request Password Reset
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-button">
              <h2 className="text-xl font-black uppercase mb-4">Notifications</h2>
              <div className="space-y-3">
                {[
                  { label: 'New match found', desc: 'Get notified when Stratify finds a compatible partner or investor' },
                  { label: 'Score changes', desc: 'Alert when your startup validation score updates' },
                  { label: 'New opportunities', desc: 'Weekly digest of new grants and accelerator programs' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 p-3 border-[2px] border-black">
                    <div>
                      <p className="text-xs font-black uppercase">{item.label}</p>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div className="w-8 h-4 bg-[#A3E635] border-[2px] border-black rounded-full flex-shrink-0 cursor-pointer relative">
                      <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-black rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeSection === 'billing' || activeSection === 'api') && (
            <div className="bg-white border-[3px] border-black p-12 text-center shadow-neo-button">
              <div className="bg-[#FCD34D] border-[3px] border-black p-4 inline-block mb-4">
                {activeSection === 'billing' ? <Wallet size={28} /> : <Key size={28} />}
              </div>
              <h3 className="text-xl font-black uppercase mb-2">
                {activeSection === 'billing' ? 'Billing & Subscription' : 'API Keys'}
              </h3>
              <p className="text-sm font-bold text-gray-500 max-w-sm mx-auto">
                {activeSection === 'billing'
                  ? 'Stratify is currently in early access. Subscription management will be available soon.'
                  : 'API key management for external integrations is coming soon.'}
              </p>
              <span className="inline-block mt-4 bg-black text-white px-3 py-1 text-[10px] font-black uppercase">Coming Soon</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
