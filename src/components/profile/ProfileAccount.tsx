import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, MapPin, Phone, Mail, CheckCircle2 } from 'lucide-react';
import AutoSuggest from './AutoSuggest';
import { useBlocker } from 'react-router-dom';

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'ID' },
  { code: '+60', flag: '🇲🇾', label: 'MY' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+673', flag: '🇧🇳', label: 'BN' },
];

export default function ProfileAccount({ user, setBlockerOpen }: { user: any, setBlockerOpen?: (open: boolean) => void }) {
  const [countryCode, setCountryCode] = useState('+62');
  
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
            setProfileName(data.user.name || data.address?.recipient_name || user.name || user.fullName || '');
            const phone = data.user.phone_wa || '';
            const cc = COUNTRY_CODES.find(c => phone.startsWith(c.code))?.code || '+62';
            setCountryCode(cc);
            setProfilePhone(phone.replace(cc, ''));
          }
          if (data.address) {
            setSelectedProvinsi({ id: data.address.province_code, name: data.address.province_name });
            setSelectedKota({ id: data.address.regency_code, name: data.address.regency_name });
            setSelectedKecamatan({ id: data.address.district_code, name: data.address.district_name });
            setSelectedKelurahan({ id: data.address.village_code, name: data.address.village_name });
            setAlamatDetail(data.address.street_address || '');
            setActiveStep(5);
            
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
    if (selectedProvinsi || selectedKota || selectedKecamatan || selectedKelurahan || alamatDetail || profileName || profilePhone) {
      setIsSaved(false);
    }
  }, [selectedProvinsi, selectedKota, selectedKecamatan, selectedKelurahan, alamatDetail, profileName, profilePhone]);

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
        body: JSON.stringify(payload)
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
    </>
  );
}
