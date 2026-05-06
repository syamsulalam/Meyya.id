import useSWR from 'swr';
import { Eye, Package, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthFetcher } from '../../hooks/useAuthFetch';

export default function ProfileHistory({ user }: { user: any }) {
  const fetcher = useAuthFetcher();
  const { data: dbOrders, error, isLoading } = useSWR(user?.id ? `/api/user/orders/${user.id}` : null, fetcher);
  const orders = Array.isArray(dbOrders) ? dbOrders : [];
  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Riwayat Pesanan</h3>
      <div className="space-y-4">
        {isLoading && <div className="text-center py-8 opacity-50 bg-white/40 rounded-3xl">⏳ Memuat riwayat pesanan...</div>}
        {!isLoading && orders.length === 0 && (
          <div className="text-center py-12 text-black/50 bg-white/40 rounded-3xl">
             <Package size={48} className="mx-auto mb-4 opacity-30" />
             <p>Belum ada riwayat pesanan.</p>
          </div>
        )}
        
        {orders.map((order: any) => {
          const isCompleted = order.status === 'COMPLETED' || order.status === 'SELESAI';
          return (
          <div key={order.id} className="bg-white/40 p-6 rounded-3xl border border-black/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono bg-black/5 px-3 py-1 rounded-full">{order.id}</span>
              <span className={`text-xs font-medium uppercase tracking-widest ${order.status === 'SELESAI' ? 'text-green-600' : 'text-blue-600'}`}>{order.status}</span>
            </div>
            {order.items && order.items.map((item: any) => (
            <div key={item.id} className="flex gap-4 mb-4">
              <div className="w-20 h-24 bg-black/5 rounded-xl flex items-center justify-center overflow-hidden">
                {item.product_image_url ? <img src={item.product_image_url} alt="" className="h-full w-full object-cover" /> : <Eye size={20} className="opacity-20" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.product_name}</h4>
                <p className="text-xs text-gray-500 mt-1">Warna: {item.color_name || '-'}, Ukuran: {item.size_name || '-'}</p>
                <p className="text-sm font-medium mt-2">Rp {(item.price_at_purchase || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-400">x {item.quantity}</span></p>
                {isCompleted && item.product_slug && (
                  item.review_id ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                      <Star size={12} className="fill-emerald-500" /> Sudah Review
                    </span>
                  ) : (
                    <Link to={`/produk/${item.product_slug}`} className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                      <Star size={12} /> Tulis Review
                    </Link>
                  )
                )}
              </div>
            </div>
            ))}
            <div className="border-t border-black/5 pt-4 flex justify-between items-center">
              <span className="text-sm font-medium">Total: Rp {(order.total_paid || 0).toLocaleString('id-ID')}</span>
              <Link to="/products" className="text-xs bg-ink text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors">Beli Lagi</Link>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
