import useSWR from 'swr';
import { useStore } from '../../store';
import CatalogProductCard from '../CatalogProductCard';
import { Package } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfileRecentlyViewed() {
  const { recentlyViewed } = useStore();
  const { data: dbProducts, isLoading } = useSWR('/api/products', fetcher);
  
  const products = Array.isArray(dbProducts) ? dbProducts : [];
  const recentlyViewedProducts = products.filter((p: any) => recentlyViewed.includes(p.id))
    .sort((a: any, b: any) => recentlyViewed.indexOf(a.id) - recentlyViewed.indexOf(b.id));

  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Terakhir Dilihat</h3>
      
      {isLoading && <div className="text-center py-8 opacity-50 bg-white/40 rounded-3xl">⏳ Memuat produk...</div>}
      
      {!isLoading && recentlyViewedProducts.length === 0 && (
        <div className="text-center py-12 text-black/50 bg-white/40 rounded-3xl">
           <Package size={48} className="mx-auto mb-4 opacity-30" />
           <p>Belum ada produk yang dilihat.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {recentlyViewedProducts.map((product: any) => (
          <CatalogProductCard
            key={product.id}
            product={product}
            totalQuantityInCart={0}
            cartItemsForProduct={[]}
          />
        ))}
      </div>
    </div>
  );
}
