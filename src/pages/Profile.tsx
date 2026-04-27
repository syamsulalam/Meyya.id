import { User, Package, History, Eye, Ticket, HelpCircle, Heart } from 'lucide-react';
import { useStore } from '../store';
import { Navigate } from 'react-router-dom';
import React, { useState } from 'react';
import Tooltip from '../components/Tooltip';

import ProfileAccount from '../components/profile/ProfileAccount';
import ProfileStatus from '../components/profile/ProfileStatus';
import ProfileHistory from '../components/profile/ProfileHistory';
import ProfileRecentlyViewed from '../components/profile/ProfileRecentlyViewed';
import ProfileVouchers from '../components/profile/ProfileVouchers';
import ProfileHelp from '../components/profile/ProfileHelp';
import ProfileRecommendations from '../components/profile/ProfileRecommendations';

export default function Profile() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'akun' | 'status' | 'riwayat' | 'terakhir' | 'voucher' | 'bantuan' | 'rekomendasi'>('akun');
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'akun', label: 'Akun Saya', icon: <User size={16} /> },
    { id: 'status', label: 'Status Pesanan', icon: <Package size={16} /> },
    { id: 'riwayat', label: 'Riwayat Pesanan', icon: <History size={16} /> },
    { id: 'terakhir', label: 'Terakhir Dilihat', icon: <Eye size={16} /> },
    { id: 'voucher', label: 'Voucher', icon: <Ticket size={16} /> },
    { id: 'bantuan', label: 'Pusat Bantuan', icon: <HelpCircle size={16} /> },
    { id: 'rekomendasi', label: 'Rekomendasi', icon: <Heart size={16} /> },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 w-full flex-1">
      
      <h1 className="text-3xl font-light font-heading mb-12 text-center text-ink">Profil (<i>Account</i>)</h1>
      
      <div className="glass-panel p-2 md:p-4 rounded-[32px] md:rounded-[48px] flex flex-col lg:flex-row gap-2 md:gap-4 shadow-xl border border-white/40">
        
        {/* Sidebar Menu */}
        <div className="w-full lg:w-28 bg-white/40 rounded-[24px] md:rounded-[36px] p-4 md:p-6 flex flex-col items-center flex-shrink-0 border border-black/5">
          <nav className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide justify-start md:justify-center items-center w-full sticky lg:top-28">
            {tabs.map((tab) => (
              <React.Fragment key={tab.id}>
                <Tooltip content={tab.label} position="right">
                  <button
                    type="button"
                    onClick={() => {
                      if (isBlockerOpen) return; // Prevent tab change if unsaved
                      setActiveTab(tab.id as any);
                    }}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === tab.id 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    } ${isBlockerOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {tab.icon}
                  </button>
                </Tooltip>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/60 rounded-[24px] md:rounded-[36px] p-6 lg:p-12 border border-black/5 min-h-[500px]">
            {activeTab === 'akun' && <ProfileAccount user={user} setBlockerOpen={setIsBlockerOpen} />}
            {activeTab === 'status' && <ProfileStatus />}
            {activeTab === 'riwayat' && <ProfileHistory />}
            {activeTab === 'terakhir' && <ProfileRecentlyViewed />}
            {activeTab === 'voucher' && <ProfileVouchers />}
            {activeTab === 'bantuan' && <ProfileHelp />}
            {activeTab === 'rekomendasi' && <ProfileRecommendations />}
          </div>
        </div>
      </div>
    </div>
  );
}
