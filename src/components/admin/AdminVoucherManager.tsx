import React, { useState } from 'react';
import { Plus, Tag, Trash2, Edit2, Clock, Percent, DollarSign, CheckCircle2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useStore } from '../../store';
import { useAuthFetcher, useAuthFetch } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';

type VoucherType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';

interface Voucher {
  id: string;
  code: string;
  name: string;
  type: VoucherType;
  value: number; // Percentage or IDR amount
  minPurchase: number;
  maxDiscount?: number; // Only for percentage
  startDate: string;
  endDate: string;
  usageLimit: number; // 0 = unlimited
  usedCount: number;
  isActive: boolean;
  targetUserRole: 'ALL' | 'NEW_USER' | 'VIP'; // Simple targeting
}

export default function AdminVoucherManager() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;
  const { data: dbVouchers, error, isLoading } = useSWR(authReady ? '/api/admin/vouchers' : null, fetcher);
  const vouchers = Array.isArray(dbVouchers) ? dbVouchers : [];
  const { addToast } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formVoucher, setFormVoucher] = useState<Partial<Voucher>>({
    type: 'PERCENTAGE',
    targetUserRole: 'ALL',
    isActive: true,
    minPurchase: 0,
    usageLimit: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  const handleEdit = (v: any) => {
    setFormVoucher({
      ...v,
      startDate: v.startDate.split('T')[0],
      endDate: v.endDate.split('T')[0],
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const NumberInput = ({ value, onChange, placeholder, prefixClassName }: any) => {
    const displayValue = value ? value.toLocaleString('id-ID') : '';
    return (
      <input 
        type="text" 
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '');
          onChange(raw ? parseInt(raw, 10) : 0);
        }}
        placeholder={placeholder}
        className={prefixClassName || "w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink"}
      />
    );
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formVoucher.code) return addToast("Kode voucher harus diisi", "error");
    setLoading(true);
    try {
      const payload = {
        code: formVoucher.code.toUpperCase(),
        discount_type: formVoucher.type,
        discount_value: formVoucher.value || 0,
        min_purchase: formVoucher.minPurchase || 0,
        max_discount: formVoucher.maxDiscount || null,
        valid_from: formVoucher.startDate,
        valid_until: formVoucher.endDate,
        usage_limit: formVoucher.usageLimit || 0,
        target_user_role: formVoucher.targetUserRole || 'ALL'
      };

      const res = await authFetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
         const txt = await res.text();
         throw new Error(txt);
      }
      
      mutate('/api/admin/vouchers');
      setShowForm(false);
      setFormVoucher({
        type: 'PERCENTAGE',
        targetUserRole: 'ALL',
        isActive: true,
        minPurchase: 0,
        usageLimit: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
      addToast('Voucher berhasil ditambahkan!', 'success');
    } catch (e: any) {
      addToast("Error: " + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Hapus voucher ' + code + '?')) return;
    try {
      const res = await authFetch(`/api/admin/vouchers/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      mutate('/api/admin/vouchers');
      addToast('Voucher berhasil dihapus!', 'success');
    } catch (e: any) {
      addToast("Error: " + e.message, 'error');
    }
  };

  return (
    <div className="space-y-8 slide-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-light font-heading text-ink">Manajemen Voucher & Promo</h2>
          <p className="text-sm opacity-60 mt-1">Buat diskon dinamis untuk pelanggan Anda</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setIsEditing(false);
            if(showForm) {
              setFormVoucher({
                type: 'PERCENTAGE', targetUserRole: 'ALL', isActive: true,
                minPurchase: 0, usageLimit: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              });
            }
          }}
          className="bg-ink text-white px-5 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={16} /> Buat Voucher Baru</>}
        </button>
      </div>

      {!authReady && <div className="text-sm px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-200">Menunggu sesi admin...</div>}
      {authReady && isLoading && <div className="text-sm px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-200">Sedang memuat data dari database D1...</div>}
      {authReady && error && <div className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200">Debug (D1 Error): Gagal memuat data. {error.message}</div>}

      {showForm && (
        <div className="bg-white/60 p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm slide-down mb-8">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2"><Tag size={20} /> Form Pembuatan Voucher</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Nama Promosi (Opsional)</label>
              <input type="text" value={formVoucher.name || ''} onChange={e => setFormVoucher({...formVoucher, name: e.target.value})} placeholder="Misal: Flash Sale Ramadhan" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Kode Voucher (Publik)</label>
              <input type="text" disabled={isEditing} value={formVoucher.code || ''} onChange={e => setFormVoucher({...formVoucher, code: e.target.value.toUpperCase()})} placeholder="Misal: RAMADHAN50" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink uppercase font-mono disabled:opacity-50 disabled:bg-black/5" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Tipe Diskon</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] as VoucherType[]).map(type => (
                  <button 
                    key={type}
                    onClick={() => setFormVoucher({...formVoucher, type})}
                    className={`py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                      formVoucher.type === type ? 'border-ink bg-black/5 text-ink' : 'border-black/10 hover:border-black/30 text-black/60'
                    }`}
                  >
                    {type === 'PERCENTAGE' && <Percent size={14}/>}
                    {type === 'FIXED' && <DollarSign size={14}/>}
                    {type === 'FREE_SHIPPING' && <Tag size={14}/>}
                    {type === 'PERCENTAGE' ? 'Persen (%)' : type === 'FIXED' ? 'Nominal (Rp)' : 'Ongkir'}
                  </button>
                ))}
              </div>
            </div>

            {formVoucher.type !== 'FREE_SHIPPING' && (
              <div>
                 <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Nilai Diskon</label>
                 <div className="relative">
                    {formVoucher.type === 'FIXED' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>}
                    <NumberInput 
                      value={formVoucher.value}
                      onChange={(val: number) => setFormVoucher({...formVoucher, value: val})}
                      placeholder={formVoucher.type === 'PERCENTAGE' ? "Misal: 20" : "Misal: 50.000"}
                      prefixClassName={`w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink ${formVoucher.type === 'FIXED' ? 'pl-10' : ''}`}
                    />
                    {formVoucher.type === 'PERCENTAGE' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-50">%</span>}
                 </div>
              </div>
            )}
            
            {formVoucher.type === 'PERCENTAGE' && (
              <div>
                 <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Maksimal Diskon (Opsional)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>
                    <NumberInput 
                      value={formVoucher.maxDiscount}
                      onChange={(val: number) => setFormVoucher({...formVoucher, maxDiscount: val})}
                      placeholder="Misal: 50.000"
                      prefixClassName="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink"
                    />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika tidak ada batas maksimal</p>
              </div>
            )}

            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Minimal Belanja (Opsional)</label>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>
                  <NumberInput 
                     value={formVoucher.minPurchase}
                     onChange={(val: number) => setFormVoucher({...formVoucher, minPurchase: val})}
                     placeholder="Misal: 100.000"
                     prefixClassName="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tanggal Mulai</label>
                <input type="date" value={formVoucher.startDate || ''} onChange={e => setFormVoucher({...formVoucher, startDate: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tgl Kadaluarsa</label>
                <input type="date" value={formVoucher.endDate || ''} onChange={e => setFormVoucher({...formVoucher, endDate: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
              </div>
            </div>
            
            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Batas Penggunaan (Kuota)</label>
               <NumberInput 
                  value={formVoucher.usageLimit}
                  onChange={(val: number) => setFormVoucher({...formVoucher, usageLimit: val})}
                  placeholder="Misal: 100 (Kosong/0 = Tanpa Batas)"
               />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Target Pengguna</label>
              <select value={formVoucher.targetUserRole || 'ALL'} onChange={e => setFormVoucher({...formVoucher, targetUserRole: e.target.value as any})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink">
                <option value="ALL">Semua Pengguna</option>
                <option value="NEW_USER">Pengguna Baru / Belum Pernah Belanja</option>
                <option value="VIP">Pengguna VIP / Pelanggan Setia</option>
              </select>
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-2">
            {isEditing && (
               <button type="button" onClick={() => setShowForm(false)} className="bg-black/5 text-ink px-8 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/10 transition-colors shadow-m">
                 Batal Edit
               </button>
            )}
            <button disabled={loading} onClick={handleSubmit} className="bg-ink text-white px-8 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m disabled:opacity-50">
              {loading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Voucher')}
            </button>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="bg-white/40 p-6 md:p-8 rounded-[2rem] border border-black/5">
        <h3 className="text-lg font-medium mb-6 font-heading">Daftar Voucher Aktif & Riwayat</h3>
        
        {vouchers.length === 0 && !isLoading && (
          <div className="text-center py-12 text-black/50">
             <Tag size={48} className="mx-auto mb-4 opacity-30" />
             <p className="mb-2">Belum ada promo voucher di sistem D1 Anda.</p>
             <p className="text-sm opacity-80">Klik tombol "Buat Voucher Baru" di atas untuk menambahkan promo pertama Anda.</p>
          </div>
        )}

        {vouchers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-widest opacity-50">
                <th className="font-medium pb-4 pr-4">Kode</th>
                <th className="font-medium pb-4 px-4">Tipe Diskon</th>
                <th className="font-medium pb-4 px-4">Min. Belanja</th>
                <th className="font-medium pb-4 px-4">Masa Berlaku</th>
                <th className="font-medium pb-4 px-4">Pemakaian</th>
                <th className="font-medium pb-4 px-4">Status</th>
                <th className="font-medium pb-4 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v: any) => (
                <tr key={v.id} className="border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors group">
                  <td className="py-4 pr-4">
                    <div className="font-mono font-semibold text-ink/90">{v.code}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{v.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    {v.type === 'PERCENTAGE' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-medium">{v.value}% OFF</span>}
                    {v.type === 'FIXED' && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-medium">Rp {(v.value / 1000).toFixed(0)}K OFF</span>}
                    {v.type === 'FREE_SHIPPING' && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded font-medium">GRATIS ONGKIR</span>}
                    
                    {v.maxDiscount > 0 && v.type === 'PERCENTAGE' && (
                      <div className="text-[10px] text-gray-400 mt-1">Maks Rp {(v.maxDiscount/1000)}k</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {v.minPurchase > 0 ? `Rp ${(v.minPurchase / 1000).toFixed(0)}k` : 'Rp 0'}
                  </td>
                  <td className="py-4 px-4">
                     <div className="text-xs text-gray-600">{v.startDate ? new Date(v.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}</div>
                     <div className="text-[10px] text-gray-400">s/d</div>
                     <div className="text-xs text-ink font-medium">{v.endDate ? new Date(v.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'}</div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`font-semibold ${v.usageLimit > 0 && v.usedCount >= v.usageLimit ? 'text-red-500' : 'text-emerald-600'}`}>{v.usedCount}</span>
                    <span className="text-gray-400 text-xs"> / {v.usageLimit === 0 ? '∞' : v.usageLimit}</span>
                  </td>
                  <td className="py-4 px-4">
                    {v.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(v)} className="p-2 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                        <Edit2 size={16} className="text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(v.code)} className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Hapus">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
