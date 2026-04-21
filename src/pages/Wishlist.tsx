import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useStore } from '../store';
import { useEffect, useState } from 'react';

export default function Wishlist() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.filter((p: any) => wishlist.includes(p.id)));
        setLoading(false);
      });
  }, [wishlist]);

  if (wishlist.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mb-6">
          <Heart size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-light mb-2"><i>Wishlist</i> Anda Kosong</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md font-light">
          Simpan kurasi pakaian favorit Anda di sini. Tambahkan produk ke <i>wishlist</i> untuk membelinya nanti.
        </p>
        <Link to="/" className="glass-button">Jelajahi Koleksi</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
      <h1 className="text-3xl font-light mb-8 font-heading"><i>Wishlist</i> Anda</h1>
      
      {loading ? (
        <div className="py-20 text-center text-gray-500">Memuat <i>wishlist</i>...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map(product => (
            <Link key={product.id} to={`/produk/${product.slug}`} className="group flex flex-col">
              <div className="aspect-[3/4] rounded-[2rem] glass-panel overflow-hidden relative mb-4">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  style={{ mixBlendMode: 'multiply' }}
                />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
              </div>
              <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-gray-500">Rp {product.base_price.toLocaleString('id-ID')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
