import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { ClipboardList, Download, Gift, MessageSquare, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';

export default function AdminOrderManager() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast } = useStore();
  const { data: ordersData, isLoading: ordersLoading } = useSWR('/api/admin/orders', fetcher);
  const { data: returnsData } = useSWR('/api/admin/returns', fetcher);
  const { data: templatesData } = useSWR('/api/admin/message-templates', fetcher);
  const { data: auditData } = useSWR('/api/admin/audit-logs?limit=40', fetcher);
  const { data: bundlesData } = useSWR('/api/admin/bundles', fetcher);
  const { data: productsData } = useSWR('/api/products', (url: string) => fetch(url).then(r => r.json()));
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const returns = Array.isArray(returnsData) ? returnsData : [];
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const auditLogs = Array.isArray(auditData) ? auditData : [];
  const bundles = Array.isArray(bundlesData) ? bundlesData : [];
  const products = Array.isArray(productsData) ? productsData : [];
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { tracking_number: string; tracking_courier: string }>>({});
  const [bundleForm, setBundleForm] = useState({ name: '', slug: '', bundle_price: 0, product_id: '', quantity: 1 });

  const exportOrders = () => {
    const rows = [
      ['id', 'created_at', 'status', 'payment_method', 'subtotal', 'shipping_cost', 'admin_fee', 'discount_amount', 'total_paid', 'tracking_courier', 'tracking_number'],
      ...orders.map((o: any) => [o.id, o.created_at, o.status, o.payment_method, o.subtotal, o.shipping_cost, o.admin_fee, o.discount_amount, o.total_paid, o.tracking_courier || '', o.tracking_number || ''])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `meyya-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateOrder = async (orderId: string, status: string) => {
    const draft = trackingDrafts[orderId] || {};
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal update order');
      mutate('/api/admin/orders');
      mutate('/api/admin/metrics?timeline=all');
      addToast('Status order diperbarui', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const updateReturn = async (id: number, status: string) => {
    try {
      const res = await authFetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Gagal update return request');
      mutate('/api/admin/returns');
      addToast('Return request diperbarui', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const saveTemplate = async (template: any) => {
    try {
      const res = await authFetch('/api/admin/message-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!res.ok) throw new Error('Gagal menyimpan template');
      mutate('/api/admin/message-templates');
      addToast('Template pesan disimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const createBundle = async () => {
    if (!bundleForm.name || !bundleForm.slug || !bundleForm.bundle_price || !bundleForm.product_id) {
      addToast('Lengkapi nama, slug, harga bundle, dan produk.', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bundleForm.name,
          slug: bundleForm.slug,
          bundle_price: bundleForm.bundle_price,
          items: [{ product_id: Number(bundleForm.product_id), quantity: bundleForm.quantity }]
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal membuat bundle');
      mutate('/api/admin/bundles');
      setBundleForm({ name: '', slug: '', bundle_price: 0, product_id: '', quantity: 1 });
      addToast('Bundle berhasil dibuat', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2"><ClipboardList size={24} /> Operasional Toko</h2>
          <p className="text-sm text-black/60">Fulfillment, bukti transfer, retur, template pesan, dan audit aktivitas admin.</p>
        </div>
        <button onClick={exportOrders} className="px-5 py-3 bg-white border border-black/10 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 hover:bg-black/5">
          <Download size={14} /> Export Orders
        </button>
      </div>

      <section className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"><PackageCheck size={16} /> Fulfillment Pesanan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] uppercase tracking-widest text-black/50 border-b border-black/10">
              <tr>
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Bukti</th>
                <th className="py-3 px-4">Resi</th>
                <th className="py-3 pl-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading && <tr><td colSpan={6} className="py-8 text-center text-black/50">Memuat pesanan...</td></tr>}
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-black/5 align-top">
                  <td className="py-4 pr-4">
                    <p className="font-mono text-xs">{order.id}</p>
                    <p className="text-[10px] text-black/50">{order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}</p>
                  </td>
                  <td className="py-4 px-4"><StatusPill status={order.status} /></td>
                  <td className="py-4 px-4 font-mono">Rp {Number(order.total_paid || 0).toLocaleString('id-ID')}</td>
                  <td className="py-4 px-4">
                    {order.payment_proof_url ? <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="underline text-ink">Lihat</a> : <span className="text-black/40">-</span>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="grid grid-cols-1 gap-2 w-44">
                      <input value={trackingDrafts[order.id]?.tracking_courier ?? order.tracking_courier ?? ''} onChange={e => setTrackingDrafts(prev => ({ ...prev, [order.id]: { ...(prev[order.id] || {}), tracking_courier: e.target.value } }))} placeholder="Kurir" className="bg-white border border-black/10 rounded-lg px-2 py-1 text-xs" />
                      <input value={trackingDrafts[order.id]?.tracking_number ?? order.tracking_number ?? ''} onChange={e => setTrackingDrafts(prev => ({ ...prev, [order.id]: { ...(prev[order.id] || {}), tracking_number: e.target.value } }))} placeholder="Nomor resi" className="bg-white border border-black/10 rounded-lg px-2 py-1 text-xs" />
                    </div>
                  </td>
                  <td className="py-4 pl-4">
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PENDING' && <button onClick={() => updateOrder(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-ink text-white rounded-full text-[10px] uppercase tracking-widest">Konfirmasi</button>}
                      <button onClick={() => updateOrder(order.id, 'SHIPPED')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] uppercase tracking-widest">Kirim</button>
                      <button onClick={() => updateOrder(order.id, 'COMPLETED')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] uppercase tracking-widest">Selesai</button>
                      {order.status !== 'CANCELLED' && <button onClick={() => updateOrder(order.id, 'CANCELLED')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-[10px] uppercase tracking-widest">Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"><RotateCcw size={16} /> Retur & Exchange</h3>
          <div className="space-y-3">
            {returns.length === 0 && <p className="text-sm text-black/50">Belum ada request retur/exchange.</p>}
            {returns.map((item: any) => (
              <div key={item.id} className="bg-white/60 border border-black/5 rounded-2xl p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs">{item.order_id}</p>
                    <p className="text-sm font-medium">{item.type} - {item.status}</p>
                    <p className="text-xs text-black/60 mt-1">{item.reason}</p>
                  </div>
                  <div className="flex gap-2 h-fit">
                    <button onClick={() => updateReturn(item.id, 'APPROVED')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] uppercase">Approve</button>
                    <button onClick={() => updateReturn(item.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-[10px] uppercase">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"><MessageSquare size={16} /> Template Pesan</h3>
          <div className="space-y-4">
            {templates.map((template: any) => (
              <TemplateEditor template={template} onSave={saveTemplate} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"><Gift size={16} /> Bundle / Paket Produk</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/60 border border-black/5 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={bundleForm.name} onChange={e => setBundleForm({ ...bundleForm, name: e.target.value, slug: bundleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') })} placeholder="Nama bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
              <input value={bundleForm.slug} onChange={e => setBundleForm({ ...bundleForm, slug: e.target.value })} placeholder="slug-bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={bundleForm.bundle_price || ''} onChange={e => setBundleForm({ ...bundleForm, bundle_price: Number(e.target.value || 0) })} placeholder="Harga bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={bundleForm.quantity || 1} onChange={e => setBundleForm({ ...bundleForm, quantity: Number(e.target.value || 1) })} placeholder="Qty produk" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
            </div>
            <select value={bundleForm.product_id} onChange={e => setBundleForm({ ...bundleForm, product_id: e.target.value })} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm">
              <option value="">Pilih produk utama bundle</option>
              {products.map((product: any) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <button onClick={createBundle} className="px-5 py-2.5 bg-ink text-white rounded-full text-xs uppercase tracking-widest font-semibold">Buat Bundle</button>
          </div>
          <div className="space-y-3">
            {bundles.length === 0 && <p className="text-sm text-black/50">Belum ada bundle.</p>}
            {bundles.map((bundle: any) => (
              <div key={bundle.id} className="bg-white/60 border border-black/5 rounded-2xl p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium">{bundle.name}</p>
                    <p className="text-xs text-black/50 font-mono">/{bundle.slug}</p>
                  </div>
                  <p className="font-mono text-sm">Rp {Number(bundle.bundle_price || 0).toLocaleString('id-ID')}</p>
                </div>
                <p className="text-xs text-black/50 mt-2">{bundle.items?.length || 0} produk dalam bundle</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"><ShieldCheck size={16} /> Audit Log Admin</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {auditLogs.map((log: any) => (
            <div key={log.id} className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-2 bg-white/60 border border-black/5 rounded-xl px-4 py-3 text-xs">
              <span className="text-black/50">{log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</span>
              <span className="font-semibold">{log.action} <span className="font-mono text-black/50">{log.entity_id}</span></span>
              <span className="font-mono text-black/40 truncate">{log.actor_clerk_id || '-'}</span>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-sm text-black/50">Belum ada audit log.</p>}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function TemplateEditor({ template, onSave }: { template: any; onSave: (template: any) => void }) {
  const [draft, setDraft] = useState(template);
  return (
    <div className="bg-white/60 border border-black/5 rounded-2xl p-4 space-y-2">
      <input value={draft.title || ''} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm font-medium" />
      <textarea value={draft.body || ''} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={3} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs resize-none" />
      <button onClick={() => onSave(draft)} className="px-4 py-2 bg-ink text-white rounded-full text-[10px] uppercase tracking-widest font-semibold">Simpan Template</button>
    </div>
  );
}
