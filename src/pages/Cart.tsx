import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../store';

export default function Cart() {
  const { cart, removeFromCart } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
            {cart.map((item, index) => (
              <div key={index} className="flex gap-4 md:gap-6 py-6 border-b border-black/5 last:border-0">
                <Link to={`/product/${item.product_id}`} className="w-24 md:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                  <img 
                    src={item.image_url} 
                    alt={item.product_name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/product/${item.product_id}`} className="font-medium text-lg leading-tight hover:underline">
                        {item.product_name}
                      </Link>
                      <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Warna: {item.color}</p>
                    <p className="text-sm text-gray-500">Ukuran: {item.size}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4">
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-medium text-lg">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
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
                <span className="text-gray-500">Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-black/5">
                <span className="text-gray-500">Pengiriman</span>
                <span className="text-gray-500 text-right">Dihitung di Checkout</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-medium text-base">Total</span>
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
                <p>✓ Bebas ongkir pesanan di atas Rp 500.000</p>
                <p>✓ Gratis retur dalam wilayah garansi 7 hari</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
