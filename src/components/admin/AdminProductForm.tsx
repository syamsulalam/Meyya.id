import { useState } from 'react';
import { Upload, Settings } from 'lucide-react';

export default function AdminProductForm() {
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

  return (
    <div>
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
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 flex justify-between">
                <span>Kategori Produk</span>
                <span className="text-[10px] text-gray-400">Diatur dari panel Kategori</span>
              </label>
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
  );
}
