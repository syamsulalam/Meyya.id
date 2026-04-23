import { User, MapPin, Phone, Mail, CheckCircle2, Package, History, Eye, Ticket, HelpCircle, Heart } from 'lucide-react';
import { useStore } from '../store';
import { Navigate, Link, useBlocker } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Tooltip from '../components/Tooltip';

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'ID' },
  { code: '+60', flag: '🇲🇾', label: 'MY' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+673', flag: '🇧🇳', label: 'BN' },
];

function AutoSuggest({ 
  items, 
  value, 
  onChange, 
  placeholder, 
  disabled,
}: { 
  items: { id: number, name: string }[], 
  value: { id: number, name: string } | null, 
  onChange: (val: { id: number, name: string } | null) => void,
  placeholder: string,
  disabled?: boolean
}) {
  const [query, setQuery] = useState(value ? value.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setQuery(value ? value.name : '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleBlur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, query, value, items]);

  const filtered = items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (item: { id: number, name: string }) => {
    setQuery(item.name);
    onChange(item);
    setIsOpen(false);
  }

  const handleBlur = () => {
    if (isOpen) {
      if (!value || query.toLowerCase() !== value.name.toLowerCase()) {
        const strictMatch = items.find(i => i.name.toLowerCase() === query.trim().toLowerCase());
        if (strictMatch) {
          handleSelect(strictMatch);
        } else {
          setQuery(value ? value.name : ''); 
          if (!value && query !== '') onChange(null); 
        }
      }
      setIsOpen(false);
    }
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <input 
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (value) onChange(null); // Clear value if editing again
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white/80 border border-black/10 rounded-full py-3 px-4 outline-none focus:border-black/50 transition-colors text-sm"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg pb-1 text-sm top-full">
          {filtered.map(item => (
            <li 
              key={item.id} 
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-3 border-b border-gray-100 last:border-none hover:bg-black/5 cursor-pointer transition-colors text-gray-800"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Profile() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'akun' | 'status' | 'riwayat' | 'terakhir' | 'voucher' | 'bantuan' | 'rekomendasi'>('akun');
  
  const [countryCode, setCountryCode] = useState('+62');
  
  const [activeStep, setActiveStep] = useState(1);
  
  const [provinsiList, setProvinsiList] = useState<{id: number, name: string}[]>([]);
  const [kotaList, setKotaList] = useState<{id: number, name: string}[]>([]);
  const [kecamatanList, setKecamatanList] = useState<{id: number, name: string}[]>([]);
  const [kelurahanList, setKelurahanList] = useState<{id: number, name: string}[]>([]);

  const [selectedProvinsi, setSelectedProvinsi] = useState<{id: number, name: string} | null>(null);
  const [selectedKota, setSelectedKota] = useState<{id: number, name: string} | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<{id: number, name: string} | null>(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState<{id: number, name: string} | null>(null);
  const [alamatDetail, setAlamatDetail] = useState('');

  const [isSaved, setIsSaved] = useState(true);

  // Dynamic Loading
  useEffect(() => {
    import('../../json/provinsi.json')
      .then(m => {
        const data = m.default || m;
        setProvinsiList(data.map((d: any) => ({ id: d.provinces_id, name: d.name })));
      })
      .catch(e => console.error("Could not load provinsi", e));
  }, []);

  useEffect(() => {
    if (selectedProvinsi) {
      import('../../json/kabupaten-kota.json')
        .then(m => {
          const data = m.default || m;
          setKotaList(data.filter((d: any) => d.provinces_id === selectedProvinsi.id).map((d: any) => ({ id: d.city_id, name: d.name })));
        });
    } else {
      setKotaList([]);
    }
  }, [selectedProvinsi]);

  useEffect(() => {
    if (selectedKota) {
      import('../../json/kecamatan.json')
        .then(m => {
          const data = m.default || m;
          setKecamatanList(data.filter((d: any) => d.city_id === selectedKota.id).map((d: any) => ({ id: d.districts_id, name: d.name })));
        });
    } else {
      setKecamatanList([]);
    }
  }, [selectedKota]);

  useEffect(() => {
    if (selectedKecamatan) {
      import('../../json/kelurahan-desa.json')
        .then(m => {
          const data = m.default || m;
          setKelurahanList(data.filter((d: any) => d.districts_id === selectedKecamatan.id).map((d: any) => ({ id: d.village_id, name: d.name })));
        });
    } else {
      setKelurahanList([]);
    }
  }, [selectedKecamatan]);

  // Handle Unsaved Changes
  useEffect(() => {
    if (selectedProvinsi || selectedKota || selectedKecamatan || selectedKelurahan || alamatDetail) {
      setIsSaved(false);
    }
  }, [selectedProvinsi, selectedKota, selectedKecamatan, selectedKelurahan, alamatDetail]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isSaved && currentLocation.pathname !== nextLocation.pathname
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = () => {
    // In a real app, send api request to save here
    setIsSaved(true);
    alert('Perubahan data profil berhasil disimpan!');
    if (blocker.state === 'blocked') {
      blocker.proceed?.();
    }
  }

  const tabs = [
    { id: 'akun', label: 'Akun Saya', icon: <User size={16} /> },
    { id: 'status', label: 'Status Pesanan', icon: <Package size={16} /> },
    { id: 'riwayat', label: 'Riwayat Pesanan', icon: <History size={16} /> },
    { id: 'terakhir', label: 'Terakhir Dilihat', icon: <Eye size={16} /> },
    { id: 'voucher', label: 'Voucher', icon: <Ticket size={16} /> },
    { id: 'bantuan', label: 'Pusat Bantuan', icon: <HelpCircle size={16} /> },
    { id: 'rekomendasi', label: 'Rekomendasi', icon: <Heart size={16} /> },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 w-full flex-1">
      
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[32px] max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-light font-heading mb-3">Simpan Perubahan?</h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">Anda memiliki data profil yang belum disimpan. Apakah Anda ingin tetap meninggalkan halaman tanpa menyimpannya?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => blocker.proceed?.()} 
                className="flex-1 py-3 items-center justify-center rounded-full border border-black/20 text-gray-700 text-xs font-semibold uppercase tracking-widest hover:bg-black/5 transition-colors"
              >
                Abaikan
              </button>
              <button 
                onClick={() => blocker.reset?.()} 
                className="flex-1 py-3 items-center justify-center rounded-full bg-ink text-white text-xs font-semibold uppercase tracking-widest hover:bg-black/80 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-light font-heading mb-12 text-center text-ink">Profil (<i>Account</i>)</h1>
      
      <div className="glass-panel p-2 md:p-4 rounded-[32px] md:rounded-[48px] flex flex-col lg:flex-row gap-2 md:gap-4 shadow-xl border border-white/40">
        
        {/* Sidebar Menu */}
        <div className="w-full lg:w-28 bg-white/40 rounded-[24px] md:rounded-[36px] p-4 md:p-6 flex flex-col items-center flex-shrink-0 border border-black/5">
          <nav className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide justify-start md:justify-center items-center w-full sticky lg:top-28">
            {tabs.map((tab) => (
              <Tooltip key={tab.id} content={tab.label} position="right">
                <button
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === tab.id 
                      ? 'bg-ink text-white shadow-md scale-110' 
                      : 'text-gray-600 hover:bg-black/5 hover:scale-110'
                  }`}
                >
                  {tab.icon}
                </button>
              </Tooltip>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/60 rounded-[24px] md:rounded-[36px] p-6 lg:p-12 border border-black/5 min-h-[500px]">
            
            {activeTab === 'akun' && (
              <form className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10 flex items-center gap-2">
                     <User size={16} /> Data Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Nama Lengkap</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                        <input 
                          type="text" 
                          defaultValue={user.name}
                          className="w-full bg-white/50 border border-black/10 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-black/50 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                        <input 
                          type="email" 
                          defaultValue={user.email}
                          disabled
                          className="w-full bg-black/5 border border-transparent rounded-full py-3 pl-12 pr-4 opacity-70 cursor-not-allowed text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">No. WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative w-32 border border-black/10 bg-white/50 rounded-full overflow-hidden focus-within:border-black/50 transition-colors">
                        <select 
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full bg-transparent py-3 pl-4 pr-2 appearance-none outline-none text-sm font-medium z-10 relative cursor-pointer"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1 border border-black/10 bg-white/50 rounded-full focus-within:border-black/50 transition-colors">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                        <input 
                          type="tel" 
                          placeholder="Contoh: 8123456789"
                          className="w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10 flex items-center gap-2">
                      <MapPin size={16} /> Alamat Pengiriman
                   </h3>
                   <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-4">
                      
                      <div className={`transition-opacity ${activeStep >= 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
                          Langkah 1: Provinsi {selectedProvinsi && <CheckCircle2 size={14} className="text-green-600" />}
                        </label>
                        <AutoSuggest 
                          items={provinsiList} 
                          value={selectedProvinsi} 
                          placeholder="Ketik untuk mencari provinsi..."
                          onChange={(val) => {
                            setSelectedProvinsi(val);
                            setSelectedKota(null);
                            setSelectedKecamatan(null);
                            setSelectedKelurahan(null);
                            if (val) setActiveStep(2);
                            else setActiveStep(1);
                          }}
                        />
                      </div>

                      <div className={`transition-opacity ${activeStep >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 mt-4 flex items-center gap-2">
                          Langkah 2: Kota / Kabupaten {selectedKota && <CheckCircle2 size={14} className="text-green-600" />}
                        </label>
                        <AutoSuggest 
                          items={kotaList} 
                          value={selectedKota} 
                          placeholder="Ketik untuk mencari kota/kabupaten..."
                          onChange={(val) => {
                            setSelectedKota(val);
                            setSelectedKecamatan(null);
                            setSelectedKelurahan(null);
                            if (val) setActiveStep(3);
                            else setActiveStep(2);
                          }}
                        />
                      </div>

                      <div className={`transition-opacity ${activeStep >= 3 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 mt-4 flex items-center gap-2">
                          Langkah 3: Kecamatan {selectedKecamatan && <CheckCircle2 size={14} className="text-green-600" />}
                        </label>
                        <AutoSuggest 
                          items={kecamatanList} 
                          value={selectedKecamatan} 
                          placeholder="Ketik untuk mencari kecamatan..."
                          onChange={(val) => {
                            setSelectedKecamatan(val);
                            setSelectedKelurahan(null);
                            if (val) setActiveStep(4);
                            else setActiveStep(3);
                          }}
                        />
                      </div>

                      <div className={`transition-opacity ${activeStep >= 4 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 mt-4 flex items-center gap-2">
                          Langkah 4: Kelurahan/Desa {selectedKelurahan && <CheckCircle2 size={14} className="text-green-600" />}
                        </label>
                        <AutoSuggest 
                          items={kelurahanList} 
                          value={selectedKelurahan} 
                          placeholder="Ketik untuk mencari kelurahan/desa..."
                          onChange={(val) => {
                            setSelectedKelurahan(val);
                            if (val) setActiveStep(5);
                            else setActiveStep(4);
                          }}
                        />
                      </div>

                      <div className={`transition-opacity ${activeStep >= 5 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 mt-4 flex items-center gap-2">
                          Langkah 5: Detail Alamat & Kode Pos {alamatDetail.length > 5 && <CheckCircle2 size={14} className="text-green-600" />}
                        </label>
                        <textarea 
                          rows={3}
                          value={alamatDetail}
                          onChange={(e) => setAlamatDetail(e.target.value)}
                          placeholder="Masukkan nama jalan, nomor rumah, RT/RW, gang, dan kode pos..."
                          className="w-full bg-white/80 border border-black/10 rounded-2xl py-3 px-4 outline-none focus:border-black/50 resize-none text-sm"
                        ></textarea>
                      </div>
                   </div>
                </div>

                <div className="pt-8 text-center border-t border-black/10">
                  <button 
                    type="button" 
                    onClick={handleSave}
                    disabled={activeStep < 5 || alamatDetail.length < 5}
                    className="px-8 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan Perubahan Data
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'status' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Status Pesanan</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {['Belum Bayar', 'Dikemas', 'Dikirim', 'Perlu Dinilai'].map((status) => (
                    <div key={status} className="bg-white/40 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-black/5 cursor-pointer hover:bg-white/60 transition-colors">
                      <Package size={24} className="opacity-40" />
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-xs bg-black/5 text-ink px-2 py-1 rounded-full font-mono mt-1">0</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center text-gray-500 text-sm py-12 border border-dashed border-black/10 rounded-3xl">
                  Tidak ada pesanan aktif saat ini.
                </div>
              </div>
            )}

            {activeTab === 'riwayat' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Riwayat Pesanan</h3>
                <div className="space-y-4">
                  {[1,2].map(id => (
                    <div key={id} className="bg-white/40 p-6 rounded-3xl border border-black/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-mono bg-black/5 px-3 py-1 rounded-full">ORD-00{id}MEYYA</span>
                        <span className="text-xs text-green-600 font-medium">Selesai</span>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <div className="w-20 h-24 bg-black/5 rounded-xl flex items-center justify-center">
                          <Eye size={20} className="opacity-20" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">Pashmina Silk Premium</h4>
                          <p className="text-xs text-gray-500 mt-1">Warna: Hitam, Ukuran: All Size</p>
                          <p className="text-sm font-medium mt-2">Rp 129.000 <span className="text-xs font-normal text-gray-400">x 1</span></p>
                        </div>
                      </div>
                      <div className="border-t border-black/5 pt-4 flex justify-between items-center">
                        <span className="text-sm font-medium">Total: Rp 129.000</span>
                        <button className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors">Beli Lagi</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'terakhir' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Terakhir Dilihat</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[1,2].map(id => (
                    <div key={id} className="bg-white/40 p-4 rounded-3xl border border-black/5 flex flex-col bg-cover bg-center">
                      <div className="aspect-[3/4] bg-black/5 rounded-2xl mb-4" />
                      <h4 className="font-medium text-sm">Abaya Series</h4>
                      <p className="text-sm mt-1 mb-4">Rp 459.000</p>
                      <button className="text-xs border border-ink text-ink px-4 py-2 rounded-full hover:bg-ink hover:text-white transition-colors w-full mt-auto">Masukkan Keranjang</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'voucher' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Voucher Tersedia</h3>
                <div className="space-y-4">
                  <div className="flex bg-white/40 rounded-3xl overflow-hidden border border-black/5">
                    <div className="bg-ink text-white w-24 flex flex-col items-center justify-center p-4 border-r border-dashed border-white/40">
                      <span className="text-2xl font-light">15%</span>
                      <span className="text-[10px] uppercase tracking-widest mt-1">OFF</span>
                    </div>
                    <div className="p-4 flex-1 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-sm">Diskon Pelanggan Baru</h4>
                        <p className="text-xs text-gray-500 mt-1">Min. belanja Rp 200.000</p>
                        <p className="text-[10px] text-gray-400 mt-2">S&K Berlaku</p>
                      </div>
                      <button className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors">Klaim</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bantuan' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Pusat Bantuan & CS</h3>
                <div className="space-y-4 text-sm">
                  <a href="/faq" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
                    <span>Pertanyaan Umum (FAQ)</span>
                    <span className="opacity-50">→</span>
                  </a>
                  <a href="/shipping" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
                    <span>Info Pengiriman & Retur</span>
                    <span className="opacity-50">→</span>
                  </a>
                  <a href="/contact" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
                    <span>Hubungi Customer Service</span>
                    <span className="opacity-50">→</span>
                  </a>
                  
                  <div className="mt-8 p-6 bg-ink text-white rounded-3xl flex flex-col items-center text-center">
                    <HelpCircle size={32} className="opacity-50 mb-4" />
                    <h4 className="font-medium mb-2">Butuh bantuan langsung?</h4>
                    <p className="text-xs opacity-70 mb-6">CS kami aktif Senin-Jumat, Pukul 09:00 - 17:00 WIB.</p>
                    <button className="text-xs bg-white text-ink px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors">Chat Admin WhatsApp</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rekomendasi' && (
              <div>
                <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Kamu Mungkin Suka</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[1,2,3,4].map(id => (
                    <div key={id} className="bg-white/40 p-4 rounded-3xl border border-black/5 flex flex-col">
                      <div className="aspect-[3/4] bg-black/5 rounded-2xl mb-4" />
                      <h4 className="font-medium text-sm">Khimar Collection</h4>
                      <p className="text-sm mt-1">Rp 199.000</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
