import React, { useState } from 'react';
import { Search, ChevronLeft, Calendar, FileText, ShoppingBag, ArrowUpRight, Copy, Award, MapPin } from 'lucide-react';
import useSWR from 'swr';
import { useAuthFetcher } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';

const MOCK_JOURNEY = [
  { id: 1, date: '12 Juni 2026', title: 'Menggunakan voucher PAYDAY50', type: 'voucher' },
  { id: 2, date: '11 Mei 2026', title: 'Membeli Baju X (Ukuran M)', type: 'purchase' },
  { id: 3, date: '10 Mei 2026', title: 'Mendaftar', type: 'join' },
];

const MOCK_ORDERS = [
  { id: 'ORD-1001', date: '11 Mei 2026', items: 2, total: 350000, status: 'DELIVERED' },
  { id: 'ORD-0994', date: '22 Apr 2026', items: 1, total: 175000, status: 'DELIVERED' },
];

export default function AdminCRMManager() {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const fetcher = useAuthFetcher();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;

  const { data: dbUsers, error, isLoading } = useSWR(authReady ? '/api/admin/users' : null, fetcher);
  const CUSTOMERS = Array.isArray(dbUsers) ? dbUsers : [];

  if (selectedUser) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-black/50 hover:text-ink transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke Daftar Pelanggan
        </button>

        {/* Header Profile */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-black/10 pb-8">
          <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-light">
            {selectedUser.name ? selectedUser.name.charAt(0) : '?'}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl font-light">{selectedUser.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${selectedUser.status === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {selectedUser.status || 'Regular'}
              </span>
            </div>
            <p className="text-black/60 font-medium flex items-center justify-center md:justify-start gap-2">
              <FileText size={14} /> {selectedUser.email}
            </p>
            <p className="text-sm text-black/50 flex items-center justify-center md:justify-start gap-2">
              <Calendar size={14} /> Bergabung sejak {selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : '-'} • Aktif {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-2 bg-white border border-black/10 rounded-full text-xs font-semibold hover:bg-black/5 transition-colors uppercase tracking-widest">
              Buat Kupon
            </button>
            <button className="px-6 py-2 bg-ink text-white rounded-full text-xs font-semibold hover:bg-black/80 transition-colors uppercase tracking-widest">
              Kirim Email
            </button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Total LTV</p>
            <p className="text-2xl font-light">Rp {(selectedUser.ltv || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Rata-Rata Order (AOV)</p>
            <p className="text-2xl font-light">Rp {(selectedUser.aov || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Total Order</p>
            <p className="text-2xl font-light">{selectedUser.orders || 0}x</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Return Rate</p>
            <p className="text-2xl font-light">{selectedUser.returnRate || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Kebiasaan & Afinitas */}
             <div className="bg-white/40 border border-black/5 p-6 rounded-[2rem]">
                <h3 className="font-heading font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Award size={16}/> Profil Belanja</h3>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Ukuran Dominan</p>
                      <p className="font-medium">{selectedUser.size || '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Hari Favorit Checkout</p>
                      <p className="font-medium">{selectedUser.favoriteDay || '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Voucher Digunakan</p>
                      <p className="font-medium">0 Kupon</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Barang Wishlist</p>
                      <p className="font-medium">0 Produk</p>
                   </div>
                </div>
             </div>

            {/* Riwayat Order */}
            <div className="bg-white/40 border border-black/5 p-6 rounded-[2rem]">
              <h3 className="font-heading font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><ShoppingBag size={16}/> Riwayat Transaksi Terbaru</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="font-normal text-black/50 uppercase tracking-widest text-[10px] pb-4">ID Pesanan</th>
                      <th className="font-normal text-black/50 uppercase tracking-widest text-[10px] pb-4">Tanggal</th>
                      <th className="font-normal text-black/50 uppercase tracking-widest text-[10px] pb-4">Total</th>
                      <th className="font-normal text-black/50 uppercase tracking-widest text-[10px] pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUser.orders > 0 ? MOCK_ORDERS : []).map((order) => (
                      <tr key={order.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                        <td className="py-4 font-mono text-xs">{order.id}</td>
                        <td className="py-4 font-light">{order.date}</td>
                        <td className="py-4 font-medium">Rp {order.total.toLocaleString('id-ID')}</td>
                        <td className="py-4"><span className="px-2 py-1 bg-black/5 rounded-full text-[10px] font-medium uppercase tracking-widest">{order.status}</span></td>
                      </tr>
                    ))}
                    {(!selectedUser.orders || selectedUser.orders === 0) && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-black/50 text-xs">Belum ada riwayat pesanan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* The Journey Timeline */}
            <div className="bg-white/40 border border-black/5 p-6 rounded-[2rem]">
              <h3 className="font-heading font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Calendar size={16}/> Journey Timeline</h3>
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-[17px] before:top-10 before:bottom-2 before:w-[2px] before:bg-black/10">
                {(selectedUser.orders > 0 ? MOCK_JOURNEY : [{ id: 'join', type: 'join', date: selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'Hari ini', title: 'Mendaftar' }]).map((evt: any) => (
                  <div key={evt.id} className="flex gap-4 relative z-10">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-4 border-[#fdfcfb] ${evt.type === 'purchase' ? 'bg-ink text-white' : 'bg-black/10 text-ink'}`}>
                      {evt.type === 'purchase' && <ShoppingBag size={14} />}
                      {evt.type === 'voucher' && <Tag size={14} />}
                      {evt.type === 'join' && <User size={14} />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">{evt.date}</p>
                      <p className="text-sm font-medium">{evt.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Customer Relationship</h2>
          <p className="text-sm font-light text-black/60">Kelola dan pelajari habit pelanggan Anda untuk membuat keputusan yang lebih baik.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={16} />
            <input 
              type="text" 
              placeholder="Cari email atau nama..." 
              className="w-full md:w-64 bg-white/50 border border-black/10 focus:border-black/50 rounded-full py-3 pl-12 pr-4 text-sm outline-none transition-colors"
            />
          </div>
          <button className="px-6 py-3 bg-white border border-black/10 rounded-full text-xs font-semibold hover:bg-black/5 transition-colors uppercase tracking-widest">
            Export
          </button>
        </div>
      </div>

      <div className="mb-4">
         {!authReady && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">⏳ Menunggu sesi admin...</span>}
         {authReady && isLoading && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">⏳ Sedang memuat data dari database D1 (users)...</span>}
         {authReady && error && <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">⚠️ Gagal terhubung ke database D1: {error.message}</span>}
         {authReady && !isLoading && !error && Array.isArray(dbUsers) && <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">✅ Terhubung ke database D1 ({CUSTOMERS.length} pelanggan ditemukan)</span>}
      </div>

      <div className="bg-white/40 border border-black/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-black/5">
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Nama Pelanggan</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Status</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60 text-right">LTV</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Aktivitas Terakhir</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60"></th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map((customer: any) => (
                <tr key={customer.id} className="border-b border-black/5 hover:bg-black/5 transition-colors cursor-pointer group" onClick={() => setSelectedUser(customer)}>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center font-medium">
                        {customer.name ? customer.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-medium group-hover:underline underline-offset-4">{customer.name}</p>
                        <p className="text-xs font-light text-black/50">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${customer.status === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {customer.status || 'Regular'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <p className="font-medium">Rp {(customer.ltv || 0).toLocaleString('id-ID')}</p>
                    <p className="text-xs font-light text-black/50">{customer.orders || 0} Orders</p>
                  </td>
                  <td className="p-6">
                    <p className="font-light">{customer.lastActive ? new Date(customer.lastActive).toLocaleDateString() : '-'}</p>
                  </td>
                  <td className="p-6 text-right">
                    <ArrowUpRight size={18} className="text-black/30 group-hover:text-ink transition-colors inline-block" />
                  </td>
                </tr>
              ))}
              {authReady && CUSTOMERS.length === 0 && !isLoading && !error && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-black/50">
                     <p className="mb-2">Belum ada pelanggan ditemukan di database D1.</p>
                     <p className="text-xs max-w-sm mx-auto">Pastikan webhook Clerk (`/api/webhooks/clerk`) sudah dikonfigurasi di dashboard Clerk agar data user sinkron ke D1 secara otomatis saat pendaftaran.</p>
                     <p className="text-[10px] mt-4 opacity-50 font-mono">DEBUG: users table is empty</p>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Additional icons needed for the component
function Tag(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
}
function User(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
