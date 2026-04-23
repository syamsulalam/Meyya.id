import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Settings, Box, Tags } from 'lucide-react';
import AdminMetricsPanel from '../components/admin/AdminMetricsPanel';
import AdminProductForm from '../components/admin/AdminProductForm';
import AdminCategoryManager from '../components/admin/AdminCategoryManager';
import Tooltip from '../components/Tooltip';

export default function AdminDashboard() {
  const { user } = useStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'produk' | 'kategori'>('dashboard');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 w-full flex-1">
      <h1 className="text-3xl font-light font-heading mb-12 text-center text-ink">Dashboard Admin</h1>

      <div className="glass-panel p-2 md:p-4 rounded-[32px] md:rounded-[48px] flex flex-col lg:flex-row gap-2 md:gap-4 shadow-xl border border-white/40">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-28 bg-white/40 rounded-[24px] md:rounded-[36px] p-4 md:p-6 flex flex-col items-center flex-shrink-0 border border-black/5">
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
             </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-white/60 rounded-[24px] md:rounded-[36px] p-6 lg:p-12 border border-black/5 min-h-[600px]">
          {activeTab === 'dashboard' && <AdminMetricsPanel />}
          {activeTab === 'kategori' && <AdminCategoryManager />}
          {activeTab === 'produk' && <AdminProductForm />}
        </div>
      </div>
    </div>
  );
}
