import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Wallet, Key } from 'lucide-react';

export default function Settings({ user }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-white border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left font-black uppercase text-xs">
            <User size={16} /> Account Profile
          </button>
          <button className="w-full flex items-center gap-3 p-3 bg-gray-50 border-[3px] border-transparent hover:border-black text-left font-bold uppercase text-xs text-gray-500">
            <Shield size={16} /> Security
          </button>
          <button className="w-full flex items-center gap-3 p-3 bg-gray-50 border-[3px] border-transparent hover:border-black text-left font-bold uppercase text-xs text-gray-500">
            <Bell size={16} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 p-3 bg-gray-50 border-[3px] border-transparent hover:border-black text-left font-bold uppercase text-xs text-gray-500">
            <Wallet size={16} /> Billing
          </button>
          <button className="w-full flex items-center gap-3 p-3 bg-gray-50 border-[3px] border-transparent hover:border-black text-left font-bold uppercase text-xs text-gray-500">
            <Key size={16} /> API Keys
          </button>
        </div>

        {/* Settings Content */}
        <div className="col-span-3 space-y-6">
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <h2 className="text-xl font-black uppercase mb-4">Account Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Email</label>
                <input 
                  type="text" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full p-2 border-[2px] border-black bg-gray-100 font-bold font-outfit" 
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Username</label>
                <input 
                  type="text" 
                  value={user?.username || ''} 
                  disabled
                  className="w-full p-2 border-[2px] border-black bg-gray-100 font-bold font-outfit" 
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Role</label>
                <input 
                  type="text" 
                  value={user?.role || 'user'} 
                  disabled
                  className="w-full p-2 border-[2px] border-black bg-gray-100 font-bold font-outfit" 
                />
              </div>
              <button className="px-4 py-2 bg-[#FCD34D] border-[2px] border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
