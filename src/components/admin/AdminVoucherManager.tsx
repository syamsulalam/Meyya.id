import React, { useState } from 'react';
import { Plus, Tag, Trash2, Edit2, Clock, Percent, DollarSign, CheckCircle2 } from 'lucide-react';

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
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: 'v1',
      code: 'WELCOME20',
      name: 'Diskon Pengguna Baru',
      type: 'PERCENTAGE',
      value: 20,
      minPurchase: 100000,
      maxDiscount: 50000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 0,
      usedCount: 145,
      isActive: true,
      targetUserRole: 'NEW_USER',
    },
    {
      id: 'v2',
      code: 'RAYASALE',
      name: 'Promo Hari Raya',
      type: 'FIXED',
      value: 100000,
      minPurchase: 500000,
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      usageLimit: 1000,
      usedCount: 890,
      isActive: true,
      targetUserRole: 'ALL',
    },
    {
      id: 'v3',
      code: 'GRATISONGKIR',
      name: 'Gratis Ongkir Seluruh Indo',
      type: 'FREE_SHIPPING',
      value: 0, // value not used for free shipping
      minPurchase: 250000,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      usageLimit: 500,
      usedCount: 500, // Reached limit
      isActive: false,
      targetUserRole: 'ALL',
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formVoucher, setFormVoucher] = useState<Partial<Voucher>>({
    type: 'PERCENTAGE',
    targetUserRole: 'ALL',
    isActive: true,
    minPurchase: 0,
    usageLimit: 0,
  });

  return (
    <div className="space-y-8 slide-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-light font-heading text-ink">Manajemen Voucher & Promo</h2>
          <p className="text-sm opacity-60 mt-1">Buat diskon dinamis untuk pelanggan Anda</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-ink text-white px-5 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={16} /> Buat Voucher Barru</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/60 p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm slide-down mb-8">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2"><Tag size={20} /> Form Pembuatan Voucher</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Nama Promosi (Internal)</label>
              <input type="text" placeholder="Misal: Flash Sale Ramadhan" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Kode Voucher (Publik)</label>
              <input type="text" placeholder="Misal: RAMADHAN50" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink uppercase font-mono" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Tipe Diskon</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] as const).map(type => (
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
                    <input 
                      type="number" 
                      placeholder={formVoucher.type === 'PERCENTAGE' ? "Misal: 20" : "Misal: 50000"} 
                      className={`w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink ${formVoucher.type === 'FIXED' ? 'pl-10' : ''}`} 
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
                    <input type="number" placeholder="Misal: 50000" className="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink" />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika tidak ada batas maksimal</p>
              </div>
            )}

            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Minimal Belanja (Opsional)</label>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>
                  <input type="number" placeholder="Misal: 100000" className="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tanggal Mulai</label>
                <input type="date" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tgl Kadaluarsa</label>
                <input type="date" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
              </div>
            </div>
            
            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Batas Penggunaan (Kuota)</label>
               <input type="number" placeholder="Misal: 100 (Kosong/0 = Tanpa Batas)" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Target Pengguna</label>
              <select className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink">
                <option value="ALL">Semua Pengguna</option>
                <option value="NEW_USER">Pengguna Baru / Belum Pernah Belanja</option>
                <option value="VIP">Pengguna VIP / Pelanggan Setia</option>
              </select>
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <button className="bg-ink text-white px-8 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m">
              Simpan Voucher
            </button>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="bg-white/40 p-6 md:p-8 rounded-[2rem] border border-black/5">
        <h3 className="text-lg font-medium mb-6 font-heading">Daftar Voucher Aktif & Riwayat</h3>
        
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
              {vouchers.map(v => (
                <tr key={v.id} className="border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors group">
                  <td className="py-4 pr-4">
                    <div className="font-mono font-semibold text-ink/90">{v.code}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{v.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    {v.type === 'PERCENTAGE' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-medium">{v.value}% OFF</span>}
                    {v.type === 'FIXED' && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-medium">Rp {(v.value / 1000).toFixed(0)}K OFF</span>}
                    {v.type === 'FREE_SHIPPING' && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded font-medium">GRATIS ONGKIR</span>}
                    
                    {v.maxDiscount && v.type === 'PERCENTAGE' && (
                      <div className="text-[10px] text-gray-400 mt-1">Maks Rp {(v.maxDiscount/1000)}k</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {v.minPurchase > 0 ? `Rp ${(v.minPurchase / 1000).toFixed(0)}k` : 'Rp 0'}
                  </td>
                  <td className="py-4 px-4">
                     <div className="text-xs text-gray-600">{new Date(v.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</div>
                     <div className="text-[10px] text-gray-400">s/d</div>
                     <div className="text-xs text-ink font-medium">{new Date(v.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</div>
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
                      <button className="p-2 hover:bg-black/10 rounded-full transition-colors" title="Edit">
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Hapus">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
