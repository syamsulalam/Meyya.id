export default function ProfileRecentlyViewed() {
  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Terakhir Dilihat</h3>
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(id => (
          <div key={id} className="bg-white/40 p-4 rounded-3xl border border-black/5 flex flex-col bg-cover bg-center">
            <div className="aspect-[3/4] bg-black/5 rounded-2xl mb-4" />
            <h4 className="font-medium text-sm">Abaya Series</h4>
            <p className="text-sm mt-1 mb-4">Rp 459.000</p>
            <button className="text-xs border border-ink text-ink px-4 py-2 rounded-full hover:bg-ink hover:text-white transition-colors w-full mt-auto">Masukkan Keranjang</button>
          </div>
        ))}
      </div>
    </div>
  );
}
