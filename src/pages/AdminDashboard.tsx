import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Settings, Box, Tags, Users, Ticket, MessageSquare, CreditCard, Truck, ClipboardList, ListChecks, HardDrive, Banknote } from 'lucide-react';
import AdminMetricsPanel from '../components/admin/AdminMetricsPanel';
import AdminProductForm from '../components/admin/AdminProductForm';
import AdminCategoryManager from '../components/admin/AdminCategoryManager';
import AdminCRMManager from '../components/admin/AdminCRMManager';
import AdminVoucherManager from '../components/admin/AdminVoucherManager';
import AdminMarketingPanel from '../components/admin/AdminMarketingPanel';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';
import AdminShippingSettings from '../components/admin/AdminShippingSettings';
import AdminOrderManager from '../components/admin/AdminOrderManager';
import AdminDevelopmentRoadmap from '../components/admin/AdminDevelopmentRoadmap';
import AdminFreeTierPanel from '../components/admin/AdminFreeTierPanel';
import AdminFinancePanel from '../components/admin/AdminFinancePanel';
import Tooltip from '../components/Tooltip';
import { useUser } from '@clerk/react';

export default function AdminDashboard() {
  const { user: localUser } = useStore();
  const { user: clerkUser, isLoaded } = useUser();
  const navigate = useNavigate();
  
  type AdminTab = 'dashboard' | 'produk' | 'kategori' | 'crm' | 'voucher' | 'marketing' | 'payment' | 'shipping' | 'orders' | 'roadmap' | 'free-tier' | 'finance';

  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    return (localStorage.getItem('adminActiveTab') as any) || 'marketing';
  });

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  useEffect(() => {
    if (isLoaded) {
      const isLocalAdmin = localUser?.role === 'admin';
      const isClerkAdmin = clerkUser?.publicMetadata?.role === 'admin';
      if (!isLocalAdmin && !isClerkAdmin) {
        navigate('/');
      }
    }
  }, [localUser, clerkUser, isLoaded, navigate]);

  if (!isLoaded) return null;
  const isLocalAdmin = localUser?.role === 'admin';
  const isClerkAdmin = clerkUser?.publicMetadata?.role === 'admin';
  
  if (!isLocalAdmin && !isClerkAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 w-full flex-1 flex flex-col">
      <h1 className="text-3xl font-light font-heading mb-12 text-center text-ink flex-shrink-0">Dashboard Admin</h1>

      <div className="glass-panel p-2 md:p-4 rounded-[32px] md:rounded-[48px] flex flex-col lg:flex-row gap-2 md:gap-4 shadow-xl border border-white/40 flex-1 min-h-0">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-28 bg-white/40 rounded-[24px] md:rounded-[36px] p-4 md:p-6 flex flex-col items-center flex-shrink-0 border border-black/5 z-20 relative">
             <nav className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide justify-start md:justify-center items-center w-full sticky lg:top-28">
                <Tooltip content="Dashboard" position="right">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'dashboard' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Settings size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Pelanggan (CRM)" position="right">
                  <button
                    onClick={() => setActiveTab('crm')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'crm' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Users size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Marketing WA" position="right">
                  <button
                    onClick={() => setActiveTab('marketing')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'marketing' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <MessageSquare size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Kategori Produk" position="right">
                  <button
                    onClick={() => setActiveTab('kategori')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'kategori' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Tags size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Manajemen Produk" position="right">
                  <button
                    onClick={() => setActiveTab('produk')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'produk' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Box size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Manajemen Voucher & Promo" position="right">
                  <button
                    onClick={() => setActiveTab('voucher')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'voucher' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Ticket size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Pembayaran" position="right">
                  <button
                    onClick={() => setActiveTab('payment')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'payment' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <CreditCard size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Keuangan" position="right">
                  <button
                    onClick={() => setActiveTab('finance')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'finance'
                        ? 'bg-ink text-white shadow-md scale-110'
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Banknote size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Operasional Toko" position="right">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'orders'
                        ? 'bg-ink text-white shadow-md scale-110'
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <ClipboardList size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Pengiriman" position="right">
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'shipping' 
                        ? 'bg-ink text-white shadow-md scale-110' 
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <Truck size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Roadmap Pengembangan" position="right">
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'roadmap'
                        ? 'bg-ink text-white shadow-md scale-110'
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <ListChecks size={20} />
                  </button>
                </Tooltip>
                <Tooltip content="Limit Free Tier" position="right">
                  <button
                    onClick={() => setActiveTab('free-tier')}
                    className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'free-tier'
                        ? 'bg-ink text-white shadow-md scale-110'
                        : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                    }`}
                  >
                    <HardDrive size={20} />
                  </button>
                </Tooltip>
             </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-white/60 rounded-[24px] md:rounded-[36px] p-6 lg:p-12 border border-black/5 min-h-[600px] flex flex-col">
          {activeTab === 'dashboard' && <AdminMetricsPanel onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'crm' && <AdminCRMManager />}
          {activeTab === 'marketing' && <AdminMarketingPanel />}
          {activeTab === 'kategori' && <AdminCategoryManager />}
          {activeTab === 'produk' && <AdminProductForm />}
          {activeTab === 'voucher' && <AdminVoucherManager />}
          {activeTab === 'payment' && <AdminPaymentSettings />}
          {activeTab === 'finance' && <AdminFinancePanel />}
          {activeTab === 'orders' && <AdminOrderManager />}
          {activeTab === 'shipping' && <AdminShippingSettings />}
          {activeTab === 'roadmap' && <AdminDevelopmentRoadmap />}
          {activeTab === 'free-tier' && <AdminFreeTierPanel />}
        </div>
      </div>
    </div>
  );
}
