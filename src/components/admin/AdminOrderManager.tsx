import { useState } from 'react';
import type { ChangeEvent } from 'react';
import useSWR, { mutate } from 'swr';
import { AlertCircle, CheckCircle2, ClipboardList, Download, Gift, MessageSquare, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';
import { buildImageUploadFormData } from '../../lib/imageCompression';
import {
  AuditLogTooltip,
  BundleTooltip,
  ExplainedLabel,
  FulfillmentTooltip,
  MessageTemplateTooltip,
  ReturnExchangeTooltip,
  TrackingNumberTooltip,
} from '../term-tooltips';

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
  const [returnDrafts, setReturnDrafts] = useState<Record<number, {
    admin_note?: string;
    received_note?: string;
    restock_received_items?: boolean;
    warehouse_evidence_urls?: string[];
    decision?: string;
    decision_note?: string;
    qc_log?: any[];
  }>>({});
  const [bundleForm, setBundleForm] = useState({ name: '', slug: '', bundle_price: 0, items: [{ product_id: '', quantity: 1 }] });

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
    const draft = returnDrafts[id] || {};
    try {
      const res = await authFetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal update return request');
      mutate('/api/admin/returns');
      addToast('Return request diperbarui', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const uploadWarehouseEvidence = async (event: ChangeEvent<HTMLInputElement>, returnId: number) => {
    const existing = returnDrafts[returnId]?.warehouse_evidence_urls || [];
    const files = (Array.from(event.target.files ?? []) as File[]).slice(0, Math.max(0, 8 - existing.length));
    if (files.length === 0) return;
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = await buildImageUploadFormData(file);
        const res = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || 'Gagal upload bukti gudang');
        uploaded.push(data.url);
      }
      setReturnDrafts(prev => ({
        ...prev,
        [returnId]: {
          ...(prev[returnId] || {}),
          warehouse_evidence_urls: [...existing, ...uploaded].slice(0, 8),
        },
      }));
      addToast('Bukti penerimaan gudang berhasil diunggah', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      event.target.value = '';
    }
  };

  const updateQcItem = (returnId: number, qcItem: any, patch: any, allItems: any[]) => {
    setReturnDrafts(prev => {
      const current = prev[returnId] || {};
      const currentLog = Array.isArray(current.qc_log) ? current.qc_log : buildInitialQcLog(allItems);
      const key = getQcKey(qcItem);
      const nextLog = currentLog.map((row: any) => getQcKey(row) === key ? { ...row, ...patch } : row);
      return { ...prev, [returnId]: { ...current, qc_log: nextLog } };
    });
  };

  const saveTemplate = async (template: any) => {
    try {
      const res = await authFetch('/api/admin/message-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan template');
      mutate('/api/admin/message-templates');
      addToast('Template pesan disimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const createBundle = async () => {
    const cleanItems = bundleForm.items.filter(item => item.product_id).map(item => ({ product_id: Number(item.product_id), quantity: Number(item.quantity || 1) }));
    if (!bundleForm.name || !bundleForm.slug || !bundleForm.bundle_price || cleanItems.length === 0) {
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
          items: cleanItems
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal membuat bundle');
      mutate('/api/admin/bundles');
      setBundleForm({ name: '', slug: '', bundle_price: 0, items: [{ product_id: '', quantity: 1 }] });
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
          <Download size={14} /> Ekspor Pesanan
        </button>
      </div>

      <section className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2">
          <PackageCheck size={16} />
          <ExplainedLabel tooltip={<FulfillmentTooltip />}>Fulfillment Pesanan</ExplainedLabel>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] uppercase tracking-widest text-black/50 border-b border-black/10">
              <tr>
                <th className="py-3 pr-4">Pesanan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Bukti</th>
                <th className="py-3 px-4"><ExplainedLabel tooltip={<TrackingNumberTooltip />}>Resi</ExplainedLabel></th>
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
                      {order.status !== 'CANCELLED' && <button onClick={() => updateOrder(order.id, 'CANCELLED')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-[10px] uppercase tracking-widest">Batalkan</button>}
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
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2">
            <RotateCcw size={16} />
            <ExplainedLabel tooltip={<ReturnExchangeTooltip />}>Retur & Exchange</ExplainedLabel>
          </h3>
          <div className="space-y-3">
            {returns.length === 0 && <p className="text-sm text-black/50">Belum ada request retur/exchange.</p>}
            {returns.map((item: any) => (
              <div key={item.id} className="bg-white/60 border border-black/5 rounded-2xl p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs">{item.order_id}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-sm font-medium">{item.type} - {item.status}</p>
                        <SlaPill dueAt={item.sla_due_at} status={item.sla_status} />
                        {item.stock_restored_at && <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] uppercase tracking-widest">Stok kembali</span>}
                      </div>
                      <p className="text-xs text-black/60 mt-1">{item.reason}</p>
                      {item.admin_note && <p className="text-[10px] text-black/40 mt-1">Catatan admin: {item.admin_note}</p>}
                      {item.received_note && <p className="text-[10px] text-black/40 mt-1">Catatan penerimaan: {item.received_note}</p>}
                      {item.decision && <p className="text-[10px] text-black/40 mt-1">Keputusan: {item.decision}{item.decision_note ? ` - ${item.decision_note}` : ''}</p>}
                    </div>
                    <div className="text-right text-[10px] text-black/40">
                      <p>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</p>
                      {item.sla_due_at && <p>SLA: {new Date(item.sla_due_at).toLocaleString('id-ID')}</p>}
                    </div>
                  </div>

                  {Array.isArray(item.evidence_urls) && item.evidence_urls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {item.evidence_urls.map((url: string) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border border-black/10 bg-black/5">
                          <img src={url} alt="Bukti retur" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="rounded-2xl border border-black/5 bg-white/50 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-black/50">Bukti Penerimaan Gudang</p>
                      <label className="cursor-pointer rounded-full bg-black/5 px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-black/10">
                        Upload Foto
                        <input type="file" accept="image/*" multiple onChange={e => uploadWarehouseEvidence(e, item.id)} className="hidden" />
                      </label>
                    </div>
                    {((returnDrafts[item.id]?.warehouse_evidence_urls || item.warehouse_evidence_urls || []) as string[]).length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {((returnDrafts[item.id]?.warehouse_evidence_urls || item.warehouse_evidence_urls || []) as string[]).map((url: string) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border border-black/10 bg-black/5">
                            <img src={url} alt="Bukti gudang" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-black/40">Belum ada bukti penerimaan dari gudang.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      value={returnDrafts[item.id]?.admin_note || ''}
                      onChange={e => setReturnDrafts(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), admin_note: e.target.value } }))}
                      placeholder="Catatan admin"
                      className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      value={returnDrafts[item.id]?.received_note || ''}
                      onChange={e => setReturnDrafts(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), received_note: e.target.value } }))}
                      placeholder="Catatan saat barang diterima"
                      className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                    />
                    <select
                      value={returnDrafts[item.id]?.decision || item.decision || ''}
                      onChange={e => setReturnDrafts(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), decision: e.target.value } }))}
                      className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="">Keputusan refund/exchange</option>
                      <option value="REFUND">Refund</option>
                      <option value="EXCHANGE">Exchange</option>
                      <option value="REJECT">Reject</option>
                      <option value="REPAIR">Repair</option>
                      <option value="STORE_CREDIT">Store credit</option>
                    </select>
                    <input
                      value={returnDrafts[item.id]?.decision_note || item.decision_note || ''}
                      onChange={e => setReturnDrafts(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), decision_note: e.target.value } }))}
                      placeholder="Catatan keputusan"
                      className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-white/50 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-black/50 mb-2">Quality Control Per Item</p>
                    <div className="space-y-2">
                      {buildInitialQcLog(item.order_items || []).map((qcItem: any) => {
                        const saved = (returnDrafts[item.id]?.qc_log || item.qc_log || []).find((row: any) => getQcKey(row) === getQcKey(qcItem));
                        const row = { ...qcItem, ...(saved || {}) };
                        return (
                          <div key={getQcKey(qcItem)} className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr] gap-2">
                            <div className="text-xs">
                              <p className="font-medium">{qcItem.product_name}</p>
                              <p className="text-[10px] text-black/40">Qty {qcItem.quantity}{qcItem.color_name ? ` / ${qcItem.color_name}` : ''}{qcItem.size_name ? ` / ${qcItem.size_name}` : ''}</p>
                            </div>
                            <select
                              value={row.condition}
                              onChange={e => updateQcItem(item.id, qcItem, { condition: e.target.value }, item.order_items || [])}
                              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                            >
                              <option value="GOOD">Good</option>
                              <option value="DAMAGED">Damaged</option>
                              <option value="MISSING">Missing</option>
                              <option value="WRONG_ITEM">Wrong item</option>
                              <option value="USED">Used</option>
                              <option value="INCOMPLETE">Incomplete</option>
                            </select>
                            <input
                              value={row.note || ''}
                              onChange={e => updateQcItem(item.id, qcItem, { note: e.target.value }, item.order_items || [])}
                              placeholder="Catatan QC item"
                              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-black/60">
                    <input
                      type="checkbox"
                      checked={Boolean(returnDrafts[item.id]?.restock_received_items)}
                      onChange={e => setReturnDrafts(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), restock_received_items: e.target.checked } }))}
                      disabled={Boolean(item.stock_restored_at)}
                    />
                    Kembalikan stok item order saat status diubah ke RECEIVED
                  </label>

                  <div className="flex flex-wrap gap-2 h-fit">
                    <button onClick={() => updateReturn(item.id, 'APPROVED')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] uppercase">Setujui</button>
                    <button onClick={() => updateReturn(item.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-[10px] uppercase">Tolak</button>
                    <button onClick={() => updateReturn(item.id, 'RECEIVED')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] uppercase">Barang Diterima</button>
                    <button onClick={() => updateReturn(item.id, item.type === 'EXCHANGE' ? 'EXCHANGED' : 'REFUNDED')} className="px-3 py-1.5 bg-black/5 text-ink rounded-full text-[10px] uppercase">{item.type === 'EXCHANGE' ? 'Exchange Selesai' : 'Refund Selesai'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
          <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2">
            <MessageSquare size={16} />
            <ExplainedLabel tooltip={<MessageTemplateTooltip />}>Template Pesan</ExplainedLabel>
          </h3>
          <div className="space-y-4">
            {templates.map((template: any) => (
              <TemplateEditor template={template} onSave={saveTemplate} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/40 border border-black/5 rounded-[2rem] p-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2">
          <Gift size={16} />
          <ExplainedLabel tooltip={<BundleTooltip />}>Bundle / Paket Produk</ExplainedLabel>
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/60 border border-black/5 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={bundleForm.name} onChange={e => setBundleForm({ ...bundleForm, name: e.target.value, slug: bundleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') })} placeholder="Nama bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
              <input value={bundleForm.slug} onChange={e => setBundleForm({ ...bundleForm, slug: e.target.value })} placeholder="slug-bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={bundleForm.bundle_price || ''} onChange={e => setBundleForm({ ...bundleForm, bundle_price: Number(e.target.value || 0) })} placeholder="Harga bundle" className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              {bundleForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_90px_36px] gap-2">
                  <select value={item.product_id} onChange={e => setBundleForm({ ...bundleForm, items: bundleForm.items.map((row, i) => i === index ? { ...row, product_id: e.target.value } : row) })} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm">
                    <option value="">Pilih produk</option>
                    {products.map((product: any) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                  <input type="number" value={item.quantity || 1} onChange={e => setBundleForm({ ...bundleForm, items: bundleForm.items.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value || 1) } : row) })} className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm" />
                  <button type="button" onClick={() => setBundleForm({ ...bundleForm, items: bundleForm.items.filter((_, i) => i !== index) })} className="bg-red-50 text-red-600 rounded-xl">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setBundleForm({ ...bundleForm, items: [...bundleForm.items, { product_id: '', quantity: 1 }] })} className="text-xs bg-black/5 px-3 py-2 rounded-full">Tambah Item Bundle</button>
            </div>
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
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-5 flex items-center gap-2">
          <ShieldCheck size={16} />
          <ExplainedLabel tooltip={<AuditLogTooltip />}>Audit Log Admin</ExplainedLabel>
        </h3>
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

function buildInitialQcLog(items: any[]) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    product_name: item.product_name || `Produk ${item.product_id}`,
    quantity: Number(item.quantity || 0),
    color_name: item.color_name || '',
    size_name: item.size_name || '',
    condition: 'GOOD',
    note: '',
  }));
}

function getQcKey(item: any) {
  return `${item.product_id || 0}:${item.variant_id || 'base'}`;
}

function SlaPill({ dueAt, status }: { dueAt?: string; status?: string }) {
  if (!dueAt || status === 'NONE') return null;
  const styles: Record<string, string> = {
    OVERDUE: 'bg-red-50 text-red-700',
    DUE_SOON: 'bg-amber-50 text-amber-700',
    ON_TRACK: 'bg-emerald-50 text-emerald-700',
  };
  const labels: Record<string, string> = {
    OVERDUE: 'SLA lewat',
    DUE_SOON: 'SLA dekat',
    ON_TRACK: 'SLA aman',
  };
  return <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-widest ${styles[status || 'ON_TRACK'] || styles.ON_TRACK}`}>{labels[status || 'ON_TRACK'] || labels.ON_TRACK}</span>;
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
  const allowedVariables = draft.allowed_variables || template.allowed_variables || {};
  const invalidVariables = findInvalidVariables(`${draft.title || ''}\n${draft.body || ''}`, Object.keys(allowedVariables));
  const previewTitle = renderPreview(draft.title || '', getPreviewValues(template.key));
  const previewBody = renderPreview(draft.body || '', getPreviewValues(template.key));
  const canSave = invalidVariables.length === 0;

  return (
    <div className="bg-white/60 border border-black/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink">{draft.key}</p>
          <p className="text-[10px] text-black/40 uppercase tracking-widest">{draft.channel || 'WHATSAPP'}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${canSave ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {canSave ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {canSave ? 'Valid' : 'Cek Placeholder'}
        </span>
      </div>
      <input value={draft.title || ''} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm font-medium" />
      <textarea value={draft.body || ''} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={4} className={`w-full bg-white border rounded-xl px-3 py-2 text-xs resize-none ${canSave ? 'border-black/10' : 'border-red-200 focus:outline-red-300'}`} />

      <div className="rounded-xl bg-black/5 border border-black/5 p-3">
        <p className="text-[10px] uppercase tracking-widest text-black/40 mb-2">Variabel yang boleh dipakai</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(allowedVariables).map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => setDraft({ ...draft, body: `${draft.body || ''} {{${variable}}}`.trim() })}
              className="rounded-full bg-white border border-black/10 px-2 py-1 text-[10px] font-mono hover:border-ink"
              title={allowedVariables[variable]}
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      </div>

      {invalidVariables.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700">
          Placeholder tidak dikenal: {invalidVariables.map((variable) => `{{${variable}}}`).join(', ')}
        </div>
      )}

      <div className="rounded-xl bg-white border border-black/10 p-3">
        <p className="text-[10px] uppercase tracking-widest text-black/40 mb-2">Preview</p>
        <p className="text-xs font-semibold">{previewTitle}</p>
        <p className="text-xs text-black/60 whitespace-pre-wrap mt-1">{previewBody}</p>
      </div>

      <button disabled={!canSave} onClick={() => onSave(draft)} className="px-4 py-2 bg-ink text-white rounded-full text-[10px] uppercase tracking-widest font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Simpan Template</button>
    </div>
  );
}

function findInvalidVariables(text: string, allowedVariables: string[]) {
  const variables = Array.from(String(text || '').matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g), (match) => match[1]);
  return Array.from(new Set(variables.filter((variable) => !allowedVariables.includes(variable))));
}

function renderPreview(text: string, values: Record<string, string>) {
  return String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => values[key] || `{{${key}}}`);
}

function getPreviewValues(key: string) {
  return {
    store_name: 'MEYYA.ID',
    support_whatsapp: '6281234567890',
    name: 'Aisyah',
    order_id: 'ORD-20260504-123',
    total_paid: 'Rp 349.123',
    payment_expires_at: '4 Mei 2026 21.00',
    courier: 'JNE',
    tracking_number: 'JNE123456789',
    tracking_url: 'https://meyya.id/order/ORD-20260504-123',
    template_key: key,
  };
}
