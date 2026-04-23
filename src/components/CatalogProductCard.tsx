import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, CreditCard, Plus, Minus, ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../store';
import clsx from 'clsx';

export default function CatalogProductCard({ product, totalQuantityInCart, cartItemsForProduct }: { 
  product: any, 
  totalQuantityInCart: number,
  cartItemsForProduct: any[]
}) {
  const { wishlist, toggleWishlist, addToCart, decreaseQuantity, cart } = useStore();
  const navigate = useNavigate();
  
  // States for Quick Add Modal
  const [quickAddStep, setQuickAddStep] = useState<0 | 1 | 2>(0); // 0 = default, 1 = pick color, 2 = pick size
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  const isWished = wishlist.includes(product.id);

  // Quick Action Handler
  const startQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.colors?.length > 0) {
      setQuickAddStep(1);
    } else if (product.sizes?.length > 0) {
      setQuickAddStep(2);
    } else {
      // Direct add if no variants
      addToCart({
        product_id: product.id,
        product_name: product.name,
        color: "Standar",
        size: "Semua Ukuran",
        quantity: 1,
        price: product.base_price,
        image_url: product.image_url
      });
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickAddStep === 1 && selectedColor) {
      if (product.sizes?.length > 0) setQuickAddStep(2);
      else finishQuickAdd(e);
    } else if (quickAddStep === 2 && selectedSize) {
      finishQuickAdd(e);
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickAddStep === 2 && product.colors?.length > 0) setQuickAddStep(1);
    else setQuickAddStep(0);
  };

  const finishQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product_id: product.id,
      product_name: product.name,
      color: selectedColor?.color_name || "Standar",
      size: selectedSize || "Semua Ukuran",
      quantity: 1,
      price: product.base_price,
      image_url: product.image_url
    });
    setQuickAddStep(0);
    setSelectedColor(null);
    setSelectedSize('');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product_id: product.id,
      product_name: product.name,
      color: "Standar",
      size: "Semua Ukuran",
      quantity: 1,
      price: product.base_price,
      image_url: product.image_url
    });
    navigate('/cart');
  };

  // If variants are hovered, get its real original cart index for quantity modifier
  const getCartIndexForVariation = (color: string, size: string) => {
    return cart.findIndex(c => c.product_id === product.id && c.color === color && c.size === size);
  };

  return (
    <Link to={`/produk/${product.slug}`} className="group flex flex-col cursor-pointer relative">
      <div className="aspect-[3/4] rounded-2xl glass-panel relative mb-4 overflow-hidden bg-white/40">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-700 ease-out group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
        
        {/* Wishlist Button */}
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-4 right-4 z-20 hover:scale-110 transition-transform drop-shadow"
        >
          <Heart size={24} strokeWidth={1.5} className={isWished ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-black/10'} />
        </button>

        {/* Quick Add Form Overlay inside Cart Container */}
        {quickAddStep > 0 ? (
          <div 
            className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex flex-col justify-end p-4 animate-in fade-in"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button 
              onClick={handlePrevStep}
              className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-sm hover:scale-105"
            >
              <ArrowLeft size={16} />
            </button>
            
            {quickAddStep === 1 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-center mb-2">Pilih Warna</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {product.colors?.map((c: any) => (
                    <button
                      key={c.hex_code}
                      onClick={() => setSelectedColor(c)}
                      className={clsx(
                        "w-8 h-8 rounded-full border-2 transition-all duration-300 relative",
                        selectedColor?.hex_code === c.hex_code 
                          ? "border-black scale-110 shadow-lg" 
                          : "border-transparent hover:scale-105 shadow-sm"
                      )}
                      style={{ backgroundColor: c.hex_code }}
                      title={c.color_name}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNextStep}
                  disabled={!selectedColor}
                  className="mt-4 bg-ink text-white w-full py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-sm disabled:opacity-50"
                  title="Konfirmasi Warna"
                >
                  Pilih Warna
                </button>
              </div>
            )}

            {quickAddStep === 2 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-center mb-2">Pilih Ukuran</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {product.sizes?.map((s: any) => (
                    <button
                      key={s.size_name}
                      onClick={() => setSelectedSize(s.size_name)}
                      className={clsx(
                        "w-10 h-10 rounded-xl glass-panel flex items-center justify-center font-medium transition-all duration-300 text-xs",
                        selectedSize === s.size_name 
                          ? "bg-black/90 text-white border-black" 
                          : "hover:bg-white/80"
                      )}
                    >
                      {s.size_name}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleNextStep}
                  disabled={!selectedSize}
                  className="mt-4 bg-ink text-white w-full py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-sm disabled:opacity-50"
                  title="Konfirmasi Ukuran"
                >
                  <Check size={16} className="inline mr-2" /> Konfirmasi
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Default Quick Actions overlay (Hidden by default, shown on group-hover) */
          <div className="absolute bottom-4 left-0 right-0 px-4 z-20 flex justify-center gap-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              onClick={startQuickAdd}
              className="bg-white/90 backdrop-blur p-2.5 rounded-full hover:bg-black hover:text-white transition-colors shadow-sm"
              title="Tambah ke Keranjang"
            >
              <ShoppingCart size={18} />
            </button>
            <button 
              onClick={handleBuyNow}
              className="bg-ink text-white px-4 py-2.5 rounded-full text-xs font-medium tracking-widest uppercase hover:bg-black/80 transition-colors shadow-sm flex items-center gap-2 flex-1 justify-center whitespace-nowrap"
              title="Beli Langsung"
            >
              <CreditCard size={16} className="hidden sm:block" /> Beli
            </button>
          </div>
        )}
      </div>

      {/* Product Meta View */}
      <div className="text-center flex flex-col flex-1">
        <h3 className="font-light text-lg text-ink mb-1 group-hover:opacity-70 transition-opacity line-clamp-1">{product.name}</h3>
        <p className="text-sm opacity-60 tracking-wider mb-3">Rp {product.base_price.toLocaleString('id-ID')}</p>
        
        {/* Expanded Variation Counters */}
        <div className="mt-auto relative min-h-[36px]">
          {totalQuantityInCart > 0 ? (
            <div className="group/counter relative flex flex-col items-center">
              {/* Standalone bubble showing total quantity */}
              <div className="inline-flex items-center gap-2 bg-black/5 rounded-full px-4 py-1.5 cursor-pointer">
                <ShoppingCart size={12} className="opacity-50" />
                <span className="text-xs font-semibold min-w-[20px] text-center">{totalQuantityInCart}</span>
              </div>
              
              {/* Tooltip-style Variation List on Hover */}
              <div className="absolute bottom-full mb-2 bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl border border-black/5 p-3 w-48 opacity-0 invisible group-hover/counter:opacity-100 group-hover/counter:visible transition-all duration-300 z-50 pointer-events-none group-hover/counter:pointer-events-auto">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 border-b border-black/5 pb-2 text-center">Variasi di Keranjang</div>
                <div className="flex flex-col gap-2">
                  {cartItemsForProduct.map((cv, idx) => {
                    const originalCartIndex = getCartIndexForVariation(cv.color, cv.size);
                    return (
                      <div key={idx} className="flex flex-col gap-1 bg-black/5 rounded p-2">
                        <span className="text-[10px] text-left truncate">{cv.color} / {cv.size}</span>
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); decreaseQuantity(originalCartIndex); }}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-black/5 transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-[10px] font-medium w-4 text-center">{cv.quantity}</span>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              addToCart({
                                product_id: product.id,
                                product_name: product.name,
                                color: cv.color,
                                size: cv.size,
                                quantity: 1,
                                price: product.base_price,
                                image_url: product.image_url
                              }); 
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-black/5 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-[36px]" />
          )}
        </div>
      </div>
    </Link>
  );
}
