export default function ProfileVouchers() {
  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Voucher Tersedia</h3>
      <div className="space-y-4">
        <div className="flex bg-white/40 rounded-3xl overflow-hidden border border-black/5">
          <div className="bg-ink text-white w-24 flex flex-col items-center justify-center p-4 border-r border-dashed border-white/40">
            <span className="text-2xl font-light">15%</span>
            <span className="text-[10px] uppercase tracking-widest mt-1">OFF</span>
          </div>
          <div className="p-4 flex-1 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-sm">Diskon Pelanggan Baru</h4>
              <p className="text-xs text-gray-500 mt-1">Min. belanja Rp 200.000</p>
              <p className="text-[10px] text-gray-400 mt-2">S&K Berlaku</p>
            </div>
            <button className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors">Klaim</button>
          </div>
        </div>
      </div>
    </div>
  );
}
