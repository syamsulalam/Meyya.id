import { Eye } from 'lucide-react';

export default function ProfileHistory() {
  return (
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
  );
}
