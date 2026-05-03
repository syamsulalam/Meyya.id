import React, { useState } from 'react';
import { MessageSquare, ExternalLink, RefreshCw, Send, Users, AlertCircle, Bug } from 'lucide-react';
import useSWR from 'swr';
import { useAuthFetcher } from '../../hooks/useAuthFetch';

export default function AdminMarketingPanel() {
  const fetcher = useAuthFetcher();
  const { data: dbUsers, isLoading, mutate } = useSWR('/api/admin/users', fetcher);
  
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const rawTargets = Array.isArray(dbUsers) ? dbUsers : [];
  
  // Transform users to targets if they have a phone, otherwise use mock context for demo
  const targets = rawTargets.map((u: any, i: number) => {
      // simulate realistic scenarios if there's no real transaction data yet
      const scenarios = [
        { context: 'Keranjang Tertinggal Rp 250.000', tag: 'abandoned_cart', tagColor: 'bg-red-100 text-red-800' },
        { context: 'Belum transfer (Rp 175.123)', tag: 'pending_payment', tagColor: 'bg-orange-100 text-orange-800' },
        { context: 'Ulang Tahun besok', tag: 'birthday', tagColor: 'bg-indigo-100 text-indigo-800' },
        { context: 'VIP (LTV > 5Jt), belum order 2 bulan', tag: 'vip_retention', tagColor: 'bg-emerald-100 text-emerald-800' },
        { context: `Client Aktif terdaftar sejak ${new Date(u.joinDate).toLocaleDateString('id-ID')}`, tag: 'engaged', tagColor: 'bg-blue-100 text-blue-800' }
      ];
      
      const phoneRaw = u.phone_wa || '';
      // Clean phone number for whatsapp
      let cleanPhone = phoneRaw.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: cleanPhone,
        ...scenarios[i % scenarios.length]
      };
  });

  const generateMessage = (target: any) => {
    switch (target.tag) {
      case 'abandoned_cart':
        return `Halo Kak ${target.name}, keranjang belanjanya di Meyya.id masih terbuka nih. Aku kasih penawaran spesial diskon 5% pakai kode MEYYA5 ya, khusus hari ini! Yuk checkout sekarang 😊`;
      case 'pending_payment':
        return `Hai Kak ${target.name}, pesanan kakak sudah masuk nih senilai ${target.context.match(/\(([^)]+)\)/)?.[1] || '-'}. Boleh difotokan bukti transfernya kesini biar kita bisa langsung packing siang ini? Terima kasih! 📦`;
      case 'birthday':
        return `Selamat ulang tahun Kak ${target.name} (untuk besok)! 🎉 MEYYA.ID mau kasih kado spesial nih, diskon 20% tanpa minimal belanja pakai kode BDAYMEYYA. Berlaku 3 hari ya kak!`;
      case 'vip_retention':
        return `Halo Kakak VIP ${target.name}! Kita baru launching koleksi *Summer Silk* yang sepertinya cocok sama gaya Kakak. Yuk mampir dan cek koleksi terbarunya, ada exclusive preview buat kakak lho...`;
      default:
        return `Halo Kak ${target.name}, terima kasih telah bergabung dengan Meyya!`;
    }
  };

  const handleSelectTarget = (target: any) => {
    setSelectedTarget(target);
    setCustomMessage(generateMessage(target));
  };

  const handleSendWA = () => {
    if (!selectedTarget) return;
    const url = `https://wa.me/${selectedTarget.phone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2">
            <MessageSquare size={24} /> WhatsApp Marketing CRM
          </h2>
          <p className="text-sm font-light text-black/60">Kirim reminder langsung ke pelanggan menggunakan WhatsApp Web yang terintegrasi dengan Database Users (D1).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDebug(!showDebug)} className={`px-4 py-2 text-xs rounded-full font-medium transition-colors border ${showDebug ? 'border-ink bg-black/5 text-ink' : 'border-black/10 text-gray-400 hover:text-ink hover:bg-black/5'}`}>
            <Bug size={14} className="inline mr-1" /> Debug D1 Data
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="bg-black text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto max-h-[300px]">
           <p className="mb-2 text-gray-400">// Debug: RAW Users Data dari D1</p>
           {isLoading ? 'Loading users from D1...' : JSON.stringify(rawTargets, null, 2)}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar: Targets */}
        <div className="w-full lg:w-1/3 bg-white/40 border border-black/5 rounded-[2rem] p-4 flex flex-col overflow-hidden">
           <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="font-semibold text-sm uppercase tracking-widest text-ink flex items-center gap-2">
               <Users size={16} /> Prioritas Hari Ini {targets.length > 0 && `(${targets.length})`}
             </h3>
             <button onClick={() => mutate()} className="text-gray-400 hover:text-ink"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {isLoading && <p className="text-sm text-center py-8 text-black/40">⏳ Memuat pelanggan dari D1...</p>}
             {!isLoading && targets.length === 0 && <p className="text-sm text-center py-8 text-black/40">Belum ada pelanggan terdaftar.</p>}
             
             {targets.map((target: any) => (
               <div 
                 key={target.id}
                 onClick={() => handleSelectTarget(target)}
                 className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedTarget?.id === target.id ? 'bg-white border-black/20 shadow-sm' : 'bg-transparent border-black/5 hover:bg-white/50'}`}
               >
                 <div className="flex justify-between items-start mb-1">
                   <h4 className="font-semibold text-sm tracking-tight line-clamp-1">{target.name}</h4>
                   <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${target.tagColor}`}>
                     {target.tag.replace('_', ' ')}
                   </span>
                 </div>
                 <p className="text-xs text-black/60 font-medium mb-2">{target.phone}</p>
                 <p className="text-[10px] text-gray-500 bg-black/5 p-2 rounded-lg italic flex items-center gap-1.5 line-clamp-2"><AlertCircle size={12} className="shrink-0" /> {target.context}</p>
               </div>
             ))}
           </div>
        </div>

        {/* Right Section: Composer & Preview */}
        <div className="w-full lg:w-2/3 bg-white/40 border border-black/5 rounded-[2rem] overflow-hidden flex flex-col relative">
          
          {selectedTarget ? (
            <>
              {/* Fake WhatsApp Header */}
              <div className="bg-[#f0f2f5] p-4 flex items-center gap-4 border-b border-black/5 flex-shrink-0">
                 <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                   {selectedTarget.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-semibold text-sm text-[#111b21]">{selectedTarget.name}</h3>
                   <p className="text-xs text-gray-500">{selectedTarget.phone}</p>
                 </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 bg-[#efeae2] p-4 flex flex-col justify-end min-h-[300px]" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(239, 234, 226, 0.95)' }}>
                 <div className="bg-[#d9fdd3] p-3 rounded-2xl rounded-tr-none self-end max-w-[80%] shadow-sm relative mb-2">
                   <p className="text-sm text-[#111b21] whitespace-pre-wrap">{customMessage}</p>
                   <span className="text-[10px] text-gray-500 float-right mt-1 ml-4 block opacity-70">10:45</span>
                 </div>
              </div>

              {/* Composer */}
              <div className="bg-[#f0f2f5] p-4 flex gap-3 flex-shrink-0">
                <textarea 
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="flex-1 bg-white rounded-xl py-3 px-4 resize-none h-[60px] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ketik pesan..."
                  disabled={!selectedTarget.phone}
                />
                <button 
                  onClick={handleSendWA}
                  disabled={!selectedTarget.phone}
                  className={`w-12 h-12 text-white rounded-full flex items-center justify-center transition-colors shrink-0 flex-col gap-0.5 shadow-sm mt-auto ${selectedTarget.phone ? 'bg-[#00a884] hover:bg-[#008f6f]' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  <Send size={18} className="-ml-1" />
                </button>
              </div>

              {!selectedTarget.phone && (
                <div className="absolute top-16 right-4 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs shadow-lg max-w-[200px] z-10">
                  <p className="font-semibold mb-1 flex items-center gap-1"><AlertCircle size={14}/> Tidak Bisa Chat</p>
                  <p>Pelanggan ini belum mendaftarkan nomor WhatsApp.</p>
                </div>
              )}
{selectedTarget.phone && (
              <div className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-black/10 text-xs shadow-lg max-w-[200px] text-gray-600 z-10">
                 <p className="font-semibold mb-1 text-ink flex items-center gap-1"><ExternalLink size={14}/> Info Penting</p>
                 <p>Tombol kirim akan membuka tab baru ke <b>web.whatsapp.com</b> atau aplikasi <b>WhatsApp Desktop</b> karena batasan iFrame browser.</p>
              </div>
)}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
               <MessageSquare size={48} className="text-gray-300 mb-4" />
               <h3 className="text-lg font-medium text-gray-400">Pilih Kontak di Sebelah Kiri</h3>
               <p className="text-sm text-gray-400 mt-2 max-w-sm">Pilih target pelanggan dari list prioritas untuk mulai mengirim pesan WhatsApp personal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
