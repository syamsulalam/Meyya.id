import { ShoppingBag, ChevronDown, ChevronUp, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { useState, useRef, useEffect } from 'react';

type GroupedCartItem = {
  product_id: number;
  product_name: string;
  image_url: string;
  price: number;
  total_quantity: number;
  variations: {
    color: string;
    size: string;
    quantity: number;
    originalIndex: number;
  }[];
};

export default function CartPreviewDropdown() {
  const { cart, addToCart, decreaseQuantity, removeFromCart } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [scrollInterval, setScrollInterval] = useState<number | null>(null);

  const startScroll = (direction: 'up' | 'down') => {
    const interval = window.setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += direction === 'down' ? 6 : -6;
      }
    }, 20);
    setScrollInterval(interval);
  };

  const stopScroll = () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      setScrollInterval(null);
    }
  };

  useEffect(() => {
    return () => stopScroll();
  }, [scrollInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group items by product_id
  const groupedCart: GroupedCartItem[] = [];
  cart.forEach((item, index) => {
    const existingProduct = groupedCart.find(g => g.product_id === item.product_id);
    if (existingProduct) {
      existingProduct.total_quantity += item.quantity;
      existingProduct.variations.push({
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        originalIndex: index
      });
    } else {
      groupedCart.push({
        product_id: item.product_id,
        product_name: item.product_name,
        image_url: item.image_url,
        price: item.price,
        total_quantity: item.quantity,
        variations: [{
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          originalIndex: index
        }]
      });
    }
  });

  return (
    <div className="relative group">
      {/* Tombol Utama */}
      <Link to="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex group/cart">
        <ShoppingBag size={20} strokeWidth={1.5} />
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover/cart:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">Keranjang</span>
      </Link>

      {/* Panel Mengambang (Hover Dropdown) */}
      <div className="absolute top-full right-0 pt-4 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          
          <div className="px-4 py-3 border-b border-black/5 flex justify-between items-center bg-black/5">
            <span className="text-xs uppercase tracking-widest font-medium">Keranjang ({cartCount})</span>
          </div>

          {groupedCart.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 font-light">
              Keranjang masih kosong.
            </div>
          ) : (
            <div className="relative">
              
              {/* Arrow UP untuk navigasi scroll */}
              {groupedCart.length > 3 && (
                <div 
                  className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 flex justify-center items-start pt-1 cursor-n-resize opacity-50 hover:opacity-100 transition-opacity"
                  onMouseEnter={() => startScroll('up')}
                  onMouseLeave={stopScroll}
                >
                  <ChevronUp size={16} />
                </div>
              )}

              {/* Tempat List Items. */}
              <div 
                ref={scrollContainerRef}
                className="overflow-hidden no-scrollbar"
                style={{ maxHeight: '300px' }} // Estimasi tinggi 3 items
              >
                <div className="flex flex-col">
                  {groupedCart.map((product) => (
                    <div key={product.product_id} className="flex gap-3 p-3 border-b border-black/5 hover:bg-black/5 transition-colors group/item">
                      <div className="w-16 h-20 bg-black/5 rounded overflow-hidden flex-shrink-0">
                        <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col py-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-medium line-clamp-1 pr-2">{product.product_name}</h4>
                          <span className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded-full flex-shrink-0">{product.total_quantity}</span>
                        </div>
                        <span className="text-[10px] font-semibold mt-1">Rp {(product.price * product.total_quantity).toLocaleString('id-ID')}</span>
                        
                        {/* Variations map */}
                        <div className="mt-2 space-y-1">
                          {product.variations.map((v, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] bg-white/50 p-1 rounded">
                              <span className="text-gray-500 truncate pr-2" title={`${v.color} / ${v.size}`}>
                                {v.color} / {v.size}
                              </span>
                              
                              <div className="flex items-center bg-black/5 rounded-full px-1 flex-shrink-0">
                                <button 
                                  onClick={(e) => { e.preventDefault(); decreaseQuantity(v.originalIndex); }}
                                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                                >
                                  <Minus size={8} />
                                </button>
                                <span className="w-3 text-center font-medium mx-1">{v.quantity}</span>
                                <button 
                                  onClick={(e) => { 
                                    e.preventDefault(); 
                                    addToCart({
                                      product_id: product.product_id,
                                      product_name: product.product_name,
                                      color: v.color,
                                      size: v.size,
                                      price: product.price,
                                      image_url: product.image_url,
                                      quantity: 1
                                    }); 
                                  }}
                                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                                >
                                  <Plus size={8} />
                                </button>
                                {/* Quick individual remove from variation */}
                                <button 
                                  onClick={(e) => { e.preventDefault(); removeFromCart(v.originalIndex); }}
                                  className="w-4 h-4 ml-1 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 transition-colors"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow DOWN untuk navigasi scroll */}
              {groupedCart.length > 3 && (
                <div 
                  className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 flex justify-center items-end pb-1 cursor-s-resize opacity-50 hover:opacity-100 transition-opacity"
                  onMouseEnter={() => startScroll('down')}
                  onMouseLeave={stopScroll}
                >
                  <ChevronDown size={16} />
                </div>
              )}
            </div>
          )}

          {groupedCart.length > 0 && (
            <div className="bg-white/50 border-t border-black/5">
              <div className="p-3 pb-1 flex justify-between items-center text-xs">
                <span className="font-light text-gray-500">Estimasi Total</span>
                <span className="font-semibold text-sm">Rp {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="p-3 pt-2 grid grid-cols-2 gap-2">
                <Link to="/cart" className="block w-full text-center py-2.5 bg-black/5 text-ink rounded-full text-[10px] uppercase font-semibold tracking-widest hover:bg-black/10 transition-colors">
                  Keranjang
                </Link>
                <Link to="/checkout" className="block w-full text-center py-2.5 bg-ink text-white rounded-full text-[10px] uppercase font-semibold tracking-widest hover:bg-black/80 transition-colors">
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
