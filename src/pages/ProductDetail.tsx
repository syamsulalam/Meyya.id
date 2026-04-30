import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../store';
import clsx from 'clsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          navigate('/');
        } else {
          setProduct(data);
          if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
          if (data.sizes?.length > 0) setSelectedSize(data.sizes[0].size_name);
        }
        setLoading(false);
      });
  }, [slug, navigate]);

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Memuat produk...</div>;
  }
  if (!product) return null;

  const isWished = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart({
      product_id: product.id,
      product_name: product.name,
      color: selectedColor?.color_name || 'Default',
      size: selectedSize || 'All Size',
      quantity: 1,
      price: product.base_price,
      image_url: product.image_url
    });
    alert('Produk ditambahkan ke keranjang!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full flex-1 flex flex-col md:flex-row gap-8 lg:gap-16">
      
      {/* Product Image Section with Glassmorphism and Color Magic */}
      <div className="w-full md:w-1/2">
        <div className="aspect-[3/4] rounded-[2rem] glass-panel overflow-hidden relative p-4 group">
          {/* Inner image container */}
          <div className="w-full h-full relative rounded-xl overflow-hidden bg-transparent">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover relative z-10 transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
                style={{
                  mixBlendMode: 'multiply'
                }}
              />
            ) : (
              <div className="w-full h-full relative z-10 flex flex-col items-center justify-center bg-black/5 text-black/20 group-hover:scale-105 transition-transform duration-700 ease-out">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
            )}
            {/* The color layer sitting behind/mixing with the image */}
            <div 
              className="absolute inset-0 z-0 transition-colors duration-500 ease-out"
              style={{ backgroundColor: selectedColor ? selectedColor.hex_code : 'transparent' }}
            />
          </div>
          
          {/* Wishlist button floating on glass panel */}
          <button 
            onClick={() => toggleWishlist(product.id)}
            className="absolute top-8 right-8 p-3 glass-panel hover:bg-white/80 transition-colors rounded-full z-20"
          >
            <Heart size={24} className={clsx("transition-colors", isWished ? "fill-red-500 stroke-red-500" : "stroke-gray-600")} />
          </button>
        </div>
      </div>

      {/* Product Info Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">{product.category_name}</p>
        <h1 className="text-4xl md:text-5xl font-light mb-4" style={{fontFamily: 'var(--font-heading)'}}>
          {product.name}
        </h1>
        <p className="text-2xl mb-8">Rp {product.base_price.toLocaleString('id-ID')}</p>
        
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wider">
            Warna: {selectedColor?.color_name}
          </p>
          <div className="flex gap-3">
            {product.colors?.map((c: any) => (
              <button
                key={c.hex_code}
                onClick={() => setSelectedColor(c)}
                className={clsx(
                  "w-10 h-10 rounded-full border-2 transition-all duration-300 relative",
                  selectedColor?.hex_code === c.hex_code 
                    ? "border-black scale-110 shadow-lg" 
                    : "border-transparent hover:scale-105 shadow-sm"
                )}
                style={{ backgroundColor: c.hex_code }}
                title={c.color_name}
              >
                <span className="sr-only">{c.color_name}</span>
              </button>
            ))}
          </div>
        </div>

        {product.sizes?.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wider">Ukuran</p>
            <div className="flex gap-3">
              {product.sizes.map((s: any) => (
                <button
                  key={s.size_name}
                  onClick={() => setSelectedSize(s.size_name)}
                  className={clsx(
                    "w-14 h-14 rounded-2xl glass-panel flex items-center justify-center font-medium transition-all duration-300",
                    selectedSize === s.size_name 
                      ? "bg-black/90 text-white border-black" 
                      : "hover:bg-white/80"
                  )}
                >
                  {s.size_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="prose prose-sm text-gray-600 mb-8 max-w-none leading-relaxed">
          <p>{product.description}</p>
        </div>

        <div className="flex gap-4 mt-8 pt-4">
          <button 
            onClick={handleAddToCart}
            className="flex-1 glass-button flex items-center justify-center gap-2 py-4 text-base"
          >
            <ShoppingBag size={20} />
            Tambah ke Keranjang
          </button>
        </div>

        {/* Accordions for Editorial Info */}
        <div className="mt-12 space-y-4">
          <div className="border-b border-black/10 pb-4">
            <h4 className="font-heading uppercase tracking-widest text-sm font-semibold mb-2">Detail & Perawatan (<i>Care</i>)</h4>
            <ul className="text-xs font-light opacity-70 space-y-1 list-disc list-inside">
              <li>Penyelesaian (<i>finish</i>) butik dengan detail cermat</li>
              <li>Kain (<i>fabric</i>) premium ringan dan <i>breathable</i></li>
              <li>Kucek pelan menggunakan tangan di air dingin</li>
              <li>Setrika pada pengaturan panas terendah bila perlu</li>
            </ul>
          </div>
          <div className="border-b border-black/10 pb-4">
            <h4 className="font-heading uppercase tracking-widest text-sm font-semibold mb-2">Pengiriman & Retur (<i>Returns</i>)</h4>
            <p className="text-xs font-light opacity-70 leading-relaxed">
              Pengiriman standar gratis untuk semua pesanan (<i>orders</i>) di atas Rp 500.000. 
              Retur diterima dalam waktu 7 hari pengiriman dalam kondisi utuh dengan tanda pengenal (<i>tags</i>) orisinil belum dilepas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
