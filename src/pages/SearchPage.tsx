import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';
import CatalogProductCard from '../components/CatalogProductCard';
import { useStore } from '../store';
import { useTrackEvent } from '../hooks/useTrackEvent';

export default function SearchPage() {
  const { cart } = useStore();
  const trackEvent = useTrackEvent();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : []);
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load search products:', err);
        setProducts([]);
        setError('Gagal memuat produk. Coba muat ulang halaman.');
      })
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return products.filter((product: any) => {
      const searchable = [
        product.name,
        product.description,
        product.category_name,
        product.category_slug,
        ...(product.colors || []).map((color: any) => color.color_name),
        ...(product.sizes || []).map((size: any) => size.size_name),
        ...(product.attributes || []).flatMap((attr: any) => [attr.attribute_name, attr.attribute_value]),
        ...(product.variants || []).flatMap((variant: any) => [variant.option_label, variant.color_name, variant.size_name]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery, products]);

  const popularSearches = useMemo(() => {
    const terms = new Map<string, number>();
    products.forEach((product: any) => {
      if (product.category_name) terms.set(product.category_name, (terms.get(product.category_name) || 0) + 1);
      if (product.name) terms.set(product.name, (terms.get(product.name) || 0) + 1);
    });
    return Array.from(terms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term]) => term);
  }, [products]);

  useEffect(() => {
    if (loading || error || normalizedQuery.length < 2) return;
    const timeout = window.setTimeout(() => {
      trackEvent('SEARCH_PERFORMED', {
        metadata: {
          query: normalizedQuery,
          result_count: searchResults.length,
          source: 'search_page',
        },
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [error, loading, normalizedQuery, searchResults.length, trackEvent]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 w-full flex-1">
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

      {loading && (
        <div className="py-24 flex flex-col items-center justify-center opacity-60">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-light tracking-widest uppercase text-xs">Memuat Produk...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && !query ? (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xs uppercase tracking-widest opacity-60 mb-4">Pencarian Populer</h3>
          <div className="flex flex-wrap gap-3">
            {popularSearches.map(term => (
              <button 
                key={term} 
                onClick={() => {
                  setQuery(term);
                  trackEvent('SEARCH_SUGGESTION_CLICKED', { metadata: { query: term, source: 'popular_search' } });
                }}
                className="px-4 py-2 rounded-full border border-black/10 text-sm hover:bg-black hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error && query && (
        <>
          <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-sm uppercase tracking-widest opacity-60">Hasil untuk "{query}"</h2>
            <span className="text-sm opacity-60">{searchResults.length} produk</span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
              {searchResults.map((product: any) => {
                const cartItemsForProduct = cart.filter(item => item.product_id === product.id);
                const totalQuantityInCart = cartItemsForProduct.reduce((acc, item) => acc + item.quantity, 0);
                return (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    totalQuantityInCart={totalQuantityInCart}
                    cartItemsForProduct={cartItemsForProduct}
                  />
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-[32px] text-center">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon size={28} className="opacity-40" />
              </div>
              <h3 className="text-2xl font-light mb-2">Produk Tidak Ditemukan</h3>
              <p className="opacity-60 font-light">Coba kata kunci lain seperti nama kategori, warna, ukuran, atau nama produk.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
