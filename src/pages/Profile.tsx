import { User, Package, History, Eye, Ticket, HelpCircle, Heart, LogIn } from 'lucide-react';
import { useStore } from '../store';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Tooltip from '../components/Tooltip';
import { useUser, SignInButton } from '@clerk/react';

import ProfileAccount from '../components/profile/ProfileAccount';
import ProfileStatus from '../components/profile/ProfileStatus';
import ProfileHistory from '../components/profile/ProfileHistory';
import ProfileRecentlyViewed from '../components/profile/ProfileRecentlyViewed';
import ProfileVouchers from '../components/profile/ProfileVouchers';
import ProfileHelp from '../components/profile/ProfileHelp';
import ProfileRecommendations from '../components/profile/ProfileRecommendations';

export default function Profile() {
  const { user: localUser } = useStore();
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  
  type TabType = 'akun' | 'status' | 'riwayat' | 'terakhir' | 'voucher' | 'bantuan' | 'rekomendasi';
  
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTabState] = useState<TabType>(tabFromUrl || 'akun');
  const navigate = useNavigate();

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser?.publicMetadata?.role === 'admin') {
      navigate('/admin');
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 w-full flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    );
  }

  // Profil yang terautentikasi adalah ketika Clerk User ada, ATAU User Admin (localStore) ada.
  // Untuk flow biasa, gunakan Clerk isSignedIn
  if (!isSignedIn && localUser?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 md:py-32 w-full flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mb-8">
          <User size={40} className="text-black/40" />
        </div>
        <h1 className="text-3xl font-light font-heading mb-4 text-ink">Halo, Tamu!</h1>
        <p className="text-gray-600 mb-10 max-w-md mx-auto">
          Silakan masuk atau daftar terlebih dahulu untuk mengakses profil Anda, melihat riwayat pesanan, menyimpan wishlist, dan menikmati fitur MEYYA.ID lainnya.
        </p>
        
        <Link to="/login" className="flex items-center gap-3 bg-ink text-white px-8 py-4 rounded-full font-medium tracking-wide uppercase text-sm hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200">
          <LogIn size={18} />
          Masuk / Daftar Sekarang
        </Link>
      </div>
    );
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
            {activeTab === 'akun' && <ProfileAccount user={localUser || clerkUser} setBlockerOpen={setIsBlockerOpen} />}
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
