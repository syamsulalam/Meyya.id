import { Package } from 'lucide-react';

export default function ProfileStatus() {
  return (
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
  );
}
