import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../store';
import clsx from 'clsx';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { useUser } from '@clerk/react';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, addRecentlyViewed, addToast } = useStore();
  const authFetch = useAuthFetch();
  const { isSignedIn } = useUser();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
           navigate('/');
        } else {
           setProduct(data);
           addRecentlyViewed(data.id);
           if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
           if (data.sizes?.length > 0) setSelectedSize(data.sizes[0].size_name);
           document.title = data.meta_title || `${data.name} | MEYYA.ID`;
           const metaDescription = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement('meta'));
           metaDescription.setAttribute('name', 'description');
           metaDescription.setAttribute('content', data.meta_description || data.description || 'Produk MEYYA.ID');
        }
        setLoading(false);
      })
      .catch(err => {
         console.error('Failed to load product:', err);
         setLoading(false);
      });
  }, [slug, navigate, addRecentlyViewed]);

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
      weight: product.weight || 250,
      image_url: product.image_url
    });
    addToast('Produk ditambahkan ke keranjang!', 'success');
  };

  const submitReview = async () => {
    if (!isSignedIn) return addToast('Login dulu untuk menulis review.', 'error');
    try {
      const res = await authFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, rating: reviewRating, review_text: reviewText })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim review');
      setProduct({
        ...product,
        reviews: [{ rating: reviewRating, review_text: reviewText, created_at: new Date().toISOString() }, ...(product.reviews || [])],
        review_count: Number(product.review_count || 0) + 1,
      });
      setReviewText('');
      setReviewRating(5);
      addToast('Review berhasil dikirim.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
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
        <p className="text-2xl mb-4">Rp {product.base_price.toLocaleString('id-ID')}</p>
        {product.review_count > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-black/60">
            <Star size={16} className="fill-yellow-400 stroke-yellow-500" />
            <span>{Number(product.rating_average || 0).toFixed(1)} dari {product.review_count} review</span>
          </div>
        )}
        
        {product.is_preorder === 1 ? (
          <div className="mb-6 inline-block bg-ink text-white text-xs uppercase tracking-widest font-bold px-4 py-1.5 rounded-full shadow-sm">
            Tersedia untuk Pre-Order
          </div>
        ) : product.stock === 0 ? (
          <div className="mb-6 inline-block bg-red-500 text-white text-xs uppercase tracking-widest font-bold px-4 py-1.5 rounded-full shadow-sm">
            Stok Habis
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6 font-mono">Tersedia {product.stock} pcs</p>
        )}
        
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wider">
            Warna: {selectedColor?.color_name}
          </p>
          <div className="flex gap-3">
            {(Array.isArray(product.colors) ? product.colors : []).map((c: any) => (
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

        {Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wider">Ukuran</p>
            <div className="flex gap-3">
              {(Array.isArray(product.sizes) ? product.sizes : []).map((s: any) => (
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
            disabled={product.stock === 0 && product.is_preorder !== 1}
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-base transition-colors ${
               product.stock === 0 && product.is_preorder !== 1 
               ? 'bg-black/10 text-black/40 cursor-not-allowed rounded-full' 
               : 'glass-button'
            }`}
          >
            <ShoppingBag size={20} />
            {product.stock === 0 && product.is_preorder !== 1 ? 'Stok Habis' : product.is_preorder === 1 ? 'Pre-Order Sekarang' : 'Tambah ke Keranjang'}
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

        {Array.isArray(product.reviews) && (
          <div className="mt-10 border-t border-black/10 pt-6">
            <h4 className="font-heading uppercase tracking-widest text-sm font-semibold mb-4">Review Pelanggan</h4>
            <div className="space-y-3 mb-5">
              {product.reviews.slice(0, 3).map((review: any, idx: number) => (
                <div key={idx} className="bg-white/50 border border-black/5 rounded-2xl p-4">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Number(review.rating) ? 'fill-yellow-400 stroke-yellow-500' : 'stroke-black/20'} />
                    ))}
                  </div>
                  <p className="text-sm text-black/70">{review.review_text || 'Tanpa catatan tambahan.'}</p>
                </div>
              ))}
              {product.reviews.length === 0 && <p className="text-sm text-black/50">Belum ada review untuk produk ini.</p>}
            </div>
            <div className="bg-white/40 border border-black/5 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                    <Star size={18} className={i < reviewRating ? 'fill-yellow-400 stroke-yellow-500' : 'stroke-black/30'} />
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} placeholder="Tulis pengalaman Anda..." className="w-full bg-white border border-black/10 rounded-xl p-3 text-sm resize-none" />
              <button type="button" onClick={submitReview} className="px-5 py-2.5 bg-ink text-white rounded-full text-xs uppercase tracking-widest font-semibold">Kirim Review</button>
            </div>
          </div>
        )}

        {Array.isArray(product.related_products) && product.related_products.length > 0 && (
          <div className="mt-10 border-t border-black/10 pt-6">
            <h4 className="font-heading uppercase tracking-widest text-sm font-semibold mb-4">Produk Terkait</h4>
            <div className="grid grid-cols-2 gap-3">
              {product.related_products.map((related: any) => (
                <button key={related.id} onClick={() => navigate(`/produk/${related.slug}`)} className="text-left bg-white/50 border border-black/5 rounded-2xl overflow-hidden hover:bg-white transition-colors">
                  <img src={related.image_url} alt={related.name} className="w-full aspect-[4/5] object-cover bg-black/5" />
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{related.name}</p>
                    <p className="text-xs text-black/50 mt-1">Rp {Number(related.base_price || 0).toLocaleString('id-ID')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
