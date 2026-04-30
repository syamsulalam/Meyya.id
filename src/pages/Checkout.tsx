import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useStore } from '../store';
import { Loader2 } from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    let err;
    try { err = await r.json(); } catch { err = { error: 'Error' }; }
    throw new Error(err.error || 'Error');
  }
  return r.json();
};

export default function Checkout() {
  const { cart, user, clearCart, addToCart, savedAddresses } = useStore();
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
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>(savedAddresses[0]?.id || '');
  const [isAddressCollapsed, setIsAddressCollapsed] = useState(savedAddresses.length > 0);

  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{code: string, discount: number} | null>(null);
  const [orderBump, setOrderBump] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  const { data: recommendationsData } = useSWR('/api/products?limit=3', fetcher);
  const recommendedProducts = Array.isArray(recommendationsData) ? recommendationsData : (recommendationsData?.products || []);

  // Derive cart specs
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeightKilos = Math.ceil(cart.reduce((acc, item) => acc + (250 * item.quantity), 0) / 1000); // Temporary mock weight assumption (250g per item), rounded up to nearest KG for calculation

  const adminFee = paymentMethod === 'CC' ? 4500 : paymentMethod === 'QRIS' ? 1000 : 0;
  const shippingCost = selectedCourier ? selectedCourier.price : 0;
  
  // Calculate unique code if manual transfer
  const uniqueCode = paymentMethod === 'TRANSFER' ? Math.floor(Math.random() * 900) + 100 : 0;
  
  const totalAkhir = subtotal + shippingCost + adminFee - (appliedVoucher ? appliedVoucher.discount : 0) + uniqueCode;

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode === 'WELCOME20') {
      setAppliedVoucher({code: 'WELCOME20', discount: 50000});
      alert('Voucher berhasil digunakan!');
    } else {
      alert('Voucher tidak valid');
    }
  };

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
    let finalAddressSnapshot = '';

    if (isAddressCollapsed && selectedAddressId) {
      const selected = savedAddresses.find(a => a.id === selectedAddressId);
      if (!selected) return alert('Pilih alamat pengiriman yang valid');
      finalAddressSnapshot = `${selected.recipientName} (${selected.phone}) - ${selected.street}, ${selected.village_name}, ${selected.district_name}, ${selected.regency_name}, ${selected.province_name}`;
    } else {
      if (!selectedVill) return alert('Pilih Kelurahan tujuan dengan lengkap');
      if (address.street.length < 5) return alert('Detail alamat terlalu pendek');
      finalAddressSnapshot = `${address.name} (${address.phone}) - ${address.street}, ${selectedVill.name}, ${selectedDist?.name}, ${selectedReg?.name}, ${selectedProv?.name}`;
    }

    if (!selectedCourier) return alert('Pilih kurir ekspedisi pengiriman');
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          address_snapshot: finalAddressSnapshot,
          items: cart,
          shipping_cost: shippingCost,
          payment_method: paymentMethod,
          total_paid: totalAkhir,
          unique_code: uniqueCode,
          note: orderNote
        })
      });
      const data = await res.json();
      
      clearCart();
      // Redirect to new order page
      navigate(`/order/${data.order_id || '9981293'}`);
    } catch (e) {
      alert('Terjadi kesalahan sistem, akan disimulasikan sukses');
      clearCart();
      navigate(`/order/${Math.floor(Math.random() * 100000)}`);
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
          <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-2">
            <h2 className="text-xl font-medium">Destinasi Pengiriman</h2>
            {savedAddresses.length > 0 && (
               <button 
                 type="button" 
                 onClick={() => setIsAddressCollapsed(!isAddressCollapsed)}
                 className="text-xs uppercase tracking-widest font-semibold text-ink hover:text-gray-500 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-black/10"
               >
                 {isAddressCollapsed ? '+ Alamat Baru' : 'Daftar Alamat'}
               </button>
            )}
          </div>
          
          <div className="space-y-4">
            {isAddressCollapsed && savedAddresses.length > 0 ? (
              <div className="space-y-3">
                {savedAddresses.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'bg-black/5 border-black/30' : 'bg-white hover:bg-black/5 border-black/10'}`}>
                    <input 
                      type="radio" 
                      name="saved_address" 
                      value={addr.id} 
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-full bg-white flex shrink-0 items-center justify-center text-lg shadow-sm border border-black/5">{addr.icon}</div>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{addr.label}</span>
                        {selectedAddressId === addr.id && <span className="text-[9px] bg-ink text-white px-2 py-0.5 rounded uppercase tracking-wider">Terpilih</span>}
                      </div>
                      <p className="font-medium text-gray-700 mt-1">{addr.recipientName} ({addr.phone})</p>
                      <p className="text-gray-500 mt-0.5 line-clamp-2 text-xs">{addr.street}, {addr.village_name}, {addr.district_name}, {addr.regency_name}, {addr.province_name}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Nama Penerima</label>
                    <input required={!isAddressCollapsed} type="text" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">No WhatsApp</label>
                    <input required={!isAddressCollapsed} type="tel" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Provinsi</label>
                    <select 
                      required={!isAddressCollapsed}
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
                      required={!isAddressCollapsed}
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
                      required={!isAddressCollapsed}
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
                      required={!isAddressCollapsed}
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
                    required={!isAddressCollapsed} 
                    value={address.street} 
                    onChange={e => setAddress({...address, street: e.target.value.toUpperCase()})} 
                    className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:border-black/30 transition-colors uppercase text-sm"
                    placeholder="RT/RW, Nomor Rumah..."
                  />
                </div>
              </div>
            )}
            
            {/* Courier Selection Box */}
            <div className="pt-6 border-t border-black/5 mt-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Pilih Kurir Ekspedisi <span className="normal-case tracking-normal opacity-50">({totalWeightKilos} Kg)</span>
                {shippingLoading && <Loader2 size={12} className="animate-spin text-ink" />}
              </label>

              {(!selectedVill && !isAddressCollapsed) ? (
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

            {/* Payment Method Box */}
            <div className="pt-6 border-t border-black/5 mt-4">
               <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                 Metode Pembayaran
               </label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {[
                   { id: 'TRANSFER', name: 'Transfer Bank', desc: 'Verifikasi Otomatis' },
                   { id: 'QRIS', name: 'QRIS', desc: 'Bayar pakai E-Wallet (+Rp 1.000)' },
                   { id: 'VA', name: 'Virtual Account', desc: 'BCA, BNI, Mandiri' },
                   { id: 'CC', name: 'Kartu Kredit', desc: 'Visa, Master (+Rp 4.500)' },
                 ].map(pm => (
                   <label key={pm.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === pm.id ? 'bg-black/5 border-black/30 text-ink' : 'bg-white hover:bg-black/5 border-black/10 text-ink'}`}>
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="payment" 
                        value={pm.id} 
                        onChange={() => setPaymentMethod(pm.id)} 
                      />
                      <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === pm.id ? 'border-ink' : 'border-gray-300'}`}>
                        {paymentMethod === pm.id && <div className="w-2 h-2 bg-ink rounded-full" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-tight">{pm.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{pm.desc}</div>
                      </div>
                   </label>
                 ))}
               </div>
            </div>

            {/* Note & Custom Fields */}
            <div className="pt-4 mt-2">
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Pesan Pembeli (Opsional)</label>
              <textarea 
                value={orderNote} 
                onChange={e => setOrderNote(e.target.value)} 
                className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 min-h-[60px] focus:outline-none focus:border-black/30 transition-colors text-sm"
                placeholder="Mis: Tolong kirim pakai bubble wrap tebal ya kak"
              />
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
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/5 flex-shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <svg className="w-4 h-4 text-black/20" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  )}
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

          <div className="border-t border-black/5 pt-6 space-y-4 text-sm mt-4">
            
            {/* Promo Area */}
            {appliedVoucher ? (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center justify-between border border-emerald-100">
                <span className="text-xs font-semibold">{appliedVoucher.code}</span>
                <span className="text-xs font-bold">- Rp {appliedVoucher.discount.toLocaleString('id-ID')}</span>
                <button type="button" onClick={() => setAppliedVoucher(null)} className="text-emerald-900 hover:text-black">✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode Voucher/Promo" className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ink uppercase" />
                <button type="button" onClick={handleApplyVoucher} className="bg-black/5 hover:bg-black/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Apply</button>
              </div>
            )}

            {/* Order Bump Upsell */}
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl mt-6">
              <h3 className="text-[10px] uppercase font-bold text-orange-800 tracking-widest mb-3">Produk Lain yang Mungkin Anda Suka</h3>
              <div className="flex flex-col gap-3">
                {recommendedProducts.slice(0, 2).map((product: any) => {
                  const inCart = cart.find(c => c.product_id === product.id);
                  if (inCart) return null; // hide if already in cart
                  return (
                    <div key={product.id} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-orange-100/50 shadow-sm">
                       <div className="w-12 h-16 bg-black/5 rounded-md overflow-hidden flex-shrink-0">
                         <img src={product.images[0]} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                         <p className="text-xs font-semibold text-ink line-clamp-1">{product.name}</p>
                         <p className="text-xs text-orange-700 font-bold mt-1">Rp {product.price.toLocaleString('id-ID')}</p>
                       </div>
                       <button 
                         type="button" 
                         className="px-3 py-1.5 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase rounded-md hover:bg-orange-200 transition-colors"
                         onClick={() => {
                            addToCart({
                              product_id: product.id,
                              product_name: product.name,
                              color: product.colors[0]?.name || 'Default',
                              size: product.sizes[0] || 'Default',
                              price: product.price,
                              quantity: 1,
                              image_url: product.images[0]
                            });
                         }}
                       >
                         Tambah
                       </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal Barang</span>
                <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ongkos Kirim {selectedCourier && `(${selectedCourier.courier_name})`}</span>
                <span className="font-medium">{selectedCourier ? `Rp ${selectedCourier.price.toLocaleString('id-ID')}` : '-'}</span>
              </div>
              {adminFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 z-10 flex gap-1 items-center">Biaya Transaksi <span className="text-[9px] bg-black/5 px-1.5 rounded">{paymentMethod}</span></span>
                  <span className="font-medium">Rp {adminFee.toLocaleString('id-ID')}</span>
                </div>
              )}
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-600">
                  <span className="font-medium">Diskon Voucher</span>
                  <span className="font-medium">- Rp {appliedVoucher.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {uniqueCode > 0 && (
                <div className="flex justify-between text-red-500">
                  <span className="font-medium text-[10px] tracking-wide uppercase">Kode Unik Transfer</span>
                  <span className="font-medium">+ Rp {uniqueCode}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-4 border-t border-black/5">
                <span className="font-medium text-base">Total Bayar Akhir</span>
                <span className="font-bold text-3xl tracking-tight text-ink">Rp {totalAkhir.toLocaleString('id-ID')}</span>
              </div>
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
