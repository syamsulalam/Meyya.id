import React, { useState } from 'react';
import { Plus, Trash2, Tag, Upload } from 'lucide-react';

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Pashmina', slug: 'pashmina', count: 45, imagePreview: 'https://images.unsplash.com/photo-1589465885857-44edb59bbcdb?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Abaya', slug: 'abaya', count: 12, imagePreview: 'https://images.unsplash.com/photo-1627914225226-8051db55c117?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Khimar', slug: 'khimar', count: 30, imagePreview: 'https://images.unsplash.com/photo-1610427921319-5eb874d8b6da?auto=format&fit=crop&q=80&w=800' },
    { id: 4, name: 'Inner', slug: 'inner', count: 10, imagePreview: 'https://images.unsplash.com/photo-1632734346904-7c30a213fd0d?auto=format&fit=crop&q=80&w=800' },
    { id: 5, name: 'Aksesoris', slug: 'aksesoris', count: 8, imagePreview: 'https://plus.unsplash.com/premium_photo-1675107359570-87efced5d045?auto=format&fit=crop&q=80&w=800' },
  ]);
  const [newCat, setNewCat] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setCategories([...categories, { 
      id: Date.now(), 
      name: newCat, 
      slug: newCat.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
      imagePreview: previewUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=60' // default placeholder
    }]);
    setNewCat('');
    setPreviewUrl(null);
  };

  const handleDelete = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div>
      <h2 className="text-2xl font-light mb-8 font-heading">Manajemen Kategori (Taxonomy)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-3xl bg-white/40">
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-6 flex items-center gap-2"><Tag size={16}/> Daftar Kategori</h3>
          <ul className="space-y-3">
            {categories.map(cat => (
              <li key={cat.id} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-black/5">
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-500 font-mono">/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs bg-black/5 px-2 py-1 rounded-full">{cat.count} produk</span>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Belum ada kategori</p>}
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
