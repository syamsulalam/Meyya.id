import React, { useState, useEffect } from 'react';
import { Upload, Settings, Plus, Check, Edit2, Package, X } from 'lucide-react';
import { useStore } from '../../store';
import useSWR from 'swr';
import { mutate } from 'swr';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    let err;
    try {
      err = JSON.parse(text);
      throw new Error(err.error || JSON.stringify(err));
    } catch (e: any) {
      if (e.message.includes('Unexpected token') || e instanceof SyntaxError) {
        throw new Error(`HTTP ${r.status}: ${text}`);
      }
      throw e;
    }
  }
  const data = await r.json();
  if (data && !Array.isArray(data)) {
    if (data.products && Array.isArray(data.products)) return data.products;
    if (data.categories && Array.isArray(data.categories)) return data.categories;
    if (data.orders && Array.isArray(data.orders)) return data.orders;
  }
  return data;
};

export default function AdminProductForm() {
  const { globalColors, addGlobalColor } = useStore();
  const { data: products, error, isLoading } = useSWR('/api/products', fetcher);
  const { data: dbCategories } = useSWR('/api/categories', fetcher);
  const categories = Array.isArray(dbCategories) ? dbCategories : [];
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formStep, setFormStep] = useState<'list' | 'select-category' | 'form'>('list');
  
  const [productName, setProductName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [isPreorder, setIsPreorder] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['All Size']);
  const AVAILABLE_SIZES = ['All Size', 'S', 'M', 'L', 'XL', 'XXL', 'Standard', 'Jumbo'];
  const [stock, setStock] = useState(0);
  const [weight, setWeight] = useState(250);
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({});
  
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
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImg, setNewCatImg] = useState('');

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
    setFormStep('form');
    setProductName(p.name);
    setSlug(p.slug || '');
    setDescription(p.description || '');
    setCategoryId(p.category_id || 1);
    setIsPreorder(p.is_preorder === 1);
    setStock(p.stock || 0);

    // update sizes
    const sizes = Array.isArray(p.sizes) ? p.sizes.map((s: any) => s.size_name || s) : ['All Size'];
    setSelectedSizes(sizes);
    setWeight(p.weight || 250);
    setHargaJual(p.base_price || 0);
    setImageUrl(p.image_url || null);
    
    // attributes mapping
    const attrs: Record<string, string> = {};
    if (Array.isArray(p.attributes)) {
       for (const a of p.attributes) {
          attrs[a.attribute_name] = a.attribute_value;
       }
    }
    setCustomAttributes(attrs);
    
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
    
    const colors = Array.isArray(p.colors) ? p.colors.map((c: any) => c.color_name) : [];
    setSelectedColorNames(colors);
    
    // Update global colors if some are missing from global
    if (Array.isArray(p.colors)) {
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
    setFormStep('list');
    setProductName('');
    setSlug('');
    setDescription('');
    setHargaJual(0);
    setStock(0);
    setWeight(250);
    setBiayaLumpsum(0);
    setSelectedColorNames([]);
    setIsPreorder(false);
    setSelectedSizes(['All Size']);
    setImageUrl(null);
    setCustomAttributes({});
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatSlug) return alert('Nama dan slug harus diisi');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug, image_url: newCatImg })
      });
      if (!res.ok) throw new Error('Gagal tambah kategori');
      const data = await res.json();
      mutate('/api/categories');
      setCategoryId(data.id);
      setShowAddCategory(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatImg('');
    } catch (e: any) {
      alert(e.message);
    }
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
        is_preorder: isPreorder ? 1 : 0,
        sizes: selectedSizes,
        attributes: Object.keys(customAttributes).map(k => ({
           attribute_name: k,
           attribute_value: customAttributes[k]
        })),
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
        <div className="mb-4">
           {isLoading && <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">⏳ Sedang memuat data dari database (D1)...</span>}
           {error && <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">⚠️ Gagal terhubung ke database: {error.message}</span>}
           {products && <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">✅ Terhubung ke database D1 ({products.length} produk ditemukan)</span>}
        </div>
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
            {(Array.isArray(products) ? products : [])?.map((p: any) => (
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

      <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => !isEditing && setFormStep(formStep === 'list' ? 'select-category' : 'list')}>
        <h2 className="text-2xl font-light font-heading text-ink">
          {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        <div>
          {isEditing ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); resetForm(); }} className="text-sm font-medium border border-black/10 bg-white/50 px-4 py-2 rounded-xl hover:bg-black/5">Batal Edit</button>
          ) : (
            <button type="button" onClick={(e) => { e.stopPropagation(); setFormStep(formStep === 'list' ? 'select-category' : 'list'); }} className="inline-flex flex-shrink-0 items-center justify-center gap-2 bg-ink text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-black/80 transition-colors">
              {formStep !== 'list' ? <><X size={16} /> Tutup Form</> : <><Plus size={16} /> Tambah Produk</>}
            </button>
          )}
        </div>
      </div>
      
      {formStep === 'select-category' && !isEditing && (
        <div className="bg-white/40 border border-black/5 rounded-3xl p-8 slide-down text-center mb-12">
           <h3 className="text-xl font-heading mb-2">Pilih Kategori Produk</h3>
           <p className="text-sm opacity-60 mb-8 max-w-lg mx-auto">Silakan pilih kategori produk terlebih dahulu. Atribut yang ditanyakan di form selanjutnya akan menyesuaikan dengan kategori yang dipilih.</p>
           
           {categories.length === 0 ? (
             <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl">
               <p className="mb-2">Anda belum memiliki kategori produk.</p>
               <p className="text-sm opacity-80">Silakan tambahkan kategori terlebih dahulu melalui menu Manajemen Kategori di atas.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {categories.map((c: any) => (
                 <button key={c.id} onClick={() => { setCategoryId(c.id); setFormStep('form'); }} className="bg-white border border-black/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-ink hover:shadow-md transition-all group">
                   <div className="w-16 h-16 rounded-full overflow-hidden border border-black/5 group-hover:scale-105 transition-transform duration-300">
                     <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                   </div>
                   <span className="text-sm font-medium">{c.name}</span>
                 </button>
               ))}
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-black/5 border border-black/10 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-black/10 transition-all text-ink">
                 <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-black/5 shadow-sm">
                   <Plus size={24} />
                 </div>
                 <span className="text-sm font-medium">Tambah Kategori Lainnya di Atas</span>
               </button>
             </div>
           )}
        </div>
      )}
      
      {formStep === 'form' && (() => {
        const currentCat = categories.find((c: any) => c.id === categoryId);
        const hasSizes = currentCat?.has_sizes === 1;
        const hasColors = currentCat?.has_colors === 1;
        
        let catAttrs: any[] = [];
        if (currentCat && Array.isArray(currentCat.attributes)) {
           catAttrs = currentCat.attributes.map((a: any) => ({
             name: a.name,
             options: typeof a.options === 'string' ? JSON.parse(a.options) : (Array.isArray(a.options) ? a.options : [])
           }));
        }

        return (
        <form className="space-y-12 slide-down">
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
            <div className="bg-white/40 p-4 rounded-xl border border-black/5">
              <label className="block text-xs uppercase tracking-widest opacity-60 mb-3">Terhubung Ke Kategori Produk</label>
              <div className="flex items-center gap-3 bg-white p-3 border border-black/10 rounded-xl">
                {currentCat?.image_url && <img src={currentCat.image_url} alt={currentCat.name} className="w-10 h-10 object-cover rounded-full bg-black/5" />}
                <div>
                  <div className="text-sm font-medium">{currentCat?.name || '-'}</div>
                  <div className="text-[10px] uppercase opacity-50">Menentukan input atribut form di bawah</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-widest opacity-60 flex items-center gap-1">Stok Fisik</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPreorder} onChange={e => setIsPreorder(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                    <span className="text-[10px] uppercase font-bold text-ink/70">Sistem Pre-order</span>
                  </label>
                </div>
                <input type="number" disabled={isPreorder} value={isPreorder ? 0 : stock} onChange={e => setStock(Number(e.target.value))} placeholder="0" className={`w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono ${isPreorder ? 'opacity-50 cursor-not-allowed' : ''}`} />
                {isPreorder && <p className="text-[10px] opacity-50 mt-1">Stok tidak dibatasi untuk pre-order</p>}
              </div>
              <div className="flex-1">
                 <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Berat / Gram</label>
                 <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} placeholder="250" className="w-full bg-white/50 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm font-mono" />
              </div>
            </div>

            {catAttrs.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-widest opacity-60">Atribut Spesifikasi Khusus ({currentCat?.name})</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {catAttrs.map((attr, idx) => (
                      <div key={idx} className="bg-white/40 border border-black/10 rounded-xl p-4">
                         <label className="block text-[10px] uppercase font-semibold mb-2">{attr.name}</label>
                         <select 
                            value={customAttributes[attr.name] || ''}
                            onChange={e => setCustomAttributes({...customAttributes, [attr.name]: e.target.value})}
                            className="w-full bg-white border border-black/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-ink"
                         >
                           <option value="">-- Pilih {attr.name} --</option>
                           {attr.options.map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                           ))}
                         </select>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-widest opacity-60">Ukuran Tersedia (Size)</label>
                <div className="flex flex-wrap gap-2">
                   {AVAILABLE_SIZES.map(s => {
                      const isSelected = selectedSizes.includes(s);
                      return (
                        <button type="button" key={s} onClick={() => {
                          if (isSelected) setSelectedSizes(selectedSizes.filter(x => x !== s));
                          else setSelectedSizes([...selectedSizes, s]);
                        }} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isSelected ? 'border-ink bg-ink text-white shadow-md' : 'border-black/10 hover:border-black/30 bg-white/50'}`}>
                          {s}
                        </button>
                      )
                   })}
                </div>
              </div>
            )}
            
            {hasColors && (
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
            )}

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

        <div className="pt-8 text-right border-t border-black/10 flex justify-between">
          <button type="button" onClick={() => setFormStep(isEditing ? 'list' : 'select-category')} className="px-6 py-4 bg-white border border-black/10 text-ink rounded-full uppercase tracking-widest text-xs font-medium hover:bg-black/5 transition-colors">
            Kembali
          </button>
          <button type="button" onClick={handleSubmit} className="px-10 py-4 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            {isEditing ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
          </button>
        </div>
      </form>
      )})()}
    </div>
  );
}
