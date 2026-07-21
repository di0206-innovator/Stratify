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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-text-primary">
      <div className="flex items-center gap-4 pb-6 border-b border-DEFAULT select-none">
        <div className="w-12 h-12 bg-surface-dark flex items-center justify-center rounded-lg text-white">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Settings & Account</h1>
          <p className="font-inter text-text-muted mt-1 text-xs sm:text-sm">Manage your workspace preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="col-span-1 space-y-2 select-none">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border font-outfit font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-text-primary text-canvas border-text-primary shadow-sm'
                    : 'bg-card border-DEFAULT hover:border-text-primary text-text-secondary'
                }`}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="col-span-3 space-y-6">
          {activeSection === 'account' && (
            <div className="os-card bg-card p-6 space-y-6 border border-DEFAULT">
              <div className="flex items-center justify-between border-b border-DEFAULT pb-4 select-none">
                <h2 className="text-base font-outfit font-bold uppercase text-text-primary">Account Details</h2>
                {saved && (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-green-500 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full">
                    <CheckCircle size={10} /> Saved
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted tracking-wide mb-1.5 select-none">Email Address</label>
                  <input
                    type="text"
                    value={formData.email}
                    disabled
                    className="os-input bg-input-bg cursor-not-allowed text-text-muted font-semibold"
                  />
                  <p className="text-[10px] font-semibold text-text-muted mt-1 select-none">Email cannot be changed directly. Contact support.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted tracking-wide mb-1.5 select-none">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled={!editing}
                    onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                    className={`os-input border border-DEFAULT ${editing ? 'bg-card text-text-primary' : 'bg-input-bg cursor-not-allowed text-text-muted font-semibold'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted tracking-wide mb-1.5 select-none">Account Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="os-input bg-input-bg cursor-not-allowed text-text-muted font-semibold capitalize"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4 select-none">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-[#111] font-outfit font-bold uppercase text-xs tracking-wider hover:opacity-90 transition-all rounded-lg cursor-pointer border-0"
                      >
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setFormData({ username: user?.username || '', email: user?.email || '', role: user?.role || 'user' }); }}
                        className="px-4 py-2 bg-card border border-DEFAULT text-text-secondary font-outfit font-bold uppercase text-xs tracking-wider rounded-lg hover:border-text-primary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-[#111] font-outfit font-bold uppercase text-xs tracking-wider hover:opacity-90 transition-all rounded-lg cursor-pointer border-0 shadow-sm"
                    >
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="os-card bg-card border border-DEFAULT p-6 space-y-6">
              <h2 className="text-base font-outfit font-bold uppercase text-text-primary border-b border-DEFAULT pb-4 select-none">Security</h2>
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/100/10 border border-amber-500/20 text-amber-500 rounded-lg text-left select-none">
                  <p className="text-xs font-bold leading-relaxed">Your account is secured via Supabase Authentication.</p>
                  <p className="text-[10px] font-semibold opacity-80 mt-1 leading-relaxed">Password resets are handled through secure authentication tokens sent to your email.</p>
                </div>
                <div className="select-none">
                  <button className="px-4 py-2.5 bg-card border border-DEFAULT text-text-primary hover:border-text-primary font-outfit font-bold uppercase text-xs tracking-wider rounded-lg cursor-pointer transition-all">
                    Request Password Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="os-card bg-card border border-DEFAULT p-6 space-y-5">
              <h2 className="text-base font-outfit font-bold uppercase text-text-primary border-b border-DEFAULT pb-4 select-none">Notifications</h2>
              <div className="space-y-3 select-none">
                {[
                  { label: 'New match found', desc: 'Get notified when Stratify finds a compatible partner or investor' },
                  { label: 'Score changes', desc: 'Alert when your startup validation score updates' },
                  { label: 'New opportunities', desc: 'Weekly digest of new grants and accelerator programs' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-4 border border-DEFAULT bg-hover rounded-xl text-left">
                    <div>
                      <p className="text-xs font-bold uppercase text-text-primary">{item.label}</p>
                      <p className="text-[10px] font-semibold text-text-muted mt-1 font-inter">{item.desc}</p>
                    </div>
                    <div className="w-8 h-4 bg-accent border border-DEFAULT rounded-full flex-shrink-0 cursor-pointer relative">
                      <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-black rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeSection === 'billing' || activeSection === 'api') && (
            <div className="os-card bg-card border border-DEFAULT p-12 text-center select-none space-y-4">
              <div className="bg-surface-dark p-3.5 text-white rounded-lg inline-block border border-DEFAULT">
                {activeSection === 'billing' ? <Wallet size={24} /> : <Key size={24} />}
              </div>
              <h3 className="font-outfit font-bold text-lg text-text-primary uppercase">
                {activeSection === 'billing' ? 'Billing & Subscription' : 'API Keys'}
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed font-light font-inter">
                {activeSection === 'billing'
                  ? 'Stratify is currently in early access. Subscription management will be available soon.'
                  : 'API key management for external integrations is coming soon.'}
              </p>
              <div>
                <span className="inline-block bg-accent-muted border border-accent/30 text-text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full mt-2">
                  Coming Soon
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
