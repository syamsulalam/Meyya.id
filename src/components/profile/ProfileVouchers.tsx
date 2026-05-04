import useSWR from 'swr';
import { Ticket } from 'lucide-react';
import { useState } from 'react';
import { useAuthFetcher } from '../../hooks/useAuthFetch';

export default function ProfileVouchers() {
  const fetcher = useAuthFetcher();
  const { data: dbVouchers, error, isLoading } = useSWR('/api/user/vouchers', fetcher);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const vouchers = Array.isArray(dbVouchers) ? dbVouchers : [];

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

  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Voucher Promo Tersedia</h3>
      
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
