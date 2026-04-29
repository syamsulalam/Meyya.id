import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, MapPin, Phone, Mail, CheckCircle2, Home, Briefcase, Building, Plus, Trash2 } from 'lucide-react';
import AutoSuggest from './AutoSuggest';
import { useBlocker } from 'react-router-dom';
import { useStore } from '../../store';

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'ID' },
  { code: '+60', flag: '🇲🇾', label: 'MY' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+673', flag: '🇧🇳', label: 'BN' },
];

export default function ProfileAccount({ user, setBlockerOpen }: { user: any, setBlockerOpen?: (open: boolean) => void }) {
  const { savedAddresses, addSavedAddress, removeSavedAddress } = useStore();
  const [countryCode, setCountryCode] = useState('+62');
  
  const [isAddingAddress, setIsAddingAddress] = useState(savedAddresses.length === 0);
  const [addressLabel, setAddressLabel] = useState('Rumah');
  const [addressIcon, setAddressIcon] = useState('🏠');
  const [addressRecipient, setAddressRecipient] = useState('');
  const [addressPhone, setAddressPhone] = useState('');

  const [activeStep, setActiveStep] = useState(1);
  
  const [provinsiList, setProvinsiList] = useState<{id: string, name: string}[]>([]);
  const [kotaList, setKotaList] = useState<{id: string, name: string}[]>([]);
  const [kecamatanList, setKecamatanList] = useState<{id: string, name: string}[]>([]);
  const [kelurahanList, setKelurahanList] = useState<{id: string, name: string}[]>([]);

  const [selectedProvinsi, setSelectedProvinsi] = useState<{id: string, name: string} | null>(null);
  const [selectedKota, setSelectedKota] = useState<{id: string, name: string} | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<{id: string, name: string} | null>(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState<{id: string, name: string} | null>(null);
  const [alamatDetail, setAlamatDetail] = useState('');

  const [isSaved, setIsSaved] = useState(true);
  const [profileName, setProfileName] = useState(user?.name || user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState('');

  // Fetch Profile Data
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user/profile/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setProfileName(data.user.name || user.name || user.fullName || '');
            const phone = data.user.phone_wa || '';
            const cc = COUNTRY_CODES.find(c => phone.startsWith(c.code))?.code || '+62';
            setCountryCode(cc);
            setProfilePhone(phone.replace(cc, ''));
            setTimeout(() => setIsSaved(true), 10);
          }
        });
    }
  }, [user?.id]);

  // Dynamic Loading from API
  useEffect(() => {
    fetch('/api/regions/provinces?size=100')
      .then(res => res.json())
      .then(data => {
        if (data.data) setProvinsiList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
      })
      .catch(e => console.error("Could not load provinces", e));
  }, []);

  useEffect(() => {
    if (selectedProvinsi && selectedProvinsi.id) {
      fetch(`/api/regions/provinces/${selectedProvinsi.id}/regencies?size=100`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setKotaList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
        });
    } else {
      setKotaList([]);
    }
  }, [selectedProvinsi]);

  useEffect(() => {
    if (selectedKota && selectedKota.id) {
      fetch(`/api/regions/regencies/${selectedKota.id}/districts?size=100`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setKecamatanList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
        });
    } else {
      setKecamatanList([]);
    }
  }, [selectedKota]);

  useEffect(() => {
    if (selectedKecamatan && selectedKecamatan.id) {
      fetch(`/api/regions/districts/${selectedKecamatan.id}/villages?size=100`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setKelurahanList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
        });
    } else {
      setKelurahanList([]);
    }
  }, [selectedKecamatan]);

  // Handle Unsaved Changes
  useEffect(() => {
    if (profileName || profilePhone) {
      // setIsSaved(false); // we removed strict unsaved block for profile because addresses are local
    }
  }, [profileName, profilePhone]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isSaved && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (setBlockerOpen) {
      setBlockerOpen(blocker.state === 'blocked');
    }
  }, [blocker.state, setBlockerOpen]);

  const handleSave = async () => {
    try {
      const payload = {
        name: profileName,
        phone_wa: countryCode + profilePhone,
        address: {
          province_code: selectedProvinsi?.id,
          province_name: selectedProvinsi?.name,
          regency_code: selectedKota?.id,
          regency_name: selectedKota?.name,
          district_code: selectedKecamatan?.id,
          district_name: selectedKecamatan?.name,
          village_code: selectedKelurahan?.id,
          village_name: selectedKelurahan?.name,
          street_address: alamatDetail,
        }
      };

      const res = await fetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone_wa: countryCode + profilePhone })
      });
      
      if (!res.ok) throw new Error("Gagal menyimpan data");
      
      setIsSaved(true);
      alert('Perubahan data profil berhasil disimpan!');
      if (blocker.state === 'blocked') {
        blocker.proceed?.();
      }
    } catch (e: any) {
      alert(e.message);
    }
  }

  const handleSaveAddress = () => {
    if (activeStep < 5 || alamatDetail.length < 5 || !addressRecipient || !addressPhone) {
      alert('Mohon lengkapi semua form alamat pengiriman');
      return;
    }
    const newAddr = {
      id: Math.random().toString(36).substr(2, 9),
      label: addressLabel,
      icon: addressIcon,
      recipientName: addressRecipient,
      phone: addressPhone,
      street: alamatDetail,
      province_code: selectedProvinsi?.id || '',
      province_name: selectedProvinsi?.name || '',
      regency_code: selectedKota?.id || '',
      regency_name: selectedKota?.name || '',
      district_code: selectedKecamatan?.id || '',
      district_name: selectedKecamatan?.name || '',
      village_code: selectedKelurahan?.id || '',
      village_name: selectedKelurahan?.name || ''
    };
    addSavedAddress(newAddr);
    setIsAddingAddress(false);
    
    // reset
    setAddressRecipient('');
    setAddressPhone('');
    setSelectedProvinsi(null);
    setSelectedKota(null);
    setSelectedKecamatan(null);
    setSelectedKelurahan(null);
    setAlamatDetail('');
    setActiveStep(1);
    setIsSaved(true); // Treat add address as saved automatically
    alert('Alamat berhasil ditambahkan!');
  };

  return (
    <>
      {blocker.state === 'blocked' && createPortal(
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
                type="button"
                onClick={() => {
                  handleSave().then(() => blocker.proceed?.());
                  setIsSaved(true); // force save complete in UI if unmounted
                }} 
                className="flex-1 py-3 items-center justify-center rounded-full bg-ink text-white text-xs font-semibold uppercase tracking-widest hover:bg-black/80 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
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
                  defaultValue={user?.email || user?.primaryEmailAddress?.emailAddress || ''}
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
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Contoh: 8123456789"
                  className="w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="pt-2">
            <button type="button" onClick={handleSave} className="px-6 py-2.5 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors">
              Simpan Data Pribadi
            </button>
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-black/10">
           <h3 className="text-sm uppercase tracking-widest font-semibold flex items-center justify-between pb-2 border-b border-black/5">
              <span className="flex items-center gap-2"><MapPin size={16} /> Daftar Alamat Pengiriman</span>
              {!isAddingAddress && (
                <button type="button" onClick={() => setIsAddingAddress(true)} className="flex items-center gap-1 text-[10px] bg-black/5 hover:bg-black/10 px-3 py-1.5 rounded-full transition-colors">
                  <Plus size={12} /> Tambah Baru
                </button>
              )}
           </h3>

           {!isAddingAddress && savedAddresses.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {savedAddresses.map(addr => (
                 <div key={addr.id} className="p-5 border border-black/10 bg-white/50 rounded-3xl relative group">
                   <div className="flex gap-3 items-start">
                     <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xl shrink-0">{addr.icon}</div>
                     <div className="flex-1">
                       <h4 className="font-semibold text-ink text-sm flex items-center gap-2">{addr.label}</h4>
                       <p className="text-sm mt-1 text-gray-800 font-medium">{addr.recipientName} ({addr.phone})</p>
                       <p className="text-xs text-gray-500 mt-1 line-clamp-3">{addr.street}, {addr.village_name}, {addr.district_name}, {addr.regency_name}, {addr.province_name}</p>
                     </div>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => removeSavedAddress(addr.id)}
                     className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                     title="Hapus Alamat"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               ))}
             </div>
           )}

           {isAddingAddress && (
             <div className="glass-panel p-6 rounded-3xl bg-white/40 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <h4 className="text-sm font-semibold">Tambah Alamat Baru</h4>
                  {savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setIsAddingAddress(false)} className="text-xs text-gray-500 hover:text-black">Batal</button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Label Alamat</label>
                    <input type="text" value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="Contoh: Rumah, Kantor..." className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Pilih Ikon</label>
                    <div className="flex gap-2 p-1 bg-black/5 rounded-xl">
                       {['🏠', '🏢', 'Apartemen'].map(ic => {
                         const rawIcon = ic === 'Apartemen' ? '🏗️' : ic;
                         return (
                           <button 
                             key={ic} type="button" 
                             onClick={() => setAddressIcon(rawIcon)}
                             className={`flex-1 py-1.5 rounded-lg text-lg transition-colors ${addressIcon === rawIcon ? 'bg-white shadow' : 'hover:bg-black/5'}`}
                           >
                             {rawIcon}
                           </button>
                         )
                       })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Nama Penerima</label>
                    <input type="text" value={addressRecipient} onChange={e => setAddressRecipient(e.target.value)} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">No WA Penerima</label>
                    <input type="tel" value={addressPhone} onChange={e => setAddressPhone(e.target.value)} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" />
                  </div>
                </div>
                
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

              <div className="pt-4 border-t border-black/5 text-right">
                <button 
                  type="button" 
                  onClick={handleSaveAddress}
                  disabled={activeStep < 5 || alamatDetail.length < 5 || !addressRecipient || !addressPhone}
                  className="px-6 py-2.5 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tambah Ke Daftar Alamat
                </button>
              </div>
           </div>
           )}
        </div>
      </form>
    </>
  );
}
