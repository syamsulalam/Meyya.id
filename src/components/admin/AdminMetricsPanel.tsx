import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Package, Users, Tags, ArrowRight, TrendingUp, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../store';
import { useAuthFetcher, useAuthFetch } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';

export default function AdminMetricsPanel({ onNavigate }: { onNavigate?: (tab: 'dashboard' | 'produk' | 'kategori' | 'crm' | 'voucher' | 'marketing') => void }) {
  const { addToast } = useStore();
  const [timeline, setTimeline] = useState('all');
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;
  
  const { data: metrics, error: metricsError, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR(authReady ? `/api/admin/metrics?timeline=${timeline}` : null, fetcher);
  const { data: ordersData, error: ordersError, isLoading: ordersLoading, mutate: mutateOrders } = useSWR(authReady ? '/api/admin/orders' : null, fetcher);
  
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const safeMetrics = metrics || { totalRevenue: 0, totalProfit: 0, totalOrders: 0, pendingOrders: 0, totalUsers: 0, totalProducts: 0, totalCategories: 0 };

  const confirmPayment = async (orderId: string) => {
    try {
      await authFetch(`/api/admin/orders/${orderId}/confirm`, { method: 'POST' });
      addToast('Pesanan berhasil dikonfirmasi', 'success');
      mutateOrders();
    } catch (e) {
      addToast('Error confirming payment', 'error');
    }
  };

  if (!authReady || metricsLoading || ordersLoading) return <div className="py-20 text-center flex flex-col items-center justify-center opacity-50"><RefreshCw className="animate-spin mb-4" /> {!authReady ? 'Menunggu sesi admin...' : 'Memuat data dashboard...'}</div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2"><TrendingUp size={24} /> Helicopter View</h2>
          <p className="text-sm font-light text-black/60">Ringkasan performa bisnis dan katalog Meyya.id.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/50 border border-black/10 rounded-full p-1 shadow-sm">
           <Filter size={14} className="ml-3 text-gray-400" />
           <select 
             value={timeline} 
             onChange={(e) => setTimeline(e.target.value)}
             className="bg-transparent text-sm py-2 pl-2 pr-4 outline-none font-medium text-ink focus:border-transparent focus:ring-0 cursor-pointer"
           >
              <option value="today">Hari Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="all">Semua Waktu</option>
           </select>
        </div>
      </div>

      {/* Main Metrics (Financial) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Pesanan</p>
          <p className="text-4xl font-light text-ink">{safeMetrics.totalOrders}</p>
          {safeMetrics.pendingOrders > 0 && (
             <p className="text-xs text-orange-500 mt-2 flex items-center gap-1"><AlertCircle size={12}/> {safeMetrics.pendingOrders} pesanan tertunda</p>
          )}
        </div>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Omset</p>
          <p className="text-4xl font-light text-ink">Rp {safeMetrics.totalRevenue?.toLocaleString('id-ID') || 0}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl bg-ink/5 border border-ink/10 relative overflow-hidden">
          <p className="text-sm uppercase tracking-widest font-semibold mb-2 text-emerald-700">Total Profit Bebersih</p>
          <p className="text-4xl font-light text-emerald-800">Rp {safeMetrics.totalProfit?.toLocaleString('id-ID') || 0}</p>
        </div>
      </div>

      {/* Sub-Metrics (Inventory & Users) */}
      <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Statistik Lanjutan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
         
         <div onClick={() => onNavigate?.('crm')} className="bg-white/40 border border-black/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Total User</p>
                <p className="text-xl font-medium">{safeMetrics.totalUsers}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-ink transition-colors" />
         </div>

         <div onClick={() => onNavigate?.('marketing')} className="bg-white/40 border border-black/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Marketing</p>
                <p className="text-xs font-semibold text-ink mt-1">Lihat CRM</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-ink transition-colors" />
         </div>

         <div onClick={() => onNavigate?.('produk')} className="bg-white/40 border border-black/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Produk</p>
                <p className="text-xl font-medium">{safeMetrics.totalProducts}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-ink transition-colors" />
         </div>

         <div onClick={() => onNavigate?.('kategori')} className="bg-white/40 border border-black/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Tags size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Kategori</p>
                <p className="text-xl font-medium">{safeMetrics.totalCategories}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-ink transition-colors" />
         </div>

      </div>

      <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Aktivitas Pesanan Terbaru</h3>
      <div className="glass-panel rounded-3xl overflow-hidden border border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/60 border-b border-black/5 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">ID Pesanan</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Tanggal</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Total Rp</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {orders.slice(0, 5).map((order: any) => (
                <tr key={order.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                  <td className="px-6 py-4">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium">Rp {(order.total_paid || 0).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      (order.status === 'COMPLETED' || order.status === 'PAID') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => confirmPayment(order.id)}
                        className="text-xs bg-ink text-white px-4 py-1.5 rounded-full hover:bg-black/80 font-medium transition-colors"
                      >
                        Konfirmasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Belum ada pesanan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {orders.length > 5 && (
             <div className="p-4 text-center border-t border-black/5 bg-white/30">
               <span className="text-xs text-gray-500">Menampilkan 5 pesanan terbaru</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
