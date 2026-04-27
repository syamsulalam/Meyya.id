export default function ProfileRecommendations() {
  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Kamu Mungkin Suka</h3>
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map(id => (
          <div key={id} className="bg-white/40 p-4 rounded-3xl border border-black/5 flex flex-col">
            <div className="aspect-[3/4] bg-black/5 rounded-2xl mb-4" />
            <h4 className="font-medium text-sm">Khimar Collection</h4>
            <p className="text-sm mt-1">Rp 199.000</p>
          </div>
        ))}
      </div>
    </div>
  );
}
