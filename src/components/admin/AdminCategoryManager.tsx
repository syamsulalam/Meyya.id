import React, { useState } from 'react';
import { Plus, Trash2, Tag, Upload, Edit, X, Check } from 'lucide-react';
import useSWR, { mutate } from 'swr';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    let err;
    try { err = await r.json(); } catch { err = { error: 'Terjadi kesalahan' }; }
    throw new Error(err.error || 'Terjadi kesalahan');
  }
  return r.json();
};

export default function AdminCategoryManager() {
  const { data: categories, error } = useSWR('/api/categories', fetcher);
  
  const [newCat, setNewCat] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dummy visual update, in reality you upload to storage
      const url = URL.createObjectURL(file);
      if (isEdit) {
        setEditPreviewUrl(url);
      } else {
        setPreviewUrl(url);
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
          image_url: previewUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=60'
        })
      });
      mutate('/api/categories');
      setNewCat('');
      setPreviewUrl(null);
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
          image_url: editPreviewUrl || cat.image_url
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
             <button type="submit" className="w-full py-3 bg-ink text-white rounded-xl uppercase tracking-widest text-xs font-medium hover:bg-black/80 transition-colors shadow-lg">Simpan Kategori</button>
           </form>
        </div>
      </div>
    </div>
  );
}
