import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, Calendar, FileText, ShoppingBag, ArrowUpRight, Award, Download, Phone, Save, ShieldCheck, ShieldX } from 'lucide-react';
import useSWR from 'swr';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';
import { useStore } from '../../store';
import {
  AbandonedCartTooltip,
  AovTooltip,
  BirthdayTooltip,
  CampaignTouchTooltip,
  CrmTooltip,
  D1Tooltip,
  ExplainedLabel,
  LtvTooltip,
  ReturnRateTooltip,
  WhatsAppVerificationTooltip,
} from '../term-tooltips';

export default function AdminCRMManager() {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [markPhoneVerified, setMarkPhoneVerified] = useState(true);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast } = useStore();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;

  const { data: dbUsers, error, isLoading, mutate } = useSWR(authReady ? '/api/admin/users' : null, fetcher);
  const { data: selectedOrders, isLoading: selectedOrdersLoading } = useSWR(
    authReady && selectedUser ? `/api/admin/users/${encodeURIComponent(selectedUser.id)}/orders` : null,
    fetcher
  );
  const CUSTOMERS = Array.isArray(dbUsers) ? dbUsers : [];
  const FILTERED_CUSTOMERS = CUSTOMERS.filter((customer: any) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [customer.name, customer.email, customer.phone_wa, customer.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const errorInfo = (error as any)?.info;
  const orders = Array.isArray(selectedOrders) ? selectedOrders : [];

  useEffect(() => {
    setPhoneInput(selectedUser?.phone_wa || '');
    setMarkPhoneVerified(!selectedUser?.phoneWaVerifiedAt);
  }, [selectedUser]);

  const refreshSelectedUser = async (fallback: any) => {
    const nextUsers = await mutate();
    const updatedUser = (Array.isArray(nextUsers) ? nextUsers : []).find((user: any) => user.id === selectedUser?.id);
    setSelectedUser(updatedUser || fallback);
  };

  const updatePhoneVerification = async (action: 'update_phone' | 'verify_phone' | 'clear_phone_verification') => {
    if (!selectedUser) return;
    setPhoneSaving(true);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_id: selectedUser.id,
          action,
          phone_wa: phoneInput,
          mark_verified: markPhoneVerified,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Gagal memperbarui verifikasi WhatsApp.');

      const optimisticUser = {
        ...selectedUser,
        phone_wa: payload.phone_wa ?? selectedUser.phone_wa,
        phoneWaVerifiedAt: payload.phone_wa_verified_at ?? (action === 'clear_phone_verification' ? null : selectedUser.phoneWaVerifiedAt),
      };
      setSelectedUser(optimisticUser);
      await refreshSelectedUser(optimisticUser);
      addToast(payload.clerk_sync?.warning || 'Status WhatsApp pelanggan diperbarui.', payload.clerk_sync?.warning ? 'info' : 'success');
    } catch (error: any) {
      addToast(error.message || 'Gagal memperbarui verifikasi WhatsApp.', 'error');
    } finally {
      setPhoneSaving(false);
    }
  };

  const exportCustomers = () => {
    const rows = [
      ['name', 'email', 'phone_wa', 'birth_date', 'status', 'orders', 'ltv', 'return_rate', 'last_active', 'last_source', 'last_device', 'last_campaign', 'abandoned_cart'],
      ...FILTERED_CUSTOMERS.map((customer: any) => [
        customer.name,
        customer.email,
        customer.phone_wa || '',
        customer.birthDate || '',
        customer.status,
        customer.orders || 0,
        customer.ltv || 0,
        customer.returnRate || '0%',
        customer.lastActive || '',
        customer.lastSource || '',
        customer.lastDevice || '',
        customer.lastCampaign || '',
        customer.abandonedCart ? 'yes' : 'no'
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `meyya-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (selectedUser) {
    const journey = [
      ...orders.slice(0, 6).map((order: any) => ({
        id: order.id,
        date: order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-',
        title: `Pesanan ${order.id} - ${order.status}`,
        type: 'purchase'
      })),
      {
        id: 'join',
        type: 'join',
        date: selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString('id-ID') : '-',
        title: 'Bergabung sebagai pelanggan'
      }
    ];

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
            <p className="text-sm text-black/50 flex items-center justify-center md:justify-start gap-2">
              <Calendar size={14} /> Tanggal lahir {selectedUser.birthDate ? new Date(selectedUser.birthDate).toLocaleDateString('id-ID') : '-'}
              {selectedUser.birthday?.daysUntil !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] uppercase tracking-widest">
                  {selectedUser.birthday.isToday ? 'Birthday hari ini' : `${selectedUser.birthday.daysUntil} hari lagi`}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addToast('Kupon personal belum tersedia. Gunakan tab Voucher untuk membuat promo umum.', 'info')} className="px-6 py-2 bg-white border border-black/10 rounded-full text-xs font-semibold hover:bg-black/5 transition-colors uppercase tracking-widest">
              Buat Kupon
            </button>
            <button onClick={() => window.location.href = `mailto:${selectedUser.email || ''}`} className="px-6 py-2 bg-ink text-white rounded-full text-xs font-semibold hover:bg-black/80 transition-colors uppercase tracking-widest">
              Kirim Email
            </button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">
              <ExplainedLabel tooltip={<LtvTooltip />}>Total LTV</ExplainedLabel>
            </p>
            <p className="text-2xl font-light">Rp {(selectedUser.ltv || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">
              <ExplainedLabel tooltip={<AovTooltip />}>Rata-Rata Order (AOV)</ExplainedLabel>
            </p>
            <p className="text-2xl font-light">Rp {(selectedUser.aov || 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Total Order</p>
            <p className="text-2xl font-light">{selectedUser.orders || 0}x</p>
          </div>
          <div className="bg-white/40 border border-black/5 p-4 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">
              <ExplainedLabel tooltip={<ReturnRateTooltip />}>Return Rate</ExplainedLabel>
            </p>
            <p className="text-2xl font-light">{selectedUser.returnRate || '0%'}</p>
            <p className="text-xs text-black/40 mt-1">{selectedUser.returnCount || 0} request</p>
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
                      <p className="font-medium">{selectedUser.voucherCount || 0} Kupon</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Barang Wishlist</p>
                      <p className="font-medium">{selectedUser.wishlistCount || 0} Produk</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">
                        <ExplainedLabel tooltip={<AbandonedCartTooltip />}>Keranjang Terakhir</ExplainedLabel>
                      </p>
                      <p className="font-medium">{selectedUser.lastCartAt ? new Date(selectedUser.lastCartAt).toLocaleString('id-ID') : '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">
                        <ExplainedLabel tooltip={<CampaignTouchTooltip />}>Campaign Touch</ExplainedLabel>
                      </p>
                      <p className="font-medium">{selectedUser.campaignTouchCount || 0}x</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Source Terakhir</p>
                      <p className="font-medium">{selectedUser.lastSource || '-'}</p>
                      <p className="text-[10px] text-black/40">{selectedUser.lastMedium || '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Device Terakhir</p>
                      <p className="font-medium">{selectedUser.lastDevice || '-'}</p>
                      <p className="text-[10px] text-black/40">{selectedUser.latestEvent?.eventType || '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Campaign Terakhir</p>
                      <p className="font-medium">{selectedUser.lastCampaign || '-'}</p>
                      <p className="text-[10px] text-black/40">{selectedUser.latestEvent?.pagePath || '-'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Search / Voucher</p>
                      <p className="font-medium">{selectedUser.searchCount || 0} search / {selectedUser.voucherApplyCount || 0} voucher</p>
                   </div>
                </div>
             </div>

            {/* Riwayat Pesanan */}
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
                    {selectedOrdersLoading && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-black/50 text-xs">Memuat riwayat pesanan...</td>
                      </tr>
                    )}
                    {!selectedOrdersLoading && orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                        <td className="py-4 font-mono text-xs">{order.id}</td>
                        <td className="py-4 font-light">{order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="py-4 font-medium">Rp {(order.total_paid || 0).toLocaleString('id-ID')}</td>
                        <td className="py-4"><span className="px-2 py-1 bg-black/5 rounded-full text-[10px] font-medium uppercase tracking-widest">{order.status}</span></td>
                      </tr>
                    ))}
                    {!selectedOrdersLoading && orders.length === 0 && (
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
            <div className="bg-white/40 border border-black/5 p-6 rounded-[2rem]">
              <h3 className="font-heading font-semibold uppercase tracking-widest text-xs mb-5 flex items-center gap-2">
                <Phone size={16} />
                <ExplainedLabel tooltip={<WhatsAppVerificationTooltip />}>Verifikasi WhatsApp</ExplainedLabel>
              </h3>
              <div className={`rounded-2xl border p-4 mb-4 ${selectedUser.phoneWaVerifiedAt ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
                  {selectedUser.phoneWaVerifiedAt ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                  {selectedUser.phoneWaVerifiedAt ? 'Nomor terverifikasi' : 'Belum terverifikasi'}
                </p>
                <p className="text-xs mt-1">
                  {selectedUser.phoneWaVerifiedAt ? new Date(selectedUser.phoneWaVerifiedAt).toLocaleString('id-ID') : 'Gunakan tombol manual jika GOWA/webhook sedang bermasalah.'}
                </p>
              </div>
              <label className="block text-[10px] uppercase tracking-widest text-black/45 font-bold mb-2">Nomor WhatsApp Pelanggan</label>
              <input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="62812..."
                className="w-full bg-white border border-black/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-ink"
              />
              <label className="mt-3 flex items-start gap-2 text-xs text-black/60">
                <input
                  type="checkbox"
                  checked={markPhoneVerified}
                  onChange={(event) => setMarkPhoneVerified(event.target.checked)}
                  className="mt-0.5"
                />
                Tandai nomor ini langsung verified setelah disimpan.
              </label>
              <div className="grid grid-cols-1 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => updatePhoneVerification('update_phone')}
                  disabled={phoneSaving}
                  className="w-full py-2.5 rounded-full bg-ink text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={13} /> Simpan Nomor
                </button>
                <button
                  type="button"
                  onClick={() => updatePhoneVerification('verify_phone')}
                  disabled={phoneSaving || !phoneInput}
                  className="w-full py-2.5 rounded-full bg-emerald-600 text-white text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={13} /> Verifikasi Manual
                </button>
                <button
                  type="button"
                  onClick={() => updatePhoneVerification('clear_phone_verification')}
                  disabled={phoneSaving}
                  className="w-full py-2.5 rounded-full bg-white border border-black/10 text-[10px] uppercase tracking-widest hover:bg-black/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldX size={13} /> Hapus Status Verified
                </button>
              </div>
            </div>

            {/* The Journey Timeline */}
            <div className="bg-white/40 border border-black/5 p-6 rounded-[2rem]">
              <h3 className="font-heading font-semibold uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Calendar size={16}/> Journey Timeline</h3>
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-[17px] before:top-10 before:bottom-2 before:w-[2px] before:bg-black/10">
                {journey.map((evt: any) => (
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
          <h2 className="text-2xl font-light mb-2">
            <ExplainedLabel tooltip={<CrmTooltip />}>Customer Relationship</ExplainedLabel>
          </h2>
          <p className="text-sm font-light text-black/60">Kelola dan pelajari habit pelanggan Anda untuk membuat keputusan yang lebih baik.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari email atau nama..." 
              className="w-full md:w-64 bg-white/50 border border-black/10 focus:border-black/50 rounded-full py-3 pl-12 pr-4 text-sm outline-none transition-colors"
            />
          </div>
          <button onClick={exportCustomers} className="px-6 py-3 bg-white border border-black/10 rounded-full text-xs font-semibold hover:bg-black/5 transition-colors uppercase tracking-widest flex items-center gap-2">
            <Download size={14} /> Ekspor
          </button>
        </div>
      </div>

      <div className="mb-4">
         {!authReady && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">⏳ Menunggu sesi admin...</span>}
         {authReady && isLoading && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">Sedang memuat data dari database D1 (users)...</span>}
         {authReady && error && <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">⚠️ Gagal terhubung ke database D1: {error.message}</span>}
         {authReady && !isLoading && !error && Array.isArray(dbUsers) && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Terhubung ke database D1 ({CUSTOMERS.length} pelanggan ditemukan)
            <D1Tooltip />
          </span>
         )}
      </div>

      {authReady && errorInfo && (
        <div className="bg-black text-green-300 rounded-2xl p-4 overflow-x-auto text-[11px] font-mono border border-black/20">
          <div className="text-white/60 mb-2">DEBUG /api/admin/users response body</div>
          <pre>{JSON.stringify(errorInfo, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white/40 border border-black/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-black/5">
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Nama Pelanggan</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Status</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60 text-right"><ExplainedLabel tooltip={<LtvTooltip />}>LTV</ExplainedLabel></th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60"><ExplainedLabel tooltip={<BirthdayTooltip />}>Signal</ExplainedLabel></th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60">Aktivitas Terakhir</th>
                <th className="font-semibold uppercase tracking-widest text-[10px] p-6 text-black/60"></th>
              </tr>
            </thead>
            <tbody>
              {FILTERED_CUSTOMERS.map((customer: any) => (
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
                    <p className="text-xs font-light text-black/50">{customer.orders || 0} pesanan</p>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1.5 max-w-48">
                      <span className="px-2 py-1 bg-black/5 rounded-full text-[10px] uppercase tracking-widest">Return {customer.returnRate || '0%'}</span>
                      {customer.abandonedCart && <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] uppercase tracking-widest">Abandoned {customer.cartSnapshot?.itemCount || 0} item</span>}
                      {customer.birthday?.daysUntil <= 30 && <span className="px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-[10px] uppercase tracking-widest">Birthday</span>}
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-light">{customer.lastActive ? new Date(customer.lastActive).toLocaleDateString() : '-'}</p>
                  </td>
                  <td className="p-6 text-right">
                    <ArrowUpRight size={18} className="text-black/30 group-hover:text-ink transition-colors inline-block" />
                  </td>
                </tr>
              ))}
              {authReady && FILTERED_CUSTOMERS.length === 0 && !isLoading && !error && (
                 <tr>
                   <td colSpan={6} className="p-8 text-center text-black/50">
                     <p className="mb-2">{CUSTOMERS.length === 0 ? 'Belum ada pelanggan ditemukan di database D1.' : 'Tidak ada pelanggan yang cocok dengan pencarian.'}</p>
                     {CUSTOMERS.length === 0 && <p className="text-xs max-w-sm mx-auto">Pastikan webhook Clerk (`/api/webhooks/clerk`) sudah dikonfigurasi di dashboard Clerk agar data user sinkron ke D1 secara otomatis saat pendaftaran.</p>}
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
