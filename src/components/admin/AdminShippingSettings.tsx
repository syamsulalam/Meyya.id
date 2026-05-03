import React, { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { MapPin, Save, Truck } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';

const COURIERS = ['JNE', 'SICEPAT', 'JNT', 'ANTERAJA', 'POS', 'TIKI', 'IDEXPRESS', 'LION'];

const publicFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data wilayah');
  return res.json();
};

export default function AdminShippingSettings() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast } = useStore();
  const { data: settings, isLoading } = useSWR('/api/admin/shipping-settings', fetcher);

  const [originVillageCode, setOriginVillageCode] = useState('');
  const [originVillageName, setOriginVillageName] = useState('');
  const [activeCouriers, setActiveCouriers] = useState<string[]>(['JNE', 'SICEPAT', 'JNT']);
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedReg, setSelectedReg] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const { data: provData } = useSWR('/api/regions/provinces?size=100', publicFetcher);
  const { data: regData } = useSWR(selectedProv ? `/api/regions/provinces/${selectedProv}/regencies?size=100` : null, publicFetcher);
  const { data: distData } = useSWR(selectedReg ? `/api/regions/regencies/${selectedReg}/districts?size=100` : null, publicFetcher);
  const { data: villData } = useSWR(selectedDist ? `/api/regions/districts/${selectedDist}/villages?size=100` : null, publicFetcher);

  const provinces = provData?.data || [];
  const regencies = regData?.data || [];
  const districts = distData?.data || [];
  const villages = villData?.data || [];

  useEffect(() => {
    if (settings) {
      setOriginVillageCode(settings.origin_village_code || '');
      setOriginVillageName(settings.origin_village_name || '');
      setActiveCouriers(Array.isArray(settings.active_couriers) ? settings.active_couriers : ['JNE', 'SICEPAT', 'JNT']);
    }
  }, [settings]);

  const toggleCourier = (courier: string) => {
    setActiveCouriers((prev) => prev.includes(courier) ? prev.filter((item) => item !== courier) : [...prev, courier]);
  };

  const applySelectedVillage = () => {
    const village = villages.find((item: any) => item.code === selectedVillage);
    if (!village) return;
    setOriginVillageCode(village.code);
    setOriginVillageName(village.name);
  };

  const saveSettings = async () => {
    try {
      const res = await authFetch('/api/admin/shipping-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_village_code: originVillageCode,
          origin_village_name: originVillageName,
          active_couriers: activeCouriers,
        }),
      });

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menyimpan pengiriman');
      mutate('/api/admin/shipping-settings');
      addToast('Setting pengiriman berhasil disimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light mb-2 flex items-center gap-2"><Truck size={24} /> Pengaturan Pengiriman</h2>
        <p className="text-sm font-light text-black/60">Kelola origin pengiriman dan kurir aktif untuk kalkulasi ongkir.</p>
      </div>

      {!isLoading && settings && !settings.api_key_configured && (
        <div className="bg-orange-50 text-orange-800 border border-orange-100 rounded-2xl p-4 text-sm">
          API_CO_ID_KEY belum dikonfigurasi. Kalkulasi ongkir akan gagal sampai key tersedia di Cloudflare Pages environment.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6 space-y-5">
          <h3 className="text-sm uppercase tracking-widest font-semibold flex items-center gap-2"><MapPin size={16} /> Origin Toko</h3>
          <div className="bg-white/60 border border-black/5 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Origin Aktif</p>
            <p className="text-sm font-semibold">{originVillageName || '-'}</p>
            <p className="text-xs font-mono text-black/50 mt-1">{originVillageCode || 'Belum dikonfigurasi'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Provinsi" value={selectedProv} onChange={(value) => { setSelectedProv(value); setSelectedReg(''); setSelectedDist(''); setSelectedVillage(''); }} options={provinces} />
            <Select label="Kota/Kabupaten" value={selectedReg} onChange={(value) => { setSelectedReg(value); setSelectedDist(''); setSelectedVillage(''); }} options={regencies} disabled={!selectedProv} />
            <Select label="Kecamatan" value={selectedDist} onChange={(value) => { setSelectedDist(value); setSelectedVillage(''); }} options={districts} disabled={!selectedReg} />
            <Select label="Kelurahan/Desa" value={selectedVillage} onChange={setSelectedVillage} options={villages} disabled={!selectedDist} />
          </div>

          <button onClick={applySelectedVillage} disabled={!selectedVillage} className="w-full bg-black/5 text-ink py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-black/10 disabled:opacity-40">
            Gunakan Desa Ini Sebagai Origin
          </button>
        </div>

        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6 space-y-5">
          <h3 className="text-sm uppercase tracking-widest font-semibold">Kurir Aktif</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COURIERS.map((courier) => {
              const selected = activeCouriers.includes(courier);
              return (
                <button
                  key={courier}
                  onClick={() => toggleCourier(courier)}
                  className={`py-3 rounded-xl border text-xs font-semibold tracking-widest transition-colors ${selected ? 'bg-ink text-white border-ink' : 'bg-white border-black/10 text-ink hover:bg-black/5'}`}
                >
                  {courier}
                </button>
              );
            })}
          </div>
          <div className="bg-white/60 border border-black/5 rounded-2xl p-4 text-xs text-black/60 leading-relaxed">
            Nama kurir dari API akan dicocokkan dengan daftar aktif di sini. Jika API mengembalikan nama yang berbeda, tambahkan alias kurir di kode `COURIERS`.
          </div>
          <button onClick={saveSettings} className="w-full bg-ink text-white py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-black/80 flex items-center justify-center gap-2">
            <Save size={14} /> Simpan Pengiriman
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: any[]; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-black/50 mb-2">{label}</label>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink disabled:opacity-40">
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>{option.name}</option>
        ))}
      </select>
    </div>
  );
}
