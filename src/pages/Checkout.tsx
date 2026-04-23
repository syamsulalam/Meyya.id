import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useStore } from '../store';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Checkout() {
  const { cart, user, clearCart } = useStore();
  const navigate = useNavigate();
  
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: ''
  });

  const [selectedProv, setSelectedProv] = useState<{code: string, name: string} | null>(null);
  const [selectedReg, setSelectedReg] = useState<{code: string, name: string} | null>(null);
  const [selectedDist, setSelectedDist] = useState<{code: string, name: string} | null>(null);
  const [selectedVill, setSelectedVill] = useState<{code: string, name: string, postal_codes?: string[]} | null>(null);
  
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  // Derive cart specs
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeightKilos = Math.ceil(cart.reduce((acc, item) => acc + (250 * item.quantity), 0) / 1000); // Temporary mock weight assumption (250g per item), rounded up to nearest KG for calculation

  // API Caching hooks
  const { data: provData } = useSWR('/api/regions/provinces?size=100', fetcher);
  const provinces = provData?.data || [];

  const { data: regData } = useSWR(selectedProv ? `/api/regions/provinces/${selectedProv.code}/regencies?size=100` : null, fetcher);
  const regencies = regData?.data || [];

  const { data: distData } = useSWR(selectedReg ? `/api/regions/regencies/${selectedReg.code}/districts?size=100` : null, fetcher);
  const districts = distData?.data || [];

  const { data: villData } = useSWR(selectedDist ? `/api/regions/districts/${selectedDist.code}/villages?size=100` : null, fetcher);
  const villages = villData?.data || [];

  useEffect(() => {
    if (cart.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [cart, navigate, orderComplete]);

  // When village changes, fetch shipping options!
  useEffect(() => {
    if (selectedVill && selectedVill.code) {
      const getShipping = async () => {
        setShippingLoading(true);
        setCouriers([]);
        setSelectedCourier(null);
        try {
          const res = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destination_village_code: selectedVill.code,
              weight: totalWeightKilos > 0 ? totalWeightKilos : 1
            })
          });
          const data = await res.json();
          if (data.status === 'success' && data.result) {
            setCouriers(data.result);
          }
        } catch (e) {
          console.error("Failed to load shipping");
        } finally {
          setShippingLoading(false);
        }
      };
      getShipping();
    }
  }, [selectedVill, totalWeightKilos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVill) return alert('Pilih Kelurahan tujuan dengan lengkap');
    if (!selectedCourier) return alert('Pilih kurir ekspedisi pengiriman');
    
    setLoading(true);
    const fullAddressLabel = `${address.street}, ${selectedVill.name}, ${selectedDist?.name}, ${selectedReg?.name}, ${selectedProv?.name}`;
    const addressSnapshot = `${address.name} (${address.phone}) - ${fullAddressLabel}`;
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          address_snapshot: addressSnapshot,
          items: cart,
          shipping_cost: selectedCourier.price
        })
      });
      const data = await res.json();
      
      clearCart();
      setOrderComplete(data);
    } catch (e) {
      alert('Terjadi kesalahan sistem');
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
        <h1 className="text-3xl font-light mb-8 font-heading"><i>Checkout</i> Ekspedisi</h1>
        <form id="checkout-form" onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-[2rem] space-y-6">
          <h2 className="text-xl font-medium mb-4 border-b border-black/5 pb-2">Destinasi Pengiriman</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Nama Penerima</label>
                <input required type="text" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">No WhatsApp</label>
                <input required type="tel" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Provinsi</label>
                <select 
                  required 
                  value={selectedProv?.code || ''} 
                  onChange={e => {
                     const p = provinces.find((x: any) => x.code === e.target.value);
                     setSelectedProv(p);
                     setSelectedReg(null);
                     setSelectedDist(null);
                     setSelectedVill(null);
                     setSelectedCourier(null);
                  }} 
                  className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-black/30 transition-colors text-sm"
                >
                  <option value="" disabled>-- Pilih --</option>
                  {provinces.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Kota / Kabupaten</label>
                <select 
                  required 
                  disabled={!selectedProv}
                  value={selectedReg?.code || ''} 
                  onChange={e => {
                     const r = regencies.find((x: any) => x.code === e.target.value);
                     setSelectedReg(r);
                     setSelectedDist(null);
                     setSelectedVill(null);
                     setSelectedCourier(null);
                  }} 
                  className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-black/30 transition-colors text-sm disabled:opacity-50"
                >
                  <option value="" disabled>-- Pilih --</option>
                  {regencies.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Kecamatan</label>
                <select 
                  required 
                  disabled={!selectedReg}
                  value={selectedDist?.code || ''} 
                  onChange={e => {
                     const d = districts.find((x: any) => x.code === e.target.value);
                     setSelectedDist(d);
                     setSelectedVill(null);
                     setSelectedCourier(null);
                  }} 
                  className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-black/30 transition-colors text-sm disabled:opacity-50"
                >
                  <option value="" disabled>-- Pilih --</option>
                  {districts.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Kelurahan / Desa</label>
                <select 
                  required 
                  disabled={!selectedDist}
                  value={selectedVill?.code || ''} 
                  onChange={e => {
                     const v = villages.find((x: any) => x.code === e.target.value);
                     setSelectedVill(v);
                  }} 
                  className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-black/30 transition-colors text-sm disabled:opacity-50"
                >
                  <option value="" disabled>-- Pilih --</option>
                  {villages.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 mt-4">Jalan / Gedung / Detail Lengkap</label>
              <textarea 
                required 
                value={address.street} 
                onChange={e => setAddress({...address, street: e.target.value.toUpperCase()})} 
                className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:border-black/30 transition-colors uppercase text-sm"
                placeholder="RT/RW, Nomor Rumah..."
              />
            </div>
            
            {/* Courier Selection Box */}
            <div className="pt-6 border-t border-black/5 mt-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Pilih Ekspedisi <span className="normal-case tracking-normal opacity-50">({totalWeightKilos} Kg)</span>
                {shippingLoading && <Loader2 size={12} className="animate-spin text-ink" />}
              </label>

              {(!selectedVill) ? (
                 <div className="text-xs text-gray-400 bg-white/50 p-4 rounded-xl text-center border border-dashed border-black/10">
                   Selesaikan pengisian Form Alamat hingga baris Kelurahan/Desa untuk melihat ongkos kirim resmi ke daerah Anda.
                 </div>
              ) : couriers.length === 0 && !shippingLoading ? (
                 <div className="text-xs text-red-500 bg-red-50 p-4 rounded-xl text-center">
                   Maaf, tidak ada kurir yang tersedia menuju lokasi Anda. Hubungi Customer Service kami.
                 </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {couriers.map((c, i) => (
                    <label key={i} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedCourier?.courier_code === c.courier_code && selectedCourier?.price === c.price ? 'bg-ink text-white border-transparent shadow-lg' : 'bg-white hover:bg-black/5 border-black/10 text-ink'}`}>
                       <input 
                         type="radio" 
                         className="hidden" 
                         name="courier" 
                         value={c.courier_code} 
                         onChange={() => setSelectedCourier(c)} 
                       />
                       <div className="flex items-center gap-3">
                         <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCourier?.courier_code === c.courier_code && selectedCourier?.price === c.price ? 'border-white' : 'border-gray-300'}`}>
                           {selectedCourier?.courier_code === c.courier_code && selectedCourier?.price === c.price && <div className="w-2 h-2 bg-white rounded-full" />}
                         </div>
                         <div>
                           <div className="font-semibold text-sm">{c.courier_name}</div>
                           {c.estimation && <div className={`text-[10px] ${selectedCourier?.courier_code === c.courier_code && selectedCourier?.price === c.price ? 'text-white/70' : 'text-gray-500'}`}>Estimasi: {c.estimation}</div>}
                         </div>
                       </div>
                       <div className="font-bold">
                         Rp {c.price.toLocaleString('id-ID')}
                       </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </form>
      </div>
      
      {/* Detail Kanan */}
      <div>
        <div className="glass-panel p-6 md:p-8 rounded-[2rem] sticky top-24 shadow-xl">
          <h2 className="text-xl font-medium mb-6">Ringkasan Pesanan</h2>
          
          <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2">
            {cart.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/5 flex-shrink-0">
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-medium line-clamp-1">{item.product_name}</p>
                  <p className="text-gray-500 opacity-80">{item.color} | {item.size} x{item.quantity}</p>
                </div>
                <div className="text-xs font-semibold">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 pt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal Barang</span>
              <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ongkos Kirim {selectedCourier && `(${selectedCourier.courier_name})`}</span>
              <span className="font-medium">{selectedCourier ? `Rp ${selectedCourier.price.toLocaleString('id-ID')}` : '-'}</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-black/5">
              <span className="font-medium text-base">Total Bayar Akhir</span>
              <span className="font-bold text-3xl tracking-tight text-ink">Rp {(subtotal + (selectedCourier?.price || 0)).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading || !selectedCourier}
            className="w-full bg-ink text-white py-4 rounded-full text-xs font-bold tracking-[0.2em] uppercase mt-8 disabled:opacity-40 hover:bg-black/80 transition-colors shadow-2xl"
          >
            {loading ? 'Memvalidasi Pesanan...' : 'Buat Pesanan & Bayar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
