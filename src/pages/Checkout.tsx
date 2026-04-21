import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function Checkout() {
  const { cart, user, clearCart } = useStore();
  const navigate = useNavigate();
  
  const [shippingCosts, setShippingCosts] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    if (cart.length === 0 && !orderComplete) {
      navigate('/cart');
    }
    fetch('/api/shipping-costs')
      .then(res => res.json())
      .then(data => setShippingCosts(data));
  }, [cart, navigate, orderComplete]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    const cost = shippingCosts.find(c => c.destination_city === city)?.cost || 0;
    setShippingCost(cost);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) return alert('Pilih kota tujuan');
    
    setLoading(true);
    const addressSnapshot = `${address.name} (${address.phone}) - ${address.street}, ${selectedCity}`;
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          address_snapshot: addressSnapshot,
          items: cart,
          shipping_cost: shippingCost
        })
      });
      const data = await res.json();
      
      clearCart();
      setOrderComplete(data);
    } catch (e) {
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 md:p-12 rounded-[2rem]">
          <h1 className="text-3xl font-heading font-light mb-4 text-green-600">Pesanan Berhasil</h1>
          <p className="text-gray-500 mb-8">Terima kasih atas pesanan Anda. Silakan selesaikan pembayaran.</p>
          
          <div className="bg-black/5 rounded-2xl p-6 mb-8 text-left">
            <p className="text-sm text-gray-500 mb-2">ID Pesanan: {orderComplete.order_id}</p>
            <p className="text-sm font-medium mb-4">Transfer tepat hingga 3 digit terakhir untuk verifikasi instan.</p>
            
            <div className="flex items-center justify-between py-4 border-y border-black/10 my-4">
              <span className="text-xl">Total Transfer</span>
              <span className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-1">
                <span className="text-xl text-black">Rp</span> 
                {Math.floor(orderComplete.total_paid / 1000).toLocaleString('id-ID')}
                <span className="text-black/60">.{orderComplete.unique_code.toString().padStart(3, '0')}</span> 
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mt-4">
              <p className="mb-1">Transfer ke rekening QRIS Statis atau Bank berikut:</p>
              <p className="font-medium">BCA 1234567890 a.n Meyya.id</p>
            </div>
          </div>
          
          <button onClick={() => navigate('/')} className="glass-button w-full sm:w-auto">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="text-3xl font-light mb-8 font-heading"><i>Checkout</i></h1>
        <form id="checkout-form" onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-[2rem] space-y-6">
          <h2 className="text-xl font-medium mb-4 border-b border-black/5 pb-2">Alamat Pengiriman</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Nama Penerima</label>
              <input required type="text" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="w-full bg-white/60 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">No WhatsApp</label>
              <input required type="tel" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full bg-white/60 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Kota/Kabupaten</label>
              <div className="relative">
                <select required value={selectedCity} onChange={handleCityChange} className="w-full bg-white/60 border border-black/10 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-black/30 transition-colors">
                  <option value="" disabled>Pilih Kota</option>
                  {shippingCosts.map(c => (
                    <option key={c.id} value={c.destination_city}>{c.destination_city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Detail Alamat</label>
              <textarea 
                required 
                value={address.street} 
                onChange={e => setAddress({...address, street: e.target.value.toUpperCase()})} 
                className="w-full bg-white/60 border border-black/10 rounded-xl px-4 py-3 min-h-[100px] focus:outline-none focus:border-black/30 transition-colors uppercase"
                placeholder="NAMA JALAN, RT/RW, BLOK..."
              />
            </div>
          </div>
        </form>
      </div>
      
      <div>
        <div className="glass-panel p-6 md:p-8 rounded-[2rem] sticky top-24">
          <h2 className="text-xl font-medium mb-6">Ringkasan Pesanan</h2>
          
          <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
            {cart.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium line-clamp-1">{item.product_name}</p>
                  <p className="text-gray-500">{item.color} | {item.size} x{item.quantity}</p>
                </div>
                <div className="text-sm font-medium">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 pt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ongkos Kirim {selectedCity ? `(${selectedCity})` : ''}</span>
              <span>Rp {shippingCost ? shippingCost.toLocaleString('id-ID') : 0}</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-black/5">
              <span className="font-medium text-base">Total Pembayaran</span>
              <span className="font-medium text-2xl">Rp {(subtotal + shippingCost).toLocaleString('id-ID')}</span>
            </div>
            <p className="text-xs text-right text-gray-400 mt-1">*Akan ditambahkan 3 digit kode unik</p>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full glass-button py-4 text-base mt-8 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Buat Pesanan & Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
