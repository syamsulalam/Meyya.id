import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Settings, ShoppingBag, Plus, Upload, Box } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'produk'>('dashboard');
  
  const [metrics, setMetrics] = useState({ omzet: 0, profit: 0, total_orders: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [hargaKainRoll, setHargaKainRoll] = useState(0);
  const [yieldKain, setYieldKain] = useState(1);
  const [biayaJahitTotal, setBiayaJahitTotal] = useState(0);
  const [biayaJahitSatuan, setBiayaJahitSatuan] = useState(0);
  const [biayaLabel, setBiayaLabel] = useState(0);
  const [biayaHangTag, setBiayaHangTag] = useState(0);
  const [biayaProduksiTambahan, setBiayaProduksiTambahan] = useState(0);
  const [biayaZipperBag, setBiayaZipperBag] = useState(0);
  const [biayaKresek, setBiayaKresek] = useState(0);
  const [biayaPackaging, setBiayaPackaging] = useState(0);
  const [biayaLumpsum, setBiayaLumpsum] = useState(0);
  
  const [hargaJual, setHargaJual] = useState(0);

  // Breakdown Calculations
  const costKainSatuan = yieldKain > 0 ? (hargaKainRoll / yieldKain) : 0;
  const costJahitSatuan = biayaJahitTotal > 0 && yieldKain > 0 ? (biayaJahitTotal / yieldKain) : biayaJahitSatuan;
  const costLumpsumSatuan = biayaLumpsum > 0 && yieldKain > 0 ? (biayaLumpsum / yieldKain) : 0;
  
  const totalCostSatuan = costKainSatuan + costJahitSatuan + biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging + costLumpsumSatuan;
  
  const estimatedProfit = hargaJual - totalCostSatuan;
  const profitMargin = hargaJual > 0 ? ((estimatedProfit / hargaJual) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [metricsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/metrics'),
          fetch('/api/admin/orders')
        ]);
        setMetrics(await metricsRes.json());
        setOrders(await ordersRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const confirmPayment = async (orderId: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/confirm`, { method: 'POST' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
    } catch (e) {
      alert('Error confirming payment');
    }
  };

  if (loading) return <div className="py-20 text-center">Memuat dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 w-full flex-1">
      <h1 className="text-3xl font-light font-heading mb-12 text-center text-ink">Dashboard Admin</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="glass-panel p-6 rounded-3xl sticky top-24">
             <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm transition-all whitespace-nowrap ${
                    activeTab === 'dashboard' 
                      ? 'bg-ink text-white font-medium shadow-md' 
                      : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <Settings size={16} /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('produk')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm transition-all whitespace-nowrap ${
                    activeTab === 'produk' 
                      ? 'bg-ink text-white font-medium shadow-md' 
                      : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <Box size={16} /> Manajemen Produk
                </button>
             </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-panel p-6 rounded-3xl">
                  <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Pesanan</p>
                  <p className="text-4xl font-light">{metrics.total_orders}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl">
                  <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Omzet</p>
                  <p className="text-4xl font-light">Rp {metrics.omzet.toLocaleString('id-ID')}</p>
                </div>
                <div className="glass-panel p-6 rounded-3xl bg-black/5">
                  <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Profit</p>
                  <p className="text-4xl font-light text-green-600">Rp {metrics.profit.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <h2 className="text-xl font-medium mb-6">Manajemen Pesanan</h2>
              <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/40 border-b border-black/5 text-gray-500">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">ID Pesanan</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Total Rp</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-white/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                          <td className="px-6 py-4">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 font-medium">Rp {order.total_paid.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {order.status === 'pending_payment' && (
                              <button 
                                onClick={() => confirmPayment(order.id)}
                                className="text-xs glass-button-outline px-3 py-1"
                              >
                                Konfirmasi Pembayaran
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
                </div>
              </div>
            </div>
          )}

          {activeTab === 'produk' && (
            <div className="glass-panel p-8 md:p-12 rounded-[40px]">
              <h2 className="text-2xl font-light mb-8 font-heading">Tambah Produk Baru</h2>
              
              <form className="space-y-12">
                
                {/* 1. Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">1. Informasi Dasar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Foto Produk</label>
                       <div className="border-2 border-dashed border-black/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/50 transition-colors">
                          <Upload className="opacity-30 mb-4" size={32} />
                          <p className="text-sm font-medium">Klik untuk upload foto</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                       </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Nama Produk</label>
                      <input type="text" placeholder="Mis: Pashmina Silk Premium" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Kategori Produk</label>
                      <select className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm">
                        <option>Pashmina</option>
                        <option>Abaya</option>
                        <option>Khimar</option>
                        <option>Inner</option>
                        <option>Aksesoris</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Warna (Pisahkan dengan koma)</label>
                      <input type="text" placeholder="Mis: Hitam, Nude, Sage" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Ukuran Tersedia</label>
                      <input type="text" placeholder="Mis: All Size, S, M, L" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Deskripsi Produk</label>
                       <textarea rows={4} className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 resize-none text-sm"></textarea>
                    </div>
                  </div>
                </div>

                {/* 2. Biaya Produksi */}
                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">2. Kalkulasi Biaya Produksi (HPP)</h3>
                  
                  <div className="bg-white/40 p-6 rounded-3xl border border-black/5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Harga Kain 1 Roll (Rp)</label>
                        <input type="number" value={hargaKainRoll || ''} onChange={e => setHargaKainRoll(Number(e.target.value))} placeholder="Mis: 1500000" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Yield (Jml Produk per Roll)</label>
                        <input type="number" value={yieldKain || ''} onChange={e => setYieldKain(Number(e.target.value))} placeholder="Mis: 30" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Biaya Jahit Satuan (Rp)</label>
                        <input type="number" value={biayaJahitSatuan || ''} onChange={e => setBiayaJahitSatuan(Number(e.target.value))} placeholder="Isi ini jika jahit bayar per pcs" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Atau Biaya Jahit Borongan/Roll (Rp)</label>
                        <input type="number" value={biayaJahitTotal || ''} onChange={e => setBiayaJahitTotal(Number(e.target.value))} placeholder="Isi ini bila borongan" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm" />
                      </div>
                    </div>

                    <h4 className="text-xs uppercase font-medium mt-4 pt-4 border-t border-black/5">Biaya Aksesoris & Packaging (Per Pcs)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Label</label>
                        <input type="number" value={biayaLabel || ''} onChange={e => setBiayaLabel(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Hang Tag</label>
                        <input type="number" value={biayaHangTag || ''} onChange={e => setBiayaHangTag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Zipper Bag</label>
                        <input type="number" value={biayaZipperBag || ''} onChange={e => setBiayaZipperBag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Kresek / Pouch</label>
                        <input type="number" value={biayaKresek || ''} onChange={e => setBiayaKresek(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Ekstra Packaging</label>
                        <input type="number" value={biayaPackaging || ''} onChange={e => setBiayaPackaging(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase opacity-60 mb-1">Lain-lain / Lumpsum</label>
                        <input type="number" value={biayaLumpsum || ''} onChange={e => setBiayaLumpsum(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs" title="Lumpsum dibagi per yield" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Kalkulator Otomatis */}
                  <div className="bg-ink p-6 rounded-3xl text-white mt-8 shadow-xl">
                    <h4 className="text-sm uppercase tracking-widest font-medium mb-6 opacity-80 flex items-center gap-2"><Settings size={16} /> Kalkulator Profit</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-4">
                         <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                           <span className="opacity-70">Sistem Biaya Kain per Pcs</span>
                           <span>Rp {Math.round(costKainSatuan).toLocaleString('id-ID')}</span>
                         </div>
                         <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                           <span className="opacity-70">Biaya Jahit per Pcs</span>
                           <span>Rp {Math.round(costJahitSatuan).toLocaleString('id-ID')}</span>
                         </div>
                         <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                           <span className="opacity-70">Aksesoris & Packaging</span>
                           <span>Rp {Math.round(biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging).toLocaleString('id-ID')}</span>
                         </div>
                         <div className="flex justify-between pt-2 font-medium">
                           <span>Total HPP / Modal (Per Pcs)</span>
                           <span className="text-yellow-400">Rp {Math.round(totalCostSatuan).toLocaleString('id-ID')}</span>
                         </div>
                      </div>
                      
                      <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                        <label className="block text-xs uppercase tracking-widest opacity-80 mb-2">Harga Jual Yang Direncanakan (Rp)</label>
                        <input type="number" value={hargaJual || ''} onChange={e => setHargaJual(Number(e.target.value))} className="w-full bg-white/20 border-none rounded-xl py-3 px-4 text-white placeholder-white/40 outline-none focus:ring-2 ring-white/50 text-xl font-medium mb-6" placeholder="0" />
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Estimasi Profit (Bersih)</p>
                            <p className={`text-3xl font-light ${estimatedProfit > 0 ? 'text-green-400' : estimatedProfit < 0 ? 'text-red-400' : ''}`}>Rp {Math.round(estimatedProfit).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Margin</p>
                             <p className={`text-xl font-mono ${parseFloat(profitMargin) > 30 ? 'text-green-400' : 'text-yellow-400'}`}>{profitMargin}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 text-right border-t border-black/10">
                  <button type="button" className="px-10 py-4 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Simpan Produk
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
