import useSWR from 'swr';
import CatalogProductCard from '../CatalogProductCard';
import { Sparkles } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfileRecommendations() {
  const { data: dbProducts, isLoading } = useSWR('/api/products', fetcher);
  
  const products = Array.isArray(dbProducts) ? dbProducts : [];
  // get 4 random products or top 4
  const recommendations = products.slice(0, 4);

  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4 flex items-center gap-2"><Sparkles size={20} className="text-ink" /> Kamu Mungkin Suka</h3>
      
      {isLoading && <div className="text-center py-8 opacity-50 bg-white/40 rounded-3xl">⏳ Memuat rekomendasi...</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {recommendations.map((product: any) => (
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
