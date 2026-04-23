import { useState, useEffect } from 'react';

export default function AdminMetricsPanel() {
  const [metrics, setMetrics] = useState({ omzet: 0, profit: 0, total_orders: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/metrics'),
          fetch('/api/admin/orders')
        ]);
        const metricsData = await metricsRes.json();
        const ordersData = await ordersRes.json();
        
        setMetrics({
          omzet: metricsData?.omzet || 0,
          profit: metricsData?.profit || 0,
          total_orders: metricsData?.total_orders || 0,
        });
        setOrders(ordersData || []);
      } catch (e) {
        console.error(e);
        // Fallback safety setting
        setMetrics({ omzet: 0, profit: 0, total_orders: 0 });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const confirmPayment = async (orderId: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/confirm`, { method: 'POST' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
    } catch (e) {
      alert('Error confirming payment');
    }
  };

  if (loading) return <div className="py-20 text-center">Memuat metrik...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Pesanan</p>
          <p className="text-4xl font-light">{metrics.total_orders}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Omzet</p>
          <p className="text-4xl font-light">Rp {metrics.omzet.toLocaleString('id-ID')}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl bg-black/5">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Total Profit</p>
          <p className="text-4xl font-light text-green-600">Rp {metrics.profit.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <h2 className="text-xl font-medium mb-6">Manajemen Pesanan</h2>
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/40 border-b border-black/5 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">ID Pesanan</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Total Rp</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                  <td className="px-6 py-4">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium">Rp {order.total_paid.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'pending_payment' && (
                      <button 
                        onClick={() => confirmPayment(order.id)}
                        className="text-xs glass-button-outline px-3 py-1"
                      >
                        Konfirmasi Pembayaran
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Belum ada pesanan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
