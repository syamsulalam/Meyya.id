import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Copy, ArrowRight, Truck } from 'lucide-react';

export default function Order() {
  const { id } = useParams();

  // Mock checking if order is "transfer" and unpaid or paid
  // Let's assume order ID starts with 9 means transfer pending, else paid
  const isTransfer = id?.startsWith('9');
  const isPaid = !isTransfer;

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
          {isPaid ? 'Pesanan Berhasil Dibayar' : 'Menunggu Pembayaran'}
        </h1>
        <p className="text-sm opacity-60 mb-8 font-mono">Order ID: #{id}</p>

        {isTransfer ? (
          <div className="text-left bg-orange-50/50 border border-orange-100 p-6 md:p-8 rounded-3xl mb-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-orange-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
               Selesaikan Pembayaran Anda
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-widest">Bank Tujuan (BCA)</p>
                <div className="flex items-center justify-between bg-white border border-black/10 p-4 rounded-xl">
                  <span className="font-mono text-lg tracking-wider">8273 1928 321</span>
                  <button className="text-ink hover:text-black flex items-center gap-1 text-xs font-semibold uppercase bg-black/5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Copy size={14} /> Salin
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">a.n. PT Alam Pintar Nusantara</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1 tracking-widest">Total Bayar</p>
                <div className="flex items-center justify-between bg-white border border-black/10 p-4 rounded-xl">
                  <span className="font-mono text-xl tracking-tight text-ink font-bold">
                    Rp 350.<span className="text-red-500">123</span>
                  </span>
                  <button className="text-ink hover:text-black flex items-center gap-1 text-xs font-semibold uppercase bg-black/5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    <Copy size={14} /> Salin
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-2 font-medium">Penting: Transfer tepat hingga 3 digit terakhir!</p>
              </div>
              
              <div className="bg-white/60 text-xs p-4 rounded-xl text-gray-600 border border-black/5 leading-relaxed">
                Pesanan akan diverifikasi otomatis dalam 10 menit setelah transfer berhasil. Pastikan nominal sesuai hingga 3 angka terakhir.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-left bg-emerald-50/50 border border-emerald-100 p-6 md:p-8 rounded-3xl mb-8 flex flex-col items-center justify-center text-center">
            <Truck size={32} className="text-emerald-500 mb-4" />
            <h2 className="text-lg font-medium text-emerald-800 mb-2">Pesanan Diproses</h2>
            <p className="text-sm text-emerald-700/80 mb-6 max-w-sm mx-auto">Kami sedang mengemas pesanan Anda dengan penuh cinta. Anda akan menerima notifikasi saat paket dikirim.</p>
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
