import React, { useEffect, useState } from 'react';
import { MessageSquare, ExternalLink, RefreshCw, Send, Users, AlertCircle, Bug, Phone, Save } from 'lucide-react';
import useSWR from 'swr';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';
import { useStore } from '../../store';
import {
  AbandonedCartTooltip,
  BirthdayTooltip,
  CampaignTouchTooltip,
  CrmTooltip,
  DebugDataTooltip,
  ExplainedLabel,
  LtvTooltip,
  SupportWhatsAppTooltip,
} from '../term-tooltips';

export default function AdminMarketingPanel() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;
  const { addToast } = useStore();
  const { data: dbUsers, isLoading, mutate } = useSWR(authReady ? '/api/admin/users' : null, fetcher);
  const { data: analyticsData } = useSWR(authReady ? '/api/admin/analytics?days=14' : null, fetcher);
  const { data: verificationSettings, mutate: mutateVerificationSettings } = useSWR(authReady ? '/api/admin/verification-settings' : null, fetcher);
  
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [supportWhatsappInput, setSupportWhatsappInput] = useState('');
  const [contactWhatsappInput, setContactWhatsappInput] = useState('');
  const [contactUsesSupportWhatsapp, setContactUsesSupportWhatsapp] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (verificationSettings?.support_whatsapp) {
      setSupportWhatsappInput(verificationSettings.support_whatsapp);
    }
    if (verificationSettings?.contact_whatsapp) {
      setContactWhatsappInput(verificationSettings.contact_whatsapp);
    }
    if (verificationSettings?.contact_uses_support_whatsapp !== undefined) {
      setContactUsesSupportWhatsapp(Boolean(verificationSettings.contact_uses_support_whatsapp));
    }
  }, [verificationSettings?.support_whatsapp, verificationSettings?.contact_whatsapp, verificationSettings?.contact_uses_support_whatsapp]);

  const rawTargets = Array.isArray(dbUsers) ? dbUsers : [];
  
  const targets = rawTargets.flatMap((u: any) => {
      const phoneRaw = u.phone_wa || '';
      let cleanPhone = phoneRaw.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);

      const daysSinceLastOrder = u.lastActive ? Math.floor((Date.now() - new Date(u.lastActive).getTime()) / 86400000) : null;
      let scenario: any = null;

      if (u.pendingOrders > 0) {
        scenario = {
          context: `${u.pendingOrders} pesanan menunggu pembayaran senilai Rp ${(u.pendingAmount || 0).toLocaleString('id-ID')}`,
          tag: 'pending_payment',
          tagColor: 'bg-orange-100 text-orange-800'
        };
      } else if (u.abandonedCart) {
        const cartItemCount = Number(u.cartSnapshot?.itemCount || 0);
        const cartSubtotal = Number(u.cartSnapshot?.subtotal || 0);
        scenario = {
          context: `Keranjang ${cartItemCount} item senilai Rp ${cartSubtotal.toLocaleString('id-ID')} belum checkout ${u.cartAgeHours || 0} jam lalu`,
          tag: 'abandoned_cart',
          tagColor: 'bg-amber-100 text-amber-800'
        };
      } else if (u.birthday?.daysUntil <= 14) {
        scenario = {
          context: u.birthday.isToday ? 'Ulang tahun pelanggan hari ini' : `Ulang tahun pelanggan ${u.birthday.daysUntil} hari lagi`,
          tag: 'birthday',
          tagColor: 'bg-pink-100 text-pink-800'
        };
      } else if ((u.ltv || 0) >= 5000000 && daysSinceLastOrder !== null && daysSinceLastOrder >= 60) {
        scenario = {
          context: `VIP LTV Rp ${(u.ltv || 0).toLocaleString('id-ID')}, belum order ${daysSinceLastOrder} hari`,
          tag: 'vip_retention',
          tagColor: 'bg-emerald-100 text-emerald-800'
        };
      } else if ((u.orders || 0) === 0 && u.joinDate) {
        scenario = {
          context: `Pelanggan baru terdaftar sejak ${new Date(u.joinDate).toLocaleDateString('id-ID')}`,
          tag: 'new_customer',
          tagColor: 'bg-blue-100 text-blue-800'
        };
      }

      if (!scenario) return [];
      
      return [{
        id: u.id,
        name: u.name,
        email: u.email,
        phone: cleanPhone,
        phoneVerified: Boolean(u.phoneWaVerifiedAt),
        birthDate: u.birthDate,
        cartSnapshot: u.cartSnapshot,
        ...scenario
      }];
  });

  const generateMessage = (target: any) => {
    const leadCartItem = getLeadCartItem(target.cartSnapshot);
    switch (target.tag) {
      case 'pending_payment':
        return `Hai Kak ${target.name}, pesanan kakak di Meyya.id masih menunggu pembayaran. Jika sudah transfer, boleh kirim bukti transfer di sini agar bisa segera kami proses. Terima kasih.`;
      case 'abandoned_cart':
        return `Hai Kak ${target.name}, ${leadCartItem ? `${leadCartItem.product_name} masih ada di keranjang Kakak` : 'keranjang belanja Kakak di Meyya.id masih tersimpan'}${target.cartSnapshot?.subtotal ? ` senilai Rp ${target.cartSnapshot.subtotal.toLocaleString('id-ID')}` : ''}. Kalau masih bingung memilih ukuran, warna, atau bahan, kami bisa bantu rekomendasikan sebelum checkout.`;
      case 'birthday':
        return `Halo Kak ${target.name}, bulan spesial Kakak sudah dekat. Tim Meyya.id ingin kirim voucher birthday khusus supaya Kakak bisa pilih koleksi favorit dengan harga lebih ringan.`;
      case 'vip_retention':
        return `Halo Kak ${target.name}, terima kasih sudah menjadi pelanggan setia Meyya.id. Kami baru menyiapkan koleksi terbaru yang mungkin cocok untuk Kakak. Silakan mampir lagi saat sempat ya.`;
      case 'new_customer':
        return `Halo Kak ${target.name}, terima kasih sudah bergabung dengan Meyya.id. Jika butuh rekomendasi ukuran, bahan, atau styling, kami siap bantu di sini.`;
      default:
        return `Halo Kak ${target.name}, terima kasih telah bergabung dengan Meyya!`;
    }
  };

  const handleSelectTarget = (target: any) => {
    setSelectedTarget(target);
    setCustomMessage(generateMessage(target));
  };

  const handleSendWA = async () => {
    if (!selectedTarget) return;
    try {
      await authFetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'CAMPAIGN_TOUCH',
          target_clerk_id: selectedTarget.id,
          campaign_tag: selectedTarget.tag,
          metadata: {
            channel: 'WHATSAPP',
            message: customMessage,
            phone_verified: Boolean(selectedTarget.phoneVerified),
          },
        }),
      });
      mutate();
    } catch (error) {
      console.error('Failed to record campaign touch:', error);
    }
    const url = `https://wa.me/${selectedTarget.phone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  const saveVerificationSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await authFetch('/api/admin/verification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          support_whatsapp: supportWhatsappInput,
          contact_whatsapp: contactUsesSupportWhatsapp ? supportWhatsappInput : contactWhatsappInput,
          contact_uses_support_whatsapp: contactUsesSupportWhatsapp,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Gagal menyimpan nomor verifikasi.');
      setSupportWhatsappInput(payload.support_whatsapp || supportWhatsappInput);
      setContactWhatsappInput(payload.contact_whatsapp || contactWhatsappInput);
      setContactUsesSupportWhatsapp(Boolean(payload.contact_uses_support_whatsapp));
      await mutateVerificationSettings();
      addToast('Nomor WhatsApp Meyya disimpan.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Gagal menyimpan nomor verifikasi.', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2">
            <MessageSquare size={24} />
            <ExplainedLabel tooltip={<CrmTooltip />}>WhatsApp Marketing CRM</ExplainedLabel>
          </h2>
          <p className="text-sm font-light text-black/60">Kirim reminder langsung ke pelanggan menggunakan WhatsApp Web yang terintegrasi dengan Database Users (D1).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDebug(!showDebug)} className={`px-4 py-2 text-xs rounded-full font-medium transition-colors border ${showDebug ? 'border-ink bg-black/5 text-ink' : 'border-black/10 text-gray-400 hover:text-ink hover:bg-black/5'}`}>
            <Bug size={14} className="inline mr-1" />
            <ExplainedLabel tooltip={<DebugDataTooltip />}>Debug D1 Data</ExplainedLabel>
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="bg-black text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto max-h-[300px]">
           <p className="mb-2 text-gray-400">// Debug: RAW Users Data dari D1</p>
           {!authReady ? 'Waiting for admin session...' : isLoading ? 'Loading users from D1...' : JSON.stringify(rawTargets, null, 2)}
        </div>
      )}

      <div className="rounded-3xl bg-white/45 border border-black/5 p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-ink flex items-center gap-2">
              <Phone size={16} />
              <ExplainedLabel tooltip={<SupportWhatsAppTooltip />}>Nomor Verifikasi Meyya</ExplainedLabel>
            </h3>
            <p className="text-xs text-black/50 mt-1">Nomor verifikasi customer dan nomor kontak resmi publik bisa sama atau dipisah.</p>
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-[420px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={supportWhatsappInput}
                onChange={(event) => {
                  setSupportWhatsappInput(event.target.value);
                  if (contactUsesSupportWhatsapp) setContactWhatsappInput(event.target.value);
                }}
                placeholder="WA verifikasi 62812..."
                className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-ink"
              />
              <input
                value={contactUsesSupportWhatsapp ? supportWhatsappInput : contactWhatsappInput}
                onChange={(event) => setContactWhatsappInput(event.target.value)}
                disabled={contactUsesSupportWhatsapp}
                placeholder="WA kontak resmi 62812..."
                className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-ink disabled:opacity-60"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-black/55">
              <input
                type="checkbox"
                checked={contactUsesSupportWhatsapp}
                onChange={(event) => {
                  setContactUsesSupportWhatsapp(event.target.checked);
                  if (event.target.checked) setContactWhatsappInput(supportWhatsappInput);
                }}
              />
              Pakai nomor verifikasi sebagai nomor kontak resmi.
            </label>
            <button
              type="button"
              onClick={saveVerificationSettings}
              disabled={settingsSaving || !supportWhatsappInput}
              className="px-5 py-2.5 rounded-full bg-ink text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={13} /> Simpan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <AnalyticsCard
          label="Event 14 Hari"
          value={sumMetric(analyticsData?.eventsByType, 'events')}
          note="Dari agregat harian"
        />
        <AnalyticsCard
          label="User Aktif"
          value={sumMetric(analyticsData?.daily, 'users')}
          note="Unique per hari"
        />
        <AnalyticsCard
          label="Source Teratas"
          value={analyticsData?.topSources?.[0]?.source || '-'}
          note={`${formatNumber(analyticsData?.topSources?.[0]?.events || 0)} event`}
        />
        <AnalyticsCard
          label="Event Teratas"
          value={formatEventType(analyticsData?.eventsByType?.[0]?.event_type)}
          note={`${formatNumber(analyticsData?.eventsByType?.[0]?.events || 0)} event`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-4">
        <TrendChart
          title="Tren Source"
          subtitle="Event per source dalam 14 hari"
          series={analyticsData?.sourceTrend || []}
        />
        <FunnelChart steps={analyticsData?.conversionFunnel || []} />
      </div>

      <TrendChart
        title="Tren Campaign"
        subtitle="Campaign dari UTM/campaign tag yang sudah masuk aggregate"
        series={analyticsData?.campaignTrend || []}
        emptyText="Belum ada campaign UTM/tag yang terekam."
      />

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar: Targets */}
        <div className="w-full lg:w-1/3 bg-white/40 border border-black/5 rounded-[2rem] p-4 flex flex-col overflow-hidden">
           <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="font-semibold text-sm uppercase tracking-widest text-ink flex items-center gap-2">
               <Users size={16} />
               <ExplainedLabel tooltip={<CampaignTouchTooltip />}>Prioritas Hari Ini</ExplainedLabel> {targets.length > 0 && `(${targets.length})`}
             </h3>
             <button onClick={() => mutate()} className="text-gray-400 hover:text-ink"><RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {!authReady && <p className="text-sm text-center py-8 text-black/40">⏳ Menunggu sesi admin...</p>}
             {authReady && isLoading && <p className="text-sm text-center py-8 text-black/40">⏳ Memuat pelanggan dari D1...</p>}
             {authReady && !isLoading && targets.length === 0 && <p className="text-sm text-center py-8 text-black/40">Belum ada target berbasis data nyata untuk hari ini.</p>}
             
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
                 <span className={`inline-flex mb-2 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold ${target.phoneVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                   {target.phoneVerified ? 'WA verified' : 'WA unverified'}
                 </span>
                 <p className="text-[10px] text-gray-500 bg-black/5 p-2 rounded-lg italic flex items-center gap-1.5 line-clamp-2">
                  <AlertCircle size={12} className="shrink-0" />
                  {target.context}
                  {target.tag === 'abandoned_cart' && <AbandonedCartTooltip />}
                  {target.tag === 'birthday' && <BirthdayTooltip />}
                  {target.tag === 'vip_retention' && <LtvTooltip />}
                 </p>
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
                   <p className="text-xs text-gray-500">{selectedTarget.phone} • {selectedTarget.phoneVerified ? 'verified' : 'unverified'}</p>
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

function getLeadCartItem(cartSnapshot: any) {
  const items = Array.isArray(cartSnapshot?.items) ? cartSnapshot.items : [];
  if (items.length === 0) return null;
  return [...items].sort((a: any, b: any) =>
    (Number(b.price || 0) * Number(b.quantity || 0)) - (Number(a.price || 0) * Number(a.quantity || 0))
  )[0];
}

function AnalyticsCard({ label, value, note }: { label: string; value: any; note: string }) {
  return (
    <div className="rounded-2xl bg-white/50 border border-black/5 p-4">
      <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold mb-1">{label}</p>
      <p className="text-lg font-semibold text-ink truncate">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-xs text-black/45 mt-1">{note}</p>
    </div>
  );
}

function sumMetric(rows: any[] = [], key: string) {
  return rows.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);
}

function formatNumber(value: any) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatEventType(value: any) {
  return String(value || '-').replace(/_/g, ' ').toLowerCase();
}

function TrendChart({ title, subtitle, series, emptyText = 'Belum ada data tren.' }: { title: string; subtitle: string; series: any[]; emptyText?: string }) {
  const maxValue = Math.max(1, ...series.flatMap((item) => (item.points || []).map((point: any) => Number(point.events || 0))));
  const colors = ['bg-ink', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];

  return (
    <div className="rounded-3xl bg-white/45 border border-black/5 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">{title}</h3>
          <p className="text-xs text-black/45 mt-1">{subtitle}</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-black/35">Aggregate</span>
      </div>
      {series.length === 0 ? (
        <div className="rounded-2xl bg-white/60 border border-dashed border-black/10 p-6 text-center text-sm text-black/45">{emptyText}</div>
      ) : (
        <div className="space-y-4">
          {series.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-ink truncate">{item.label}</span>
                <span className="font-mono text-black/45">{formatNumber(item.total)} event</span>
              </div>
              <div className="grid grid-flow-col auto-cols-fr gap-1 h-20 items-end rounded-2xl bg-white/60 border border-black/5 p-2">
                {(item.points || []).map((point: any) => (
                  <div key={`${item.label}-${point.date}`} className="flex h-full items-end" title={`${point.date}: ${formatNumber(point.events)} event`}>
                    <div
                      className={`w-full rounded-t-md min-h-[3px] ${colors[index % colors.length]}`}
                      style={{ height: `${Math.max(3, (Number(point.events || 0) / maxValue) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelChart({ steps }: { steps: any[] }) {
  const firstEvents = Number(steps?.[0]?.events || 0);

  return (
    <div className="rounded-3xl bg-white/45 border border-black/5 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Conversion Funnel</h3>
          <p className="text-xs text-black/45 mt-1">Lihat produk sampai order dibuat</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-black/35">Sederhana</span>
      </div>
      {steps.length === 0 || firstEvents === 0 ? (
        <div className="rounded-2xl bg-white/60 border border-dashed border-black/10 p-6 text-center text-sm text-black/45">Belum ada event funnel yang cukup.</div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.key} className="rounded-2xl bg-white/60 border border-black/5 p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{step.label}</p>
                  <p className="text-[10px] uppercase tracking-widest text-black/35">{formatEventType(step.key)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatNumber(step.events)}</p>
                  <p className="text-[10px] text-black/40">{step.totalRate}% dari awal</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(2, Number(step.totalRate || 0))}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-black/40">Konversi dari step sebelumnya: {step.previousRate}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
