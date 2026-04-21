import { User, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { Navigate, Link, useBlocker } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 w-full flex-1">
      
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

      <div className="flex items-end justify-between mb-8">
        <h1 className="text-3xl font-light font-heading">Profil (<i>Account</i>)</h1>
        {user.role === 'admin' && (
           <Link to="/admin" className="text-sm font-semibold uppercase tracking-widest hover:underline underline-offset-4">Masuk Dashboard Admin</Link>
        )}
      </div>
      
      <div className="glass-panel p-8 md:p-12 rounded-[40px]">
        <div className="flex items-center gap-6 mb-12 border-b border-black/10 pb-8">
          <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
            <User size={32} className="opacity-50" />
          </div>
          <div>
            <h2 className="text-2xl font-light mb-1">{user.name}</h2>
            <p className="opacity-60 text-sm tracking-widest uppercase">{user.role}</p>
          </div>
        </div>

        <form className="space-y-12">
          {/* Main Info */}
          <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10">Data Pribadi</h3>
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

          {/* Address Flow Section */}
          <div className="space-y-6">
             <h3 className="text-sm uppercase tracking-widest font-semibold pb-2 border-b border-black/10 flex items-center gap-2">
                <MapPin size={16} /> Alamat Pengiriman
             </h3>
             <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-4">
                
                {/* Step 1: Provinsi */}
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

                {/* Step 2: Kota / Kabupaten */}
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

                {/* Step 3: Kecamatan */}
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

                {/* Step 4: Kelurahan */}
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

                {/* Step 5: Detail Alamat */}
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
      </div>
    </div>
  );
}
