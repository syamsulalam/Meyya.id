import { useState } from 'react';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const trendingSearches = [
    'Pashmina Silk', 'Abaya Hitam', 'Khimar Syari', 'Inner Rajut'
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 w-full flex-1">
      <div className="mb-12">
        <h1 className="text-3xl font-light mb-6 font-heading text-center">Pencarian</h1>
        
        <div className="relative max-w-2xl mx-auto">
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari koleksi, kategori, atau warna..."
            className="w-full bg-transparent border-b-2 border-ink py-4 pl-12 pr-4 text-xl font-light focus:outline-none placeholder:opacity-40"
          />
          <SearchIcon size={24} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
        </div>
      </div>

      {!query ? (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xs uppercase tracking-widest opacity-60 mb-4">Pencarian Populer</h3>
          <div className="flex flex-wrap gap-3">
            {trendingSearches.map(term => (
              <button 
                key={term} 
                onClick={() => setQuery(term)}
                className="px-4 py-2 rounded-full border border-black/10 text-sm hover:bg-black hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-[40px] text-center">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon size={28} className="opacity-40" />
          </div>
          <h3 className="text-2xl font-light mb-2">Simulasi Hasil Pencarian</h3>
          <p className="opacity-60 font-light mb-8">Anda mencari "{query}". Dalam mode nyata, ini akan menampilkan daftar produk yang relevan.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest border-b border-ink pb-1 hover:opacity-70 transition-opacity">
            Kembali ke Katalog <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
