import useSWR from 'swr';
import { Gift, RotateCw, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';

export default function ProfileVouchers() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast } = useStore();
  const { data: dbVouchers, error, isLoading, mutate } = useSWR('/api/user/vouchers', fetcher);
  const { data: spinData, mutate: mutateSpins } = useSWR('/api/review-spins', fetcher);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [spinningId, setSpinningId] = useState<string | null>(null);
  const [lastPrize, setLastPrize] = useState<any>(null);

  const vouchers = Array.isArray(dbVouchers) ? dbVouchers : [];
  const availableSpins = Array.isArray(spinData?.available) ? spinData.available : [];

  const getValidityLabel = (voucher: any) => {
    if (voucher.endDate) return `Berlaku s/d: ${new Date(voucher.endDate).toLocaleDateString('id-ID')}`;
    if (Number(voucher.birthdayClaimWindowDays || 0) > 0) {
      return `Birthday: klaim maks. ${voucher.birthdayClaimWindowDays} hari setelah ulang tahun`;
    }
    return 'Berlaku tanpa tanggal kedaluwarsa';
  };

  const handleCopy = (code: string) => {
     navigator.clipboard.writeText(code);
     setCopiedCode(code);
     setTimeout(() => setCopiedCode(null), 2000);
  };

  const spinReviewReward = async (entitlementId: string) => {
    setSpinningId(entitlementId);
    setLastPrize(null);
    try {
      const res = await authFetch('/api/review-spins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entitlement_id: entitlementId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal memutar hadiah review');
      setLastPrize(data.spin);
      mutate();
      mutateSpins();
      addToast(data.spin?.voucher_code ? `Hadiah didapat: ${data.spin.voucher_code}` : 'Belum beruntung, coba review lagi nanti.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setSpinningId(null);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Voucher Promo Tersedia</h3>

      {(availableSpins.length > 0 || lastPrize) && (
        <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <Gift size={18} />
            <h4 className="text-sm font-semibold">Hadiah Review</h4>
          </div>
          {lastPrize && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm text-amber-900">
              {lastPrize.voucher_code
                ? <>Selamat, kamu mendapat <span className="font-mono font-semibold">{lastPrize.voucher_code}</span>. Voucher sudah masuk ke daftar di bawah.</>
                : 'Hasil spin kali ini belum mendapat voucher.'}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {availableSpins.map((spin: any) => (
              <div key={spin.id} className="rounded-2xl border border-amber-100 bg-white p-4">
                <p className="text-xs font-semibold text-ink line-clamp-1">{spin.product_name || 'Review produk'}</p>
                <p className="mt-1 text-[10px] text-black/45">Kesempatan spin dari review order {spin.order_id}</p>
                <button
                  type="button"
                  onClick={() => spinReviewReward(spin.id)}
                  disabled={spinningId === spin.id}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  <RotateCw size={13} className={spinningId === spin.id ? 'animate-spin' : ''} />
                  {spinningId === spin.id ? 'Memutar...' : 'Spin Hadiah'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading && <div className="text-sm px-4 py-3 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-200">⏳ Memuat voucher dari database...</div>}
      {error && <div className="text-sm px-4 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-200">Gagal memuat voucher: {error.message}</div>}
      
      {vouchers.length === 0 && !isLoading && !error && (
        <div className="text-center py-12 text-black/50">
           <Ticket size={48} className="mx-auto mb-4 opacity-30" />
           <p>Belum ada promo voucher aktif saat ini.</p>
        </div>
      )}

      {vouchers.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((v: any) => (
          <div key={v.id} className="flex bg-white/40 rounded-3xl overflow-hidden border border-black/5 relative group">
            <div className={`w-28 flex flex-col items-center justify-center p-4 border-r border-dashed border-black/10 shrink-0 ${v.type === 'FREE_SHIPPING' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <span className="text-xl font-bold text-center leading-tight">
                {v.type === 'PERCENTAGE' ? `${v.value}%` : v.type === 'FIXED' ? `Rp ${(v.value/1000).toFixed(0)}K` : 'FREE'}
              </span>
              <span className="text-[10px] uppercase tracking-widest mt-1 font-bold text-black/50 text-center">
                {v.type === 'FREE_SHIPPING' ? 'ONGKIR' : 'OFF'}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center">
              <div>
                <h4 className="font-semibold text-sm line-clamp-1">{v.code}</h4>
                {v.minPurchase > 0 && <p className="text-[10px] text-gray-500 mt-1">Min. belanja Rp {v.minPurchase.toLocaleString('id-ID')}</p>}
                {v.maxDiscount > 0 && v.type === 'PERCENTAGE' && <p className="text-[10px] text-gray-500 mt-0.5">Maks. diskon Rp {v.maxDiscount.toLocaleString('id-ID')}</p>}
                <p className="text-[10px] text-gray-400 mt-1 font-mono">{getValidityLabel(v)}</p>
              </div>
            </div>
            
            {/* Copy Overlay */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="font-mono font-bold text-lg mb-2 bg-black text-white px-3 py-1 rounded">{v.code}</span>
               <button onClick={() => handleCopy(v.code)} className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                 {copiedCode === v.code ? '✓ Tersalin!' : 'Salin Kode'}
               </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
