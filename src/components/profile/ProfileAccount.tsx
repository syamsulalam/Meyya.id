import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Phone, Mail, Gift } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { useStore } from '../../store';
import { useUser } from '@clerk/react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import { BirthdayTooltip, ExplainedLabel } from '../term-tooltips';

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'ID' },
  { code: '+60', flag: '🇲🇾', label: 'MY' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+673', flag: '🇧🇳', label: 'BN' },
];

const formatPhoneDigits = (value: string) => value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

export default function ProfileAccount({ user, setBlockerOpen }: { user: any, setBlockerOpen?: (open: boolean) => void }) {
  const { user: clerkUser } = useUser();
  const authFetch = useAuthFetch();
  const { addToast, showConfirm } = useStore();
  
  const [countryCode, setCountryCode] = useState('+62');

  const [isSaved, setIsSaved] = useState(true);
  const [profileName, setProfileName] = useState(user?.name || user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [savedBirthDate, setSavedBirthDate] = useState('');
  const [canSyncNameToClerk, setCanSyncNameToClerk] = useState(false);

  // Fetch Profile Data
  useEffect(() => {
    if (user?.id) {
      authFetch(`/api/user/profile/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            const d1Name = data.user.name || user.name || user.fullName || '';
            setProfileName(d1Name);
            setCanSyncNameToClerk(Boolean(d1Name && clerkUser && !clerkUser.firstName && !clerkUser.lastName));
            const phone = data.user.phone_wa || '';
            const cc = COUNTRY_CODES.find(c => phone.startsWith(c.code))?.code || '+62';
            setCountryCode(cc);
            setProfilePhone(formatPhoneDigits(phone.replace(cc, '')));
            setBirthDate(data.user.birth_date || '');
            setSavedBirthDate(data.user.birth_date || '');
            setTimeout(() => setIsSaved(true), 10);
          }
        });
    }
  }, [authFetch, clerkUser, user?.id]);

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

  const persistProfile = async () => {
    try {
      const res = await authFetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone_wa: countryCode + profilePhone.replace(/\s/g, ''), birth_date: birthDate || null })
      });
      
      if (!res.ok) throw new Error("Gagal menyimpan data");
      
      if (clerkUser) {
        const nameParts = profileName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        try {
          await clerkUser.update({ firstName, lastName });
          await clerkUser.reload();
          setCanSyncNameToClerk(false);
        } catch (clerkErr) {
          console.error("Clerk sync error:", clerkErr);
          addToast('Profil D1 tersimpan, tetapi akun login gagal disinkronkan.', 'error');
        }
      }
      
      setIsSaved(true);
      setSavedBirthDate(birthDate || savedBirthDate);
      addToast('Perubahan data profil berhasil disimpan!', 'success');
      if (blocker.state === 'blocked') {
        blocker.proceed?.();
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleSave = async () => {
    if (!savedBirthDate && birthDate) {
      showConfirm({
        title: 'Konfirmasi Tanggal Lahir',
        message: `Pastikan tanggal lahir ${new Date(birthDate).toLocaleDateString('id-ID')} sudah benar. Setelah disimpan, tanggal lahir tidak bisa diganti lagi karena dipakai untuk aturan voucher birthday.`,
        confirmLabel: 'Sudah Benar',
        tone: 'default',
        onConfirm: persistProfile,
      });
      return;
    }

    await persistProfile();
  };

  const handleSyncNameToClerk = async () => {
    if (!clerkUser || !profileName.trim()) return;

    try {
      const res = await authFetch('/api/user/profile/sync-clerk', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyinkronkan nama');
      }
      await clerkUser.reload();
      setCanSyncNameToClerk(false);
      addToast('Nama berhasil disinkronkan ke akun login.', 'success');
    } catch (err) {
      console.error("Clerk name repair failed:", err);
      addToast('Gagal menyinkronkan nama ke akun login.', 'error');
    }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  onChange={(e) => {
                    setProfilePhone(formatPhoneDigits(e.target.value));
                  }}
                  placeholder="Contoh: 8123 4567 890"
                  className="w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-sm"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-60 mb-2">
              <ExplainedLabel tooltip={<BirthdayTooltip />}>Tanggal Lahir</ExplainedLabel>
            </label>
            <div className="relative">
              <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="date"
                value={birthDate}
                disabled={!!savedBirthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white/50 border border-black/10 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-black/50 transition-colors text-sm disabled:bg-black/5 disabled:text-black/40 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-2 text-xs text-black/50">
              {savedBirthDate ? 'Tanggal lahir sudah tersimpan dan tidak bisa diganti lagi.' : 'Masukkan tanggal lahir Anda untuk peluang mendapatkan voucher diskon birthday.'}
            </p>
          </div>
          </div>
          <div className="pt-2">
            <button type="button" onClick={handleSave} className="px-6 py-2.5 bg-ink text-white rounded-full uppercase tracking-widest text-xs hover:bg-black/80 transition-colors">
              Simpan Data Pribadi
            </button>
            {canSyncNameToClerk && (
              <button type="button" onClick={handleSyncNameToClerk} className="ml-3 px-6 py-2.5 bg-black/5 text-ink rounded-full uppercase tracking-widest text-xs hover:bg-black/10 transition-colors">
                Sinkronkan Nama Login
              </button>
            )}
          </div>
        </div>

      </form>
    </>
  );
}
