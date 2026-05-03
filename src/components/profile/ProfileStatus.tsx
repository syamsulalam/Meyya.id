import { Package } from 'lucide-react';
import useSWR from 'swr';
import { useAuthFetcher } from '../../hooks/useAuthFetch';

export default function ProfileStatus({ user }: { user: any }) {
  const fetcher = useAuthFetcher();
  const { data: dbOrders, isLoading } = useSWR(user?.id ? `/api/user/orders/${user.id}` : null, fetcher);
  const orders = Array.isArray(dbOrders) ? dbOrders : [];

  const belumBayar = orders.filter((o: any) => o.status === 'PENDING').length;
  const dikemas = orders.filter((o: any) => o.status === 'PAID' || o.status === 'PROCESSING').length;
  const dikirim = orders.filter((o: any) => o.status === 'SHIPPED').length;
  const selesai = orders.filter((o: any) => o.status === 'SELESAI' || o.status === 'COMPLETED').length;

  const summary = [
    { label: 'Belum Bayar', count: belumBayar },
    { label: 'Dikemas', count: dikemas },
    { label: 'Dikirim', count: dikirim },
    { label: 'Selesai', count: selesai }
  ];

  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Status Pesanan</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((stat) => (
          <div key={stat.label} className="bg-white/40 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-black/5 cursor-pointer hover:bg-white/60 transition-colors">
            <Package size={24} className="opacity-40" />
            <span className="text-sm font-medium">{stat.label}</span>
            <span className="text-xs bg-black/5 text-ink px-2 py-1 rounded-full font-mono mt-1">{stat.count}</span>
          </div>
        ))}
      </div>
      {(belumBayar + dikemas + dikirim === 0) && (
      <div className="mt-8 text-center text-gray-500 text-sm py-12 border border-dashed border-black/10 rounded-3xl">
        {isLoading ? 'Memuat status pesanan...' : 'Tidak ada pesanan aktif saat ini.'}
      </div>
      )}
    </div>
  );
}
