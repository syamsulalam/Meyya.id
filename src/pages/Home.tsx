import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import CatalogProductCard from '../components/CatalogProductCard';

export default function Home() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('kategori');
  const { cart } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (category) {
          setProducts(data.filter((p: any) => p.category_name.toLowerCase() === category.toLowerCase()));
        } else {
          setProducts(data);
        }
        setLoading(false);
      });
  }, [category]);

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const displayedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full">
      {/* Hero Banner - Only on main page */}
      {!category && (
        <div className="px-4 mb-20 max-w-7xl mx-auto">
          <div className="relative w-full h-auto glass-panel overflow-hidden flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 rounded-[40px]">
            {/* Soft decorative background elements */}
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-100/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl flex flex-col items-center">
              <span className="text-xs uppercase tracking-[0.2em] mb-6 inline-block opacity-70">
                Koleksi Musim Semi/Panas (<i>Spring/Summer Collection</i>)
              </span>
              <h1 className="text-5xl md:text-7xl font-light mb-6 leading-[1.1] tracking-tight">
                Keanggunan di <br/>
                Setiap Naungan (<i>Drape</i>)
              </h1>
              <p className="text-lg opacity-70 mb-10 font-light max-w-md mx-auto leading-relaxed">
                Rasakan mode sopan (<i>modest fashion</i>) yang didefinisikan ulang. Menggunakan material premium, buatan tangan yang cermat (<i>meticulous craftsmanship</i>), dan estetika abadi (<i>timeless aesthetic</i>) untuk muslimah modern.
              </p>
              <a href="#katalog" className="glass-button">
                Jelajahi Koleksi
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Catalog */}
      <div className="max-w-7xl mx-auto px-4 py-8 mb-20 w-full" id="katalog">
        <div className="flex flex-col items-center justify-center mb-12 border-b border-black/10 pb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-8 text-center text-ink">
            {category ? `Kategori: ${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Katalog Terbaru'}
          </h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
            <Link to="/#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${!category ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Semua</Link>
            <Link to="/?kategori=pashmina#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${category === 'pashmina' ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Pashmina</Link>
            <Link to="/?kategori=abaya#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${category === 'abaya' ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Abaya</Link>
            <Link to="/?kategori=khimar#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${category === 'khimar' ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Khimar</Link>
            <Link to="/?kategori=inner#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${category === 'inner' ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Inner</Link>
            <Link to="/?kategori=aksesoris#katalog" className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${category === 'aksesoris' ? 'bg-black text-white' : 'glass-panel hover:bg-white/60'}`}>Aksesoris</Link>
          </div>

          <span className="text-sm font-light opacity-60 uppercase tracking-widest text-center block">
            {products.length} Produk (<i>Items</i>)
          </span>
        </div>
        
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center opacity-60">
             <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mb-4" />
             <p className="font-light tracking-widest uppercase text-xs">Memilah Koleksi (<i>Curating Collection</i>)...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
              {displayedProducts.map(product => {
                // Calculate total quantity of this product in cart across all variations
                const cartItemsForProduct = cart.filter(c => c.product_id === product.id);
                const totalQuantityInCart = cartItemsForProduct.reduce((acc, curr) => acc + curr.quantity, 0);

                return (
                  <div key={product.id}>
                    <CatalogProductCard 
                      product={product} 
                      totalQuantityInCart={totalQuantityInCart} 
                      cartItemsForProduct={cartItemsForProduct}
                    />
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center glass-panel rounded-[40px] px-4">
                  <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl opacity-50">✨</span>
                  </div>
                  <h3 className="text-2xl font-light mb-4">Koleksi Sedang Disiapkan</h3>
                  <p className="opacity-60 font-light max-w-md mx-auto mb-8">Kami sedang menyiapkan karya seni terbaru untuk kategori ini. Silakan periksa kembali nanti atau jelajahi koleksi kami yang lain.</p>
                  <Link to="/#katalog" className="glass-button">Lihat Semua Katalog</Link>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-16 pb-8">
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-6 py-2 glass-panel rounded-full text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity"
                >
                  Sebelumnya
                </button>
                <span className="text-xs tracking-widest uppercase opacity-70">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 glass-panel rounded-full text-xs uppercase tracking-widest disabled:opacity-30 transition-opacity"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* The Meyya Philosophy - Editorial Section (Moved below catalog) */}
      {!category && (
        <section className="py-16 md:py-24 px-4 w-full">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="glass-panel p-4 rounded-[40px] aspect-[4/5] relative">
              <img 
                src="https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?q=80&w=800&auto=format&fit=crop" 
                alt="Editorial Fashion" 
                className="w-full h-full object-cover rounded-[32px]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-10 -right-10 md:-right-20 glass-panel p-6 max-w-[280px] hidden md:block">
                <p className="font-heading italic text-xl leading-tight opacity-80">
                  "Kesederhanaan adalah kunci dasar dari semua keanggunan sejati."
                </p>
              </div>
            </div>
            
            <div className="flex flex-col justify-center px-4 md:px-0">
              <span className="text-xs uppercase tracking-[0.2em] mb-4 opacity-60">Filosofi MEYYA</span>
              <h2 className="text-4xl md:text-5xl font-light mb-8 leading-tight">
                Dibuat untuk yang <br/> Berselera Tinggi (<i>Discerning</i>).
              </h2>
              <div className="space-y-8 font-light opacity-80">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">Bahan Premium Terpilih</h3>
                  <p className="text-sm leading-relaxed">Kami secara spesifik memilih kain (<i>fabrics</i>) berkualitas terbaik. Mulai dari <i>mulberry silks</i>, hinggga kain <i>ceremonials</i> atau <i>voales</i> yang sangat lembut, berpori, dan menutupi dengan sempurna (<i>drape perfectly</i>).</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">Jahitan Artisan Detail</h3>
                  <p className="text-sm leading-relaxed">Setiap potongan menampilkan jahitan tangan dengan kualitas butik (<i>boutique-quality stitching</i>), memastikan ketahanan tinggi dan jaminan proporsional ukuran saat dikenakan (<i>flawless fit</i>).</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">Inovasi Layar Transparan (<i>Glass-Look</i>)</h3>
                  <p className="text-sm leading-relaxed">Lebih dari sekadar berbelanja, Anda dapat melihat pergantian warna produk yang instan secara riil (<i>real-time instant-color tech</i>) tanpa jeda pemuatan (<i>loading times</i>). Pengalaman belanja estetik di telapak tangan Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
