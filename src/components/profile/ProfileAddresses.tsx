import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import useSWR from 'swr';
import { CheckCircle2, MapPin, Plus, Trash2 } from 'lucide-react';
import AutoSuggest from './AutoSuggest';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';

const formatPhoneDigits = (value: string) => value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

export default function ProfileAddresses({ user }: { user: any }) {
  const authFetch = useAuthFetch();
  const fetcher = useAuthFetcher();
  const { addToast, showConfirm } = useStore();
  const { data: dbAddresses, mutate: mutateAddresses } = useSWR(user?.id ? `/api/user/addresses/${user.id}` : null, fetcher);
  const { data: profileData } = useSWR(user?.id ? `/api/user/profile/${user.id}` : null, fetcher);
  const savedAddresses = Array.isArray(dbAddresses) ? dbAddresses : [];
  const profileUser = profileData?.user || {};
  const defaultRecipientName = (
    profileUser.name ||
    [profileUser.first_name, profileUser.last_name].filter(Boolean).join(' ') ||
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  ).trim();
  const defaultRecipientPhone = formatPhoneDigits(profileUser.phone_wa || user?.unsafeMetadata?.meyya_phone_wa || '');

  const [isAddingAddress, setIsAddingAddress] = useState(false);
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

  useEffect(() => {
    if (savedAddresses.length > 0 && isAddingAddress && !addressRecipient && !alamatDetail) {
      setIsAddingAddress(false);
    }
  }, [savedAddresses.length]);

  useEffect(() => {
    fetch('/api/regions/provinces?size=100')
      .then(res => res.json())
      .then(data => {
        if (data.data) setProvinsiList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
      })
      .catch(e => console.error('Could not load provinces', e));
  }, []);

  useEffect(() => {
    if (selectedProvinsi?.id) {
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
    if (selectedKota?.id) {
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
    if (selectedKecamatan?.id) {
      fetch(`/api/regions/districts/${selectedKecamatan.id}/villages?size=100`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setKelurahanList(data.data.map((d: any) => ({ id: d.code, name: d.name })));
        });
    } else {
      setKelurahanList([]);
    }
  }, [selectedKecamatan]);

  const handleSaveAddress = async () => {
    const effectiveRecipientName = addressRecipient.trim() || defaultRecipientName;
    const effectiveRecipientPhone = (addressPhone || defaultRecipientPhone).replace(/\s/g, '');

    if (activeStep < 5 || alamatDetail.length < 5 || !effectiveRecipientName || !effectiveRecipientPhone) {
      addToast('Mohon lengkapi semua form alamat pengiriman', 'error');
      return;
    }

    const newAddr = {
      label: addressLabel,
      icon: addressIcon,
      recipient_name: effectiveRecipientName,
      recipient_phone: effectiveRecipientPhone,
      street_address: alamatDetail,
      province_code: selectedProvinsi?.id || '',
      province_name: selectedProvinsi?.name || '',
      regency_code: selectedKota?.id || '',
      regency_name: selectedKota?.name || '',
      district_code: selectedKecamatan?.id || '',
      district_name: selectedKecamatan?.name || '',
      village_code: selectedKelurahan?.id || '',
      village_name: selectedKelurahan?.name || '',
      is_default: savedAddresses.length === 0,
    };

    try {
      const res = await authFetch(`/api/user/addresses/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddr),
      });
      if (!res.ok) throw new Error('Gagal menyimpan alamat');

      mutateAddresses();
      setIsAddingAddress(false);
      setAddressRecipient('');
      setAddressPhone('');
      setSelectedProvinsi(null);
      setSelectedKota(null);
      setSelectedKecamatan(null);
      setSelectedKelurahan(null);
      setAlamatDetail('');
      setActiveStep(1);
      addToast('Alamat berhasil ditambahkan!', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const removeSavedAddress = async (id: string) => {
    showConfirm({
      title: 'Hapus Alamat',
      message: 'Alamat ini akan dihapus dari daftar alamat pengiriman Anda.',
      confirmLabel: 'Hapus',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/user/addresses/${user.id}/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus');
          mutateAddresses();
          addToast('Alamat berhasil dihapus!', 'success');
        } catch (e: any) {
          addToast(e.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h3 className="text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
            <MapPin size={16} /> Alamat Pengiriman
          </h3>
          <p className="text-sm text-black/55 mt-2">Tambahkan alamat agar checkout bisa menghitung ongkir dan membuat pesanan.</p>
        </div>
        {!isAddingAddress && (
          <button type="button" onClick={() => setIsAddingAddress(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors">
            <Plus size={14} /> Tambah Alamat
          </button>
        )}
      </div>

      {!isAddingAddress && savedAddresses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white/50 p-8 text-center">
          <MapPin size={28} className="mx-auto mb-4 text-black/35" />
          <h4 className="font-medium text-ink mb-2">Belum ada alamat pengiriman</h4>
          <p className="text-sm text-black/55 mb-6">Isi alamat dulu supaya Anda bisa belanja dan melihat ongkos kirim saat checkout.</p>
          <button type="button" onClick={() => setIsAddingAddress(true)} className="px-6 py-3 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors">
            Isi Alamat Sekarang
          </button>
        </div>
      )}

      {!isAddingAddress && savedAddresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedAddresses.map((addr: any) => (
            <div key={addr.id} className="p-5 border border-black/10 bg-white/50 rounded-3xl relative group">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xl shrink-0">{addr.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink text-sm">{addr.label}</h4>
                  <p className="text-sm mt-1 text-gray-800 font-medium">{addr.recipient_name} ({formatPhoneDigits(addr.recipient_phone || '')})</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{addr.street_address}, {addr.village_name}, {addr.district_name}, {addr.regency_name}, {addr.province_name}</p>
                </div>
              </div>
              <button type="button" onClick={() => removeSavedAddress(addr.id)} className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100" title="Hapus Alamat">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Label Alamat</label>
              <input type="text" value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="Contoh: Rumah, Kantor..." className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Pilih Ikon</label>
              <div className="flex gap-2 p-1 bg-black/5 rounded-xl">
                {['🏠', '🏢', '🏗️'].map(ic => (
                  <button key={ic} type="button" onClick={() => setAddressIcon(ic)} className={`flex-1 py-1.5 rounded-lg text-lg transition-colors ${addressIcon === ic ? 'bg-white shadow' : 'hover:bg-black/5'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Nama Penerima</label>
              <input type="text" value={addressRecipient} onChange={e => setAddressRecipient(e.target.value)} placeholder={defaultRecipientName || 'Nama penerima'} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" />
              {defaultRecipientName && !addressRecipient && (
                <p className="mt-1.5 text-[10px] text-black/45">Jika dikosongkan, penerima memakai nama profil: {defaultRecipientName}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">No WA Penerima</label>
              <input type="tel" value={addressPhone} onChange={(e) => setAddressPhone(formatPhoneDigits(e.target.value))} className="w-full bg-black/5 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:border-black/30 transition-colors text-sm" placeholder={defaultRecipientPhone || 'Contoh: 0812 3456 7890'} />
              {defaultRecipientPhone && !addressPhone && (
                <p className="mt-1.5 text-[10px] text-black/45">Jika dikosongkan, nomor penerima memakai WA profil: {defaultRecipientPhone}</p>
              )}
            </div>
          </div>

          <AddressStep active={activeStep >= 1} label="Langkah 1: Provinsi" done={Boolean(selectedProvinsi)}>
            <AutoSuggest items={provinsiList} value={selectedProvinsi} placeholder="Ketik untuk mencari provinsi..." onChange={(val) => {
              setSelectedProvinsi(val);
              setSelectedKota(null);
              setSelectedKecamatan(null);
              setSelectedKelurahan(null);
              setActiveStep(val ? 2 : 1);
            }} />
          </AddressStep>

          <AddressStep active={activeStep >= 2} label="Langkah 2: Kota / Kabupaten" done={Boolean(selectedKota)}>
            <AutoSuggest items={kotaList} value={selectedKota} placeholder="Ketik untuk mencari kota/kabupaten..." onChange={(val) => {
              setSelectedKota(val);
              setSelectedKecamatan(null);
              setSelectedKelurahan(null);
              setActiveStep(val ? 3 : 2);
            }} />
          </AddressStep>

          <AddressStep active={activeStep >= 3} label="Langkah 3: Kecamatan" done={Boolean(selectedKecamatan)}>
            <AutoSuggest items={kecamatanList} value={selectedKecamatan} placeholder="Ketik untuk mencari kecamatan..." onChange={(val) => {
              setSelectedKecamatan(val);
              setSelectedKelurahan(null);
              setActiveStep(val ? 4 : 3);
            }} />
          </AddressStep>

          <AddressStep active={activeStep >= 4} label="Langkah 4: Kelurahan/Desa" done={Boolean(selectedKelurahan)}>
            <AutoSuggest items={kelurahanList} value={selectedKelurahan} placeholder="Ketik untuk mencari kelurahan/desa..." onChange={(val) => {
              setSelectedKelurahan(val);
              setActiveStep(val ? 5 : 4);
            }} />
          </AddressStep>

          <AddressStep active={activeStep >= 5} label="Langkah 5: Detail Alamat & Kode Pos" done={alamatDetail.length > 5}>
            <textarea rows={3} value={alamatDetail} onChange={(e) => setAlamatDetail(e.target.value)} placeholder="Masukkan nama jalan, nomor rumah, RT/RW, gang, dan kode pos..." className="w-full bg-white/80 border border-black/10 rounded-2xl py-3 px-4 outline-none focus:border-black/50 resize-none text-sm" />
          </AddressStep>

          <div className="pt-4 border-t border-black/5 text-right">
            <button type="button" onClick={handleSaveAddress} disabled={activeStep < 5 || alamatDetail.length < 5 || !(addressRecipient.trim() || defaultRecipientName) || !((addressPhone || defaultRecipientPhone).replace(/\s/g, ''))} className="px-6 py-2.5 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Tambah Ke Daftar Alamat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddressStep({ active, label, done, children }: { active: boolean; label: string; done: boolean; children: ReactNode }) {
  if (!active) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <label className="block text-xs uppercase tracking-widest opacity-60 mb-2 mt-4 flex items-center gap-2">
        {label} {done && <CheckCircle2 size={14} className="text-green-600" />}
      </label>
      {children}
    </div>
  );
}
