import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useStore } from '../store';

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

export default function Cart() {
  const { cart, removeFromCart, addToCart, decreaseQuantity } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-light mb-2">Keranjang Kosong</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Anda belum menambahkan apapun ke keranjang. Temukan koleksi menarik kami sekarang.
        </p>
        <Link to="/" className="glass-button">Lanjut Belanja</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
      <h1 className="text-3xl font-light mb-8 font-heading">Keranjang Belanja</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="glass-panel p-4 md:p-6 rounded-[2rem]">
            {groupedCart.map((product) => (
              <div key={product.product_id} className="flex gap-4 md:gap-6 py-6 border-b border-black/5 last:border-0 group/item">
                <Link to={`/produk/${product.product_id}`} className="w-24 md:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-black/5 flex-shrink-0 relative">
                  <img 
                    src={product.image_url} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors duration-500"></div>
                </Link>
                
                <div className="flex flex-col flex-1 justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/produk/${product.product_id}`} className="font-medium text-lg leading-tight hover:underline line-clamp-1">
                        {product.product_name}
                      </Link>
                      <div className="text-xs font-semibold bg-black text-white px-3 py-1 rounded-full flex-shrink-0 ml-4">
                        {product.total_quantity} Item
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Variations Map */}
                  <div className="mt-4 flex flex-col gap-2">
                    {product.variations.map((v, i) => (
                      <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/50 border border-black/5 p-3 rounded-xl gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Variasi {i + 1}</span>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">{v.color} / {v.size}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                           <div className="flex items-center bg-black/5 rounded-full px-2 py-1">
                            <button 
                              onClick={(e) => { e.preventDefault(); decreaseQuantity(v.originalIndex); }}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-medium text-sm">{v.quantity}</span>
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
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="font-medium">Rp {(product.price * v.quantity).toLocaleString('id-ID')}</span>
                            <button 
                              onClick={(e) => { e.preventDefault(); removeFromCart(v.originalIndex); }}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                              title="Hapus variasi ini"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] sticky top-24">
            <h2 className="text-xl font-medium mb-6">Ringkasan</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Item</span>
                <span>{cart.reduce((acc, curr) => acc + curr.quantity, 0)} Pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-black/5">
                <span className="text-gray-500">Pengiriman</span>
                <span className="text-gray-500 text-right text-xs mt-0.5">Dihitung di Checkout (Sistem API)</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-medium text-base">Estimasi Biaya</span>
                <span className="font-medium text-2xl tracking-tight">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full glass-button py-4 text-base"
            >
              Lanjutkan ke Checkout
            </button>

            {/* Trust Info */}
            <div className="mt-8 space-y-4 pt-6 border-t border-black/10">
              <div className="text-xs text-center flex flex-col gap-3 font-light opacity-70">
                <p>✓ <i>Checkout</i> terenkripsi (<i>secure encrypted</i>)</p>
                <p>✓ Terhubung otomatis dengan kurir lokal</p>
                <p>✓ Gratis retur dalam wilayah garansi 7 hari</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
