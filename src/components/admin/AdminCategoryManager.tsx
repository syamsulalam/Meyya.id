import React, { useState } from 'react';
import { Plus, Trash2, Tag, Upload, Edit, X, Check } from 'lucide-react';
import useSWR, { mutate } from 'swr';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    let err;
    try {
      err = await r.json();
      throw new Error(err.error || JSON.stringify(err));
    } catch {
      const text = await r.text();
      throw new Error(`HTTP ${r.status}: ${text}`);
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

export default function AdminCategoryManager() {
  const { data: categories, error } = useSWR('/api/categories', fetcher);
  
  const [newCat, setNewCat] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newHasColors, setNewHasColors] = useState(false);
  const [newHasSizes, setNewHasSizes] = useState(false);
  const [newAttributes, setNewAttributes] = useState<{name: string, options: string[]}[]>([]);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editHasColors, setEditHasColors] = useState(false);
  const [editHasSizes, setEditHasSizes] = useState(false);
  const [editAttributes, setEditAttributes] = useState<{name: string, options: string[]}[]>([]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show loading visually (optional)
      const loadingPlaceholder = 'https://placehold.co/150x150?text=Uploading...';
      if (isEdit) {
        setEditPreviewUrl(loadingPlaceholder);
      } else {
        setPreviewUrl(loadingPlaceholder);
      }

      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.url) {
          if (isEdit) {
            setEditPreviewUrl(data.url);
          } else {
            setPreviewUrl(data.url);
          }
        } else {
          alert('Gagal mengupload gambar');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat upload gambar');
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCat,
          slug: newCat.toLowerCase().replace(/\s+/g, '-'),
          image_url: previewUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=60',
          has_colors: newHasColors,
          has_sizes: newHasSizes,
          attributes: newAttributes
        })
      });
      mutate('/api/categories');
      setNewCat('');
      setPreviewUrl(null);
      setNewHasColors(false);
      setNewHasSizes(false);
      setNewAttributes([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (!confirm('Hapus kategori ini?')) return;
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      mutate('/api/categories');
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditPreviewUrl(cat.image_url);
    setEditHasColors(cat.has_colors === 1);
    setEditHasSizes(cat.has_sizes === 1);
    
    // Parse attributes
    let parsedAttrs: any = [];
    if (Array.isArray(cat.attributes)) {
       parsedAttrs = cat.attributes.map((a: any) => ({
         name: a.name,
         options: typeof a.options === 'string' ? JSON.parse(a.options) : (Array.isArray(a.options) ? a.options : [])
       }));
    }
    setEditAttributes(parsedAttrs);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (cat: any) => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          slug: editName.toLowerCase().replace(/\s+/g, '-'),
          image_url: editPreviewUrl || cat.image_url,
          has_colors: editHasColors,
          has_sizes: editHasSizes,
          attributes: editAttributes
        })
      });
      mutate('/api/categories');
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-light mb-8 font-heading">Manajemen Kategori (Taxonomy)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl bg-white/40">
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-6 flex items-center gap-2"><Tag size={16}/> Daftar Kategori</h3>
          <ul className="space-y-3">
            {(Array.isArray(categories) ? categories : [])?.map((cat: any) => (
              <li key={cat.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/50 p-4 rounded-2xl border border-black/5 gap-4">
                {editingId === cat.id ? (
                  <div className="flex-1 w-full space-y-3">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl border border-black/10 overflow-hidden bg-black/5 flex items-center justify-center flex-shrink-0">
                         {editPreviewUrl ? (
                           <img src={editPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                         ) : (
                           <Upload size={16} className="opacity-20" />
                         )}
                       </div>
                       <label className="cursor-pointer border border-black/10 hover:border-black/30 bg-white/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-block text-ink whitespace-nowrap">
                         Ganti Foto
                         <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} className="hidden" />
                       </label>
                     </div>
                     <input 
                       type="text" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="w-full bg-white border border-black/10 rounded-xl py-2 px-3 focus:outline-none focus:border-black/50 text-sm"
                     />
                     
                     {/* Edit Atribut Kategori */}
                     <div className="bg-white/40 p-4 rounded-xl border border-black/5 space-y-3">
                       <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Pengaturan Varian Produk</p>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={editHasColors} onChange={e => setEditHasColors(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                         <span className="text-sm">Aktifkan Varian Warna</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={editHasSizes} onChange={e => setEditHasSizes(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                         <span className="text-sm">Aktifkan Varian Ukuran</span>
                       </label>
                       
                       <div className="pt-2 border-t border-black/5">
                         <p className="text-xs uppercase opacity-60 mb-2">Atribut Spesifikasi Khusus</p>
                         {editAttributes.map((attr, idx) => (
                           <div key={idx} className="flex gap-2 items-center mb-2">
                             <input type="text" value={attr.name} onChange={e => {
                               const newAttrs = [...editAttributes];
                               newAttrs[idx].name = e.target.value;
                               setEditAttributes(newAttrs);
                             }} placeholder="Nama (Mis: Bahan)" className="w-1/3 bg-white border border-black/10 rounded-lg py-1 px-2 text-xs" />
                             
                             <input type="text" value={attr.options.join(', ')} onChange={e => {
                               const newAttrs = [...editAttributes];
                               newAttrs[idx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                               setEditAttributes(newAttrs);
                             }} placeholder="Opsi (dipisah koma)" className="flex-1 bg-white border border-black/10 rounded-lg py-1 px-2 text-xs" />
                             
                             <button type="button" onClick={() => setEditAttributes(editAttributes.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-black/5 p-1 rounded">
                               <Trash2 size={14} />
                             </button>
                           </div>
                         ))}
                         <button type="button" onClick={() => setEditAttributes([...editAttributes, {name: '', options: []}])} className="text-xs font-medium text-ink hover:underline flex items-center gap-1 mt-2">
                           <Plus size={12} /> Tambah Spesifikasi
                         </button>
                       </div>
                     </div>
                     
                     <div className="flex gap-2 justify-end w-full">
                        <button onClick={cancelEdit} className="text-gray-500 hover:bg-black/5 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"><X size={14} /> Batal</button>
                        <button onClick={() => saveEdit(cat)} className="bg-ink text-white p-2 px-3 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"><Check size={14} /> Simpan</button>
                     </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      {cat.image_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 flex-shrink-0 flex items-center justify-center text-black/20">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-500 font-mono">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-xs bg-black/5 px-2 py-1 rounded-full">{cat.count} produk</span>
                      <button onClick={() => startEdit(cat)} className="text-gray-500 hover:bg-black/5 p-2 rounded-full transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {(!categories || categories.length === 0) && <p className="text-center text-sm text-gray-500 py-4">Belum ada kategori</p>}
          </ul>
        </div>
        
        <div className="glass-panel p-8 rounded-3xl h-fit bg-white/40">
           <h3 className="text-sm uppercase tracking-widest font-semibold mb-6 flex items-center gap-2"><Plus size={16}/> Tambah Kategori Baru</h3>
           <form onSubmit={handleAdd} className="space-y-4">
             <div>
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Foto Kategori (Opsional)</label>
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-xl border border-black/10 overflow-hidden bg-black/5 flex items-center justify-center flex-shrink-0">
                   {previewUrl ? (
                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <Upload size={20} className="opacity-20" />
                   )}
                 </div>
                 <div className="flex-1">
                   <label className="cursor-pointer border border-black/10 hover:border-black/30 bg-white/50 px-4 py-2 rounded-xl text-xs font-medium transition-colors inline-block text-ink">
                     <span className="hidden md:inline">Pilih Foto .jpg/.png</span>
                     <span className="md:hidden">Pilih Foto</span>
                     <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                   </label>
                 </div>
               </div>
             </div>
             <div>
               <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Nama Kategori</label>
               <input 
                 type="text" 
                 value={newCat}
                 onChange={e => setNewCat(e.target.value)}
                 placeholder="Mis: Gamis Premium" 
                 className="w-full bg-white/70 border border-black/10 rounded-xl py-3 px-4 focus:outline-none focus:border-black/50 text-sm" 
               />
               <p className="text-[10px] text-gray-500 mt-2">Kategori baru akan muncul di navigasi atas setelah ditambahkan.</p>
             </div>
             
             <div className="bg-white/40 border border-black/5 rounded-xl p-4 space-y-3">
                <p className="text-xs uppercase tracking-widest opacity-60 font-semibold mb-2">Varian Pada Kategori Ini</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newHasColors} onChange={e => setNewHasColors(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                  <span className="text-sm">Aktifkan Varian Warna (Colors)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newHasSizes} onChange={e => setNewHasSizes(e.target.checked)} className="rounded border-black/20 text-ink focus:ring-ink" />
                  <span className="text-sm">Aktifkan Varian Ukuran (Sizes)</span>
                </label>
                
                <div className="pt-4 border-t border-black/5 mt-2">
                  <p className="text-[10px] uppercase opacity-60 mb-2">Spesifikasi Lainnya (Opsional)</p>
                  {newAttributes.map((attr, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2">
                      <input type="text" value={attr.name} onChange={e => {
                        const newAttrs = [...newAttributes];
                        newAttrs[idx].name = e.target.value;
                        setNewAttributes(newAttrs);
                      }} placeholder="Nama (Mis: Bahan)" className="w-1/3 bg-white border border-black/10 rounded-lg py-1 px-2 text-xs" />
                      
                      <input type="text" value={attr.options.join(', ')} onChange={e => {
                        const newAttrs = [...newAttributes];
                        newAttrs[idx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setNewAttributes(newAttrs);
                      }} placeholder="Opsi contoh: Katun, Linen" className="flex-1 bg-white border border-black/10 rounded-lg py-1 px-2 text-xs" />
                      
                      <button type="button" onClick={() => setNewAttributes(newAttributes.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-black/5 p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewAttributes([...newAttributes, {name: '', options: []}])} className="text-xs font-medium text-ink hover:underline flex items-center gap-1 mt-2">
                    <Plus size={12} /> Tambah Spesifikasi
                  </button>
                </div>
             </div>
             
             <button type="submit" className="w-full py-3 bg-ink text-white rounded-xl uppercase tracking-widest text-xs font-medium hover:bg-black/80 transition-colors shadow-lg">Simpan Kategori</button>
           </form>
        </div>
      </div>
    </div>
  );
}
