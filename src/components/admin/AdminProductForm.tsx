import React, { useState, useEffect } from 'react';
import { Upload, Settings, Plus, Check, Edit2, Package } from 'lucide-react';
import { useStore } from '../../store';
import useSWR from 'swr';
import { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminProductForm() {
  const { globalColors, addGlobalColor } = useStore();
  const { data: products, error } = useSWR('/api/products', fetcher);
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  
  const [productName, setProductName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [stock, setStock] = useState(0);
  const [weight, setWeight] = useState(250);
  
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
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl); // immediate preview
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          setImageUrl(data.url);
        }
      } catch (err) {
        console.error('Upload failed', err);
        alert('Gagal upload gambar');
      }
    }
  };
  
  // Custom Color State
  const [selectedColorNames, setSelectedColorNames] = useState<string[]>([]);
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Gift Box state
  const [allowGiftBox, setAllowGiftBox] = useState(false);
  const [giftBoxPrice, setGiftBoxPrice] = useState(0);

  const toggleColor = (name: string) => {
    setSelectedColorNames(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleAddNewColor = () => {
    if (newColorName.trim() && newColorHex) {
      addGlobalColor({ name: newColorName.trim(), hex: newColorHex });
      setSelectedColorNames(prev => [...prev, newColorName.trim()]);
      setNewColorName('');
      setNewColorHex('#000000');
      setShowAddColor(false);
    }
  };
  
  const handleEdit = (p: any) => {
    setIsEditing(p.id);
    setProductName(p.name);
    setSlug(p.slug || '');
    setDescription(p.description || '');
    setCategoryId(p.category_id || 1);
    setStock(p.stock || 0);
    setWeight(p.weight || 250);
    setHargaJual(p.base_price || 0);
    setImageUrl(p.image_url || null);
    
    // reset breakdown
    setHargaKainRoll(0);
    setYieldKain(1);
    setBiayaJahitTotal(0);
    setBiayaJahitSatuan(0);
    setBiayaLabel(0);
    setBiayaHangTag(0);
    setBiayaProduksiTambahan(0);
    setBiayaZipperBag(0);
    setBiayaKresek(0);
    setBiayaPackaging(0);
    setBiayaLumpsum(p.production_cost || 0);
    
    const colors = p.colors ? p.colors.map((c: any) => c.color_name) : [];
    setSelectedColorNames(colors);
    
    // Update global colors if some are missing from global
    if (p.colors) {
      for (const c of p.colors) {
        if (!globalColors.find(gc => gc.name === c.color_name)) {
          addGlobalColor({ name: c.color_name, hex: c.hex_code });
        }
      }
    }
  };

  // Breakdown Calculations
  const costKainSatuan = yieldKain > 0 ? (hargaKainRoll / yieldKain) : 0;
  const costJahitSatuan = biayaJahitTotal > 0 && yieldKain > 0 ? (biayaJahitTotal / yieldKain) : biayaJahitSatuan;
  const costLumpsumSatuan = biayaLumpsum > 0 && yieldKain > 0 ? (biayaLumpsum / yieldKain) : 0;
  
  const totalCostSatuan = costKainSatuan + costJahitSatuan + biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging + costLumpsumSatuan;
  
  const estimatedProfit = hargaJual - totalCostSatuan;
  const profitMargin = hargaJual > 0 ? ((estimatedProfit / hargaJual) * 100).toFixed(1) : '0.0';

  const resetForm = () => {
    setIsEditing(null);
    setProductName('');
    setSlug('');
    setDescription('');
    setHargaJual(0);
    setStock(0);
    setWeight(250);
    setBiayaLumpsum(0);
    setSelectedColorNames([]);
    setImageUrl(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: productName,
        slug: slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description,
        category_id: categoryId,
        stock,
        weight,
        base_price: hargaJual,
        production_cost: totalCostSatuan,
        image_url: imageUrl || '', 
        is_active: 1,
        colors: selectedColorNames.map(name => {
          const c = globalColors.find(gc => gc.name === name);
          return { color_name: name, hex_code: c?.hex || '#000000' }
        })
      };

      const url = isEditing ? `/api/products/${isEditing}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Gagal menyimpan produk');
      
      mutate('/api/products');
      resetForm();
      alert('Produk berhasil disimpan!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-light mb-8 font-heading text-ink flex items-center gap-2">
        <Package size={24} /> List Produk
      </h2>
      
      {/* Product List */}
      <div className="bg-white/40 border border-black/5 rounded-2xl p-4 mb-12 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-widest opacity-60">
              <th className="py-3 font-medium">Nama Produk</th>
              <th className="py-3 font-medium">Kategori</th>
              <th className="py-3 font-medium">Harga (Rp)</th>
              <th className="py-3 font-medium">Stock</th>
              <th className="py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: any) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="py-4 font-medium">{p.name}</td>
                <td className="py-4">{p.category_name}</td>
                <td className="py-4 font-mono">{p.base_price?.toLocaleString('id-ID')}</td>
                <td className="py-4 font-mono">
                  {p.stock} pcs
                  <br/><span className="text-[10px] text-gray-500 opacity-60">Upd: {p.last_stock_update ? new Date(p.last_stock_update).toLocaleDateString() : '-'}</span>
                </td>
                <td className="py-4">
                   <button onClick={() => handleEdit(p)} className="text-black/60 hover:text-ink flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-black/10 transition-colors">
                     <Edit2 size={14} /> Edit
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end mb-8 border-b border-black/10 pb-4">
        <h2 className="text-2xl font-light font-heading text-ink">
          {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        {isEditing && (
          <button onClick={resetForm} className="text-sm font-medium border border-black/10 bg-white/50 px-4 py-2 rounded-xl hover:bg-black/5">Batal Edit</button>
        )}
      </div>
      
      <form className="space-y-12">
        {/* 1. Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">1. Informasi Dasar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Foto Produk</label>
               
               {imageUrl ? (
                 <div className="relative border border-black/10 rounded-3xl overflow-hidden mb-4 group aspect-video md:aspect-[21/9]">
                   <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <label className="bg-white text-ink px-4 py-2 rounded-xl text-sm font-medium cursor-pointer shadow-lg hover:bg-black/5">
                        Ganti Foto
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                   </div>
                 </div>
               ) : (
                 <label className="border-2 border-dashed border-black/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/50 transition-colors">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Upload className="opacity-30 mb-4" size={32} />
                    <p className="text-sm font-medium">Klik untuk upload foto</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                 </label>
               )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Nama Produk</label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Mis: Pashmina Silk Premium" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Kategori Produk</label>
              <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm">
                <option value={1}>Pashmina</option>
                <option value={2}>Abaya</option>
                <option value={3}>Khimar</option>
                <option value={4}>Inner</option>
                <option value={5}>Aksesoris</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 flex items-center gap-1">Stok Fisik</label>
                <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} placeholder="0" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono" />
              </div>
              <div className="flex-1">
                 <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Berat / Gram</label>
                 <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} placeholder="250" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono" />
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <label className="block text-xs uppercase tracking-widest opacity-60">Warna Tersedia</label>
              <div className="flex flex-wrap gap-4 items-center">
                {globalColors.map((color) => {
                  const isSelected = selectedColorNames.includes(color.name);
                  return (
                    <div 
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all ${isSelected ? 'border-ink bg-black/5' : 'border-black/10 hover:border-black/30'}`}
                    >
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: color.hex }}></div>
                      <span className="text-xs">{color.name}</span>
                      {isSelected && <Check size={14} className="text-ink ml-1" />}
                    </div>
                  );
                })}
                
                <button 
                  type="button" 
                  onClick={() => setShowAddColor(!showAddColor)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-dashed border-black/30 text-xs hover:border-ink hover:text-ink transition-colors"
                >
                  <Plus size={14} /> Tambah Warna
                </button>
              </div>

              {showAddColor && (
                <div className="bg-white/60 p-4 rounded-2xl border border-black/5 flex gap-4 items-end max-w-lg mt-2 slide-down">
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase opacity-60 mb-1">Nama Warna</label>
                     <input type="text" value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Mis: Taro" className="w-full bg-white border border-black/10 rounded-lg py-2 px-3 text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] uppercase opacity-60 mb-1">Pilih Warna (Hex)</label>
                     <div className="flex items-center gap-2">
                       <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-9 h-9 p-0 border-0 rounded cursor-pointer" />
                       <span className="text-xs uppercase font-mono bg-white border border-black/10 rounded-lg py-2 px-3">{newColorHex}</span>
                     </div>
                   </div>
                   <button type="button" onClick={handleAddNewColor} className="bg-ink text-white px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-black/80 h-[38px]">
                     Simpan
                   </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Deskripsi Produk</label>
               <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 resize-none text-sm"></textarea>
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
                <input type="number" value={hargaKainRoll || ''} onChange={e => setHargaKainRoll(Number(e.target.value))} placeholder="Mis: 1500000" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Yield (Jml Produk per Roll)</label>
                <input type="number" value={yieldKain || ''} onChange={e => setYieldKain(Number(e.target.value))} placeholder="Mis: 30" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Biaya Jahit Satuan (Rp)</label>
                <input type="number" value={biayaJahitSatuan || ''} onChange={e => setBiayaJahitSatuan(Number(e.target.value))} placeholder="Isi ini jika jahit bayar per pcs" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Atau Biaya Jahit Borongan/Roll (Rp)</label>
                <input type="number" value={biayaJahitTotal || ''} onChange={e => setBiayaJahitTotal(Number(e.target.value))} placeholder="Isi ini bila borongan" className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-sm font-mono" />
              </div>
            </div>

            <h4 className="text-xs uppercase font-medium mt-4 pt-4 border-t border-black/5">Biaya Aksesoris & Packaging (Per Pcs)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Label</label>
                <input type="number" value={biayaLabel || ''} onChange={e => setBiayaLabel(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Hang Tag</label>
                <input type="number" value={biayaHangTag || ''} onChange={e => setBiayaHangTag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Zipper Bag</label>
                <input type="number" value={biayaZipperBag || ''} onChange={e => setBiayaZipperBag(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Kresek / Pouch</label>
                <input type="number" value={biayaKresek || ''} onChange={e => setBiayaKresek(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Ekstra Packaging</label>
                <input type="number" value={biayaPackaging || ''} onChange={e => setBiayaPackaging(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase opacity-60 mb-1">Lain-lain / Lumpsum</label>
                <input type="number" value={biayaLumpsum || ''} onChange={e => setBiayaLumpsum(Number(e.target.value))} placeholder="0" className="w-full bg-white border border-black/10 rounded-lg py-1 px-3 text-xs font-mono" title="Lumpsum dibagi per yield" />
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
                   <span className="font-mono">Rp {Math.round(costKainSatuan).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                   <span className="opacity-70">Biaya Jahit per Pcs</span>
                   <span className="font-mono">Rp {Math.round(costJahitSatuan).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/20 pb-2 text-sm">
                   <span className="opacity-70">Aksesoris & Packaging</span>
                   <span className="font-mono">Rp {Math.round(biayaLabel + biayaHangTag + biayaProduksiTambahan + biayaZipperBag + biayaKresek + biayaPackaging).toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex justify-between pt-2 font-medium">
                   <span>Total HPP / Modal (Per Pcs)</span>
                   <span className="text-yellow-400 font-mono">Rp {Math.round(totalCostSatuan).toLocaleString('id-ID')}</span>
                 </div>
              </div>
              
              <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                <label className="block text-xs uppercase tracking-widest opacity-80 mb-2">Harga Jual Yang Direncanakan (Rp)</label>
                <input type="number" value={hargaJual || ''} onChange={e => setHargaJual(Number(e.target.value))} className="w-full bg-white/20 border-none rounded-xl py-3 px-4 text-white placeholder-white/40 outline-none focus:ring-2 ring-white/50 text-xl font-medium mb-6 font-mono" placeholder="0" />
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Estimasi Profit (Bersih)</p>
                    <p className={`text-3xl font-light font-mono ${estimatedProfit > 0 ? 'text-green-400' : estimatedProfit < 0 ? 'text-red-400' : ''}`}>Rp {Math.round(estimatedProfit).toLocaleString('id-ID')}</p>
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
          <button type="button" onClick={handleSubmit} className="px-10 py-4 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            {isEditing ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
          </button>
        </div>
      </form>
    </div>
  );
}
