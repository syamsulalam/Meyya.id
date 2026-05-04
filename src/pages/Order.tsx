import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { CheckCircle2, Package, Copy, ArrowRight, Truck, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { useAuthFetcher } from '../hooks/useAuthFetch';
import { useAuthFetch } from '../hooks/useAuthFetch';
import { ExplainedLabel, ReturnExchangeTooltip, TrackingNumberTooltip, UniqueCodeTooltip } from '../components/term-tooltips';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Order() {
  const { id } = useParams();
  const { addToast } = useStore();
  const authFetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const [uploadingProof, setUploadingProof] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  
  const { data: order, error, isLoading } = useSWR(id ? `/api/orders/${id}` : null, authFetcher);
  const { data: paymentOptions } = useSWR('/api/payment/options', fetcher);
  const { data: trackingData, isLoading: trackingLoading, mutate: refreshTracking } = useSWR(
    id && order?.tracking_number ? `/api/orders/${id}/tracking` : null,
    authFetcher,
    { refreshInterval: order?.status === 'SHIPPED' ? 10 * 60 * 1000 : 0 }
  );

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Memuat detail pesanan...</div>;
  }

  if (error || !order || order.error) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-red-500">Pesanan tidak ditemukan.</div>;
  }

  const isTransfer = order.payment_method === 'TRANSFER' && (order.status === 'PENDING' || order.status === 'pending');
  const isPaid = order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'COMPLETED';
  const paymentExpired = order.payment_expires_at && new Date(order.payment_expires_at) <= new Date() && order.status === 'PENDING';

  const defaultBank = paymentOptions?.banks?.[0];
  const instruction = paymentOptions?.settings?.transfer_instruction || 'Verifikasi manual dilakukan dalam 1x24 jam kerja.';

  const uploadPaymentProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`/api/orders/${id}/payment-proof`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal upload bukti transfer');
      addToast('Bukti transfer berhasil diunggah.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const submitReturnRequest = async (type: 'RETURN' | 'EXCHANGE') => {
    if (!returnReason.trim()) return addToast('Isi alasan retur/exchange terlebih dahulu.', 'error');
    try {
      const res = await authFetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id, type, reason: returnReason })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim request');
      setReturnReason('');
      addToast('Request berhasil dikirim ke admin.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-16 w-full">
      <div className="glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl text-center">
        
        {isPaid ? (
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
        ) : (
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} />
          </div>
        )}

        <h1 className="text-3xl font-heading font-light mb-2 text-ink">
          {order.status === 'CANCELLED' ? 'Pesanan Dibatalkan' : isPaid ? 'Pesanan Berhasil Dibayar' : 'Menunggu Pembayaran'}
        </h1>
        <p className="text-sm opacity-60 mb-8 font-mono">ID Pesanan: #{id}</p>

        {isTransfer ? (
          <div className="text-left bg-orange-50/50 border border-orange-100 p-6 md:p-8 rounded-3xl mb-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-orange-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
               Selesaikan Pembayaran Anda
            </h2>
            
            {defaultBank ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-widest">Bank Tujuan ({defaultBank.bank_name})</p>
                <div className="flex items-center justify-between bg-white border border-black/10 p-4 rounded-xl">
                  <span className="font-mono text-lg tracking-wider">{defaultBank.account_number}</span>
                  <button onClick={() => { navigator.clipboard.writeText(defaultBank.account_number.replace(/\D/g, '')); addToast('Disalin!', 'success'); }} className="text-ink hover:text-black flex items-center gap-1 text-xs font-semibold uppercase bg-black/5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Copy size={14} /> Salin
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">a.n. {defaultBank.account_holder}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-widest">Total Bayar</p>
                <div className="flex items-center justify-between bg-white border border-black/10 p-4 rounded-xl">
                  <span className="font-mono text-xl tracking-tight text-ink font-bold">
                    Rp {order.total_paid?.toLocaleString('id-ID')}
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(String(order.total_paid)); addToast('Disalin!', 'success'); }} className="text-ink hover:text-black flex items-center gap-1 text-xs font-semibold uppercase bg-black/5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Copy size={14} /> Salin
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-2 font-medium">
                  <ExplainedLabel tooltip={<UniqueCodeTooltip />}>Penting: Transfer tepat hingga 3 digit terakhir</ExplainedLabel> (kode unik: {order.unique_code})
                </p>
              </div>
              
              <div className="bg-white/60 text-xs p-4 rounded-xl text-gray-600 border border-black/5 leading-relaxed">
                {instruction}
              </div>
              {order.payment_expires_at && (
                <div className={`text-xs p-4 rounded-xl border ${paymentExpired ? 'bg-red-50 text-red-700 border-red-100' : 'bg-white/60 text-gray-600 border-black/5'}`}>
                  Batas pembayaran: {new Date(order.payment_expires_at).toLocaleString('id-ID')}
                </div>
              )}
              <div className="bg-white/60 border border-black/5 rounded-xl p-4">
                <p className="text-[10px] uppercase font-semibold text-gray-500 mb-3 tracking-widest">Upload Bukti Transfer</p>
                {order.payment_proof_url ? (
                  <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="text-sm underline text-ink">Bukti transfer sudah diunggah</a>
                ) : (
                  <label className="inline-flex cursor-pointer px-4 py-2 bg-ink text-white rounded-full text-xs uppercase tracking-widest font-semibold">
                    {uploadingProof ? 'Mengunggah...' : 'Pilih File'}
                    <input type="file" accept="image/*,application/pdf" onChange={uploadPaymentProof} disabled={uploadingProof || paymentExpired} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            ) : (
              <div className="bg-white/70 text-sm p-5 rounded-xl text-orange-800 border border-orange-100 leading-relaxed">
                Rekening pembayaran belum dikonfigurasi. Hubungi admin atau customer service sebelum melakukan transfer.
              </div>
            )}
          </div>
        ) : isPaid ? (
          <div className="text-left bg-emerald-50/50 border border-emerald-100 p-6 md:p-8 rounded-3xl mb-8 flex flex-col items-center justify-center text-center">
            <Truck size={32} className="text-emerald-500 mb-4" />
            <h2 className="text-lg font-medium text-emerald-800 mb-2">Pesanan Diproses</h2>
            <p className="text-sm text-emerald-700/80 mb-6 max-w-sm mx-auto">Kami sedang mengemas pesanan Anda dengan penuh cinta. Anda akan menerima notifikasi saat paket dikirim.</p>
            {order.tracking_number && (
              <div className="bg-white/70 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800 w-full max-w-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <p>
                      <ExplainedLabel tooltip={<TrackingNumberTooltip />}>Resi {order.tracking_courier || ''}</ExplainedLabel>: <span className="font-mono font-semibold">{order.tracking_number}</span>
                    </p>
                    {trackingData?.available && (
                      <p className="mt-1 text-xs text-emerald-700/80">
                        Status live: <span className="font-semibold">{trackingData.status || 'Dalam proses'}</span>
                      </p>
                    )}
                    {!trackingData?.available && trackingData?.error && (
                      <p className="mt-1 text-xs text-emerald-700/70">{trackingData.error}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => refreshTracking()} className="rounded-full bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100" title="Refresh tracking resi">
                    <RefreshCw size={14} className={trackingLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {trackingData?.available && (
                  <div className="mt-4 text-left border-t border-emerald-100 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800/80 mb-3">
                      {trackingData.origin && <p><span className="font-semibold">Asal:</span> {trackingData.origin}</p>}
                      {trackingData.destination && <p><span className="font-semibold">Tujuan:</span> {trackingData.destination}</p>}
                      {trackingData.receiver && <p><span className="font-semibold">Penerima:</span> {trackingData.receiver}</p>}
                      {trackingData.service && <p><span className="font-semibold">Layanan:</span> {trackingData.service}</p>}
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(trackingData.events || []).slice(0, 8).map((event: any, index: number) => (
                        <div key={`${event.timestamp}-${index}`} className="rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2">
                          <p className="text-xs font-medium text-emerald-900">{event.description || event.code || 'Update pengiriman'}</p>
                          <p className="text-[10px] text-emerald-800/60 mt-0.5">{[event.timestamp, event.city].filter(Boolean).join(' - ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-left bg-orange-50/50 border border-orange-100 p-6 md:p-8 rounded-3xl mb-8 flex flex-col items-center justify-center text-center">
            <Package size={32} className="text-orange-500 mb-4" />
            <h2 className="text-lg font-medium text-orange-800 mb-2">Selesaikan Pembayaran</h2>
            <p className="text-sm text-orange-700/80 mb-6 max-w-sm mx-auto">Selesaikan pembayaran via {order.payment_method === 'QRIS' ? 'QRIS' : 'Kartu Kredit'} dan tunggu verifikasi otomatis.</p>
          </div>
        )}

        {(order.status === 'COMPLETED' || order.status === 'SELESAI') && (
          <div className="text-left bg-white/50 border border-black/5 rounded-3xl p-6 mb-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold mb-3">
              <ExplainedLabel tooltip={<ReturnExchangeTooltip />}>Retur / Exchange</ExplainedLabel>
            </h2>
            <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={3} placeholder="Tuliskan alasan retur atau exchange..." className="w-full bg-white border border-black/10 rounded-xl p-3 text-sm resize-none mb-3" />
            <div className="flex gap-2">
              <button type="button" onClick={() => submitReturnRequest('RETURN')} className="px-4 py-2 bg-black/5 rounded-full text-xs uppercase tracking-widest font-semibold">Ajukan Retur</button>
              <button type="button" onClick={() => submitReturnRequest('EXCHANGE')} className="px-4 py-2 bg-ink text-white rounded-full text-xs uppercase tracking-widest font-semibold">Ajukan Exchange</button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/profil?tab=status" className="w-full sm:w-auto bg-ink text-white px-8 py-4 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-black/80 transition-colors shadow-xl">
             Cek Status Pesanan
          </Link>
          <Link to="/" className="w-full sm:w-auto px-8 py-4 rounded-full text-xs uppercase tracking-widest font-semibold text-ink hover:bg-black/5 transition-colors flex items-center justify-center gap-2">
             Kembali Belanja <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
