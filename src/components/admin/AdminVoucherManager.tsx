import React, { useState } from 'react';
import { Plus, Tag, Trash2, Edit2, Clock, Percent, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useStore } from '../../store';
import { useAuthFetcher, useAuthFetch } from '../../hooks/useAuthFetch';
import { useAuth } from '@clerk/react';
import {
  ClerkIdTooltip,
  ExplainedLabel,
  SegmentTooltip,
  VoucherTooltip,
} from '../term-tooltips';

type VoucherType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';

interface Voucher {
  id: string;
  code: string;
  name: string;
  type: VoucherType;
  value: number; // Percentage or IDR amount
  minPurchase: number;
  maxDiscount?: number; // Only for percentage
  startDate: string;
  endDate: string;
  usageLimit: number; // 0 = unlimited
  usedCount: number;
  isActive: boolean;
  targetUserRole: 'ALL' | 'NEW_USER' | 'VIP' | 'BIRTHDAY'; // Simple targeting
  targetClerkId?: string;
  targetSegment?: string;
  disableStartDate?: boolean;
  disableEndDate?: boolean;
  birthdayClaimWindowDays?: number;
  applicableProductIds?: number[];
}

export default function AdminVoucherManager() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;
  const { data: dbVouchers, error, isLoading } = useSWR(authReady ? '/api/admin/vouchers' : null, fetcher);
  const { data: couponCampaigns, mutate: mutateCampaigns } = useSWR(authReady ? '/api/admin/coupon-campaigns' : null, fetcher);
  const { data: wheelPrizes, mutate: mutateWheelPrizes } = useSWR(authReady ? '/api/admin/wheel-prizes' : null, fetcher);
  const { data: riskLogs } = useSWR(authReady ? '/api/admin/coupon-risk-logs?decision=BLOCK' : null, fetcher);
  const { data: productsData } = useSWR('/api/products', (url: string) => fetch(url).then((res) => res.json()));
  const vouchers = Array.isArray(dbVouchers) ? dbVouchers : [];
  const products = Array.isArray(productsData) ? productsData : (productsData?.products || []);
  const { addToast, showConfirm } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formVoucher, setFormVoucher] = useState<Partial<Voucher>>({
    type: 'PERCENTAGE',
    targetUserRole: 'ALL',
    isActive: true,
    minPurchase: 0,
    usageLimit: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    birthdayClaimWindowDays: 7,
    applicableProductIds: [],
  });

  const handleEdit = (v: any) => {
    setFormVoucher({
      ...v,
      startDate: v.startDate ? v.startDate.split('T')[0] : '',
      endDate: v.endDate ? v.endDate.split('T')[0] : '',
      disableStartDate: !v.startDate,
      disableEndDate: !v.endDate,
      birthdayClaimWindowDays: Number(v.birthdayClaimWindowDays || 0),
      applicableProductIds: Array.isArray(v.applicableProductIds) ? v.applicableProductIds.map(Number) : [],
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const NumberInput = ({ value, onChange, placeholder, prefixClassName }: any) => {
    const displayValue = value ? value.toLocaleString('id-ID') : '';
    return (
      <input 
        type="text" 
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '');
          onChange(raw ? parseInt(raw, 10) : 0);
        }}
        placeholder={placeholder}
        className={prefixClassName || "w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink"}
      />
    );
  };

  const [loading, setLoading] = useState(false);
  const [savingCampaignKey, setSavingCampaignKey] = useState<string | null>(null);
  const [editingCampaignKey, setEditingCampaignKey] = useState<string | null>(null);
  const [campaignDraft, setCampaignDraft] = useState<any>(null);
  const [editingPrizeKey, setEditingPrizeKey] = useState<string | null>(null);
  const [prizeDraft, setPrizeDraft] = useState<any>(null);
  const [manualEntitlementClerkId, setManualEntitlementClerkId] = useState('');
  const [manualEntitlementReason, setManualEntitlementReason] = useState('');
  const [issuingManualEntitlement, setIssuingManualEntitlement] = useState(false);

  const toggleCampaign = async (campaign: any) => {
    setSavingCampaignKey(campaign.key);
    try {
      const res = await authFetch('/api/admin/coupon-campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: campaign.key, enabled: !Boolean(campaign.enabled) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal update campaign');
      mutateCampaigns();
      mutate('/api/admin/vouchers');
      addToast(`Campaign ${campaign.key} ${campaign.enabled ? 'dinonaktifkan' : 'diaktifkan'}.`, 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setSavingCampaignKey(null);
    }
  };

  const beginCampaignEdit = (campaign: any) => {
    const metadata = parseJson(campaign.metadata, {});
    setEditingCampaignKey(campaign.key);
    setCampaignDraft({
      ...campaign,
      enabled: Number(campaign.enabled || 0) === 1,
      requires_verified_wa: Number(campaign.requires_verified_wa || 0) === 1,
      discount_value: Number(campaign.discount_value || 0),
      min_purchase: Number(campaign.min_purchase || 0),
      max_discount: campaign.max_discount === null || campaign.max_discount === undefined ? 0 : Number(campaign.max_discount || 0),
      expires_in_days: Number(campaign.expires_in_days || 0),
      usage_limit_per_user: Number(campaign.usage_limit_per_user || 0),
      risk_block_threshold: Number(campaign.risk_block_threshold || 70),
      birthday_claim_window_days: Number(campaign.birthday_claim_window_days || 0),
      brand_month: Number(metadata.month || 1),
      brand_day: Number(metadata.day || 1),
      window_before_days: Number(metadata.window_before_days || 3),
      window_after_days: Number(metadata.window_after_days || 7),
    });
  };

  const saveCampaignDraft = async () => {
    if (!campaignDraft?.key) return;
    setSavingCampaignKey(campaignDraft.key);
    try {
      const metadata = campaignDraft.key === 'MEYYABDAY'
        ? {
            month: Number(campaignDraft.brand_month || 1),
            day: Number(campaignDraft.brand_day || 1),
            window_before_days: Number(campaignDraft.window_before_days || 0),
            window_after_days: Number(campaignDraft.window_after_days || 0),
          }
        : parseJson(campaignDraft.metadata, {});
      const res = await authFetch('/api/admin/coupon-campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: campaignDraft.key,
          enabled: campaignDraft.enabled,
          title: campaignDraft.title,
          description: campaignDraft.description,
          discount_type: campaignDraft.discount_type,
          discount_value: campaignDraft.discount_value,
          min_purchase: campaignDraft.min_purchase,
          max_discount: Number(campaignDraft.max_discount || 0) > 0 ? Number(campaignDraft.max_discount || 0) : null,
          expires_in_days: campaignDraft.expires_in_days,
          usage_limit_per_user: campaignDraft.usage_limit_per_user,
          requires_verified_wa: campaignDraft.requires_verified_wa,
          risk_block_threshold: campaignDraft.risk_block_threshold,
          birthday_claim_window_days: campaignDraft.birthday_claim_window_days,
          metadata,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan campaign');
      mutateCampaigns();
      mutate('/api/admin/vouchers');
      setEditingCampaignKey(null);
      setCampaignDraft(null);
      addToast('Campaign berhasil disimpan.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setSavingCampaignKey(null);
    }
  };

  const beginPrizeEdit = (prize: any) => {
    const metadata = parseJson(prize.metadata, {});
    setEditingPrizeKey(prize.key);
    setPrizeDraft({
      ...prize,
      enabled: Number(prize.enabled || 0) === 1,
      discount_value: Number(prize.discount_value || 0),
      min_purchase: Number(prize.min_purchase || 0),
      weight_first_spin: Number(prize.weight_first_spin || 0),
      weight_repeat_spin: Number(prize.weight_repeat_spin || 0),
      expires_in_days: Number(prize.expires_in_days || 0),
      product_pool_ids: Array.isArray(metadata.product_pool_ids) ? metadata.product_pool_ids.map(Number) : [],
    });
  };

  const savePrizeDraft = async () => {
    if (!prizeDraft?.key) return;
    setSavingCampaignKey(prizeDraft.key);
    try {
      const res = await authFetch('/api/admin/wheel-prizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prizeDraft,
          metadata: {
            ...parseJson(prizeDraft.metadata, {}),
            product_pool_ids: prizeDraft.product_pool_ids || [],
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hadiah wheel');
      mutateWheelPrizes();
      mutate('/api/admin/vouchers');
      setEditingPrizeKey(null);
      setPrizeDraft(null);
      addToast('Hadiah wheel berhasil disimpan.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setSavingCampaignKey(null);
    }
  };

  const issueWelcomeOverride = async (log: any) => {
    try {
      const res = await authFetch('/api/admin/coupon-entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ISSUE',
          campaign_key: 'MEYYAWELCOME',
          clerk_id: log.clerk_id,
          source_type: 'ADMIN_OVERRIDE',
          source_id: `RISKLOG-${log.id}`,
          reason: 'Manual override dari risk log welcome coupon',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal issue entitlement');
      addToast('Welcome coupon berhasil diberikan manual.', 'success');
      mutate('/api/admin/coupon-risk-logs?decision=BLOCK');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const issueManualWelcomeOverride = async () => {
    const clerkId = manualEntitlementClerkId.trim();
    if (!clerkId) return addToast('Clerk ID customer wajib diisi.', 'error');
    setIssuingManualEntitlement(true);
    try {
      const res = await authFetch('/api/admin/coupon-entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ISSUE',
          campaign_key: 'MEYYAWELCOME',
          clerk_id: clerkId,
          source_type: 'ADMIN_OVERRIDE',
          source_id: `MANUAL-${Date.now()}`,
          reason: manualEntitlementReason || 'Manual customer service exception',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal issue entitlement');
      setManualEntitlementClerkId('');
      setManualEntitlementReason('');
      addToast('Welcome coupon manual berhasil diberikan.', 'success');
      mutate('/api/admin/coupon-risk-logs?decision=BLOCK');
      mutate('/api/admin/vouchers');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIssuingManualEntitlement(false);
    }
  };

  const revokeEntitlement = async (entitlementId: string) => {
    try {
      const res = await authFetch('/api/admin/coupon-entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE',
          entitlement_id: entitlementId,
          reason: 'Revoked dari risk log admin viewer',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal revoke entitlement');
      addToast('Entitlement berhasil dicabut.', 'success');
      mutate('/api/admin/coupon-risk-logs?decision=BLOCK');
      mutate('/api/admin/vouchers');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formVoucher.code) return addToast("Kode voucher harus diisi", "error");
    if (formVoucher.targetUserRole === 'BIRTHDAY' && !Number(formVoucher.birthdayClaimWindowDays || 0)) {
      return addToast('Voucher birthday wajib punya batas hari klaim.', 'error');
    }
    setLoading(true);
    try {
      const payload = {
        code: formVoucher.code.toUpperCase(),
        discount_type: formVoucher.type,
        discount_value: formVoucher.value || 0,
        min_purchase: formVoucher.minPurchase || 0,
        max_discount: formVoucher.maxDiscount || null,
        valid_from: formVoucher.disableStartDate || !formVoucher.startDate ? null : formVoucher.startDate,
        valid_until: formVoucher.disableEndDate || !formVoucher.endDate ? null : formVoucher.endDate,
        usage_limit: formVoucher.usageLimit || 0,
        target_user_role: formVoucher.targetUserRole || 'ALL',
        target_clerk_id: formVoucher.targetClerkId || null,
        target_segment: formVoucher.targetUserRole === 'BIRTHDAY' ? 'BIRTHDAY' : formVoucher.targetSegment || null,
        birthday_claim_window_days: formVoucher.targetUserRole === 'BIRTHDAY' ? Number(formVoucher.birthdayClaimWindowDays || 0) : null,
        applicable_product_ids: formVoucher.applicableProductIds || [],
      };

      const res = await authFetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
         const txt = await res.text();
         throw new Error(txt);
      }
      
      mutate('/api/admin/vouchers');
      setShowForm(false);
      setFormVoucher({
        type: 'PERCENTAGE',
        targetUserRole: 'ALL',
        isActive: true,
        minPurchase: 0,
        usageLimit: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        birthdayClaimWindowDays: 7,
        applicableProductIds: [],
      });
      addToast('Voucher berhasil ditambahkan!', 'success');
    } catch (e: any) {
      addToast("Error: " + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    showConfirm({
      title: 'Hapus Voucher',
      message: `Voucher ${code} akan dihapus dari sistem promo.`,
      confirmLabel: 'Hapus',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/vouchers/${encodeURIComponent(code)}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Gagal menghapus');
          mutate('/api/admin/vouchers');
          addToast('Voucher berhasil dihapus!', 'success');
        } catch (e: any) {
          addToast("Error: " + e.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-8 slide-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-light font-heading text-ink">
            <ExplainedLabel tooltip={<VoucherTooltip />}>Manajemen Voucher & Promo</ExplainedLabel>
          </h2>
          <p className="text-sm opacity-60 mt-1">Buat diskon dinamis untuk pelanggan Anda</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setIsEditing(false);
            if(showForm) {
              setFormVoucher({
                type: 'PERCENTAGE', targetUserRole: 'ALL', isActive: true,
                minPurchase: 0, usageLimit: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                birthdayClaimWindowDays: 7,
                applicableProductIds: [],
              });
            }
          }}
          className="bg-ink text-white px-5 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={16} /> Buat Voucher Baru</>}
        </button>
      </div>

      {!authReady && <div className="text-sm px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-200">Menunggu sesi admin...</div>}
      {authReady && isLoading && <div className="text-sm px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-200">Sedang memuat data dari database D1...</div>}
      {authReady && error && <div className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200">Debug (D1 Error): Gagal memuat data. {error.message}</div>}

      {Array.isArray(couponCampaigns) && couponCampaigns.length > 0 && (
        <div className="bg-white/50 p-6 md:p-8 rounded-[2rem] border border-black/5">
          <div className="flex items-start gap-3 mb-5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-medium font-heading">Default Coupon Campaigns</h3>
              <p className="text-sm text-black/55 mt-1">Seed campaign bawaan Meyya. Semua kupon/voucher tetap wajib WhatsApp verified saat dipakai di checkout.</p>
            </div>
          </div>
          <div className="space-y-3">
            {couponCampaigns.map((campaign: any) => {
              const editing = editingCampaignKey === campaign.key && campaignDraft;
              const draft = editing ? campaignDraft : campaign;
              return (
                <div key={campaign.key} className="rounded-2xl border border-black/5 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs font-semibold text-ink">{campaign.key}</p>
                        <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] uppercase tracking-widest text-black/50">{campaign.trigger_type}</span>
                        {Number(campaign.requires_verified_wa || 0) === 1 && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-700">WA verified</span>}
                      </div>
                      {editing ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <input value={draft.title || ''} onChange={e => setCampaignDraft({ ...draft, title: e.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="Judul campaign" />
                          <select value={draft.discount_type || 'PERCENTAGE'} onChange={e => setCampaignDraft({ ...draft, discount_type: e.target.value })} disabled={draft.key === 'REVIEWSPIN'} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/5">
                            <option value="PERCENTAGE">Percentage</option>
                            <option value="FIXED">Fixed</option>
                            <option value="FREE_SHIPPING">Free Shipping</option>
                            <option value="SPIN">Spin</option>
                          </select>
                          <NumberInput value={draft.discount_value} onChange={(value: number) => setCampaignDraft({ ...draft, discount_value: value })} placeholder="Nilai diskon" />
                          <NumberInput value={draft.min_purchase} onChange={(value: number) => setCampaignDraft({ ...draft, min_purchase: value })} placeholder="Minimum belanja" />
                          <NumberInput value={draft.max_discount} onChange={(value: number) => setCampaignDraft({ ...draft, max_discount: value })} placeholder="Maks diskon" />
                          <NumberInput value={draft.expires_in_days} onChange={(value: number) => setCampaignDraft({ ...draft, expires_in_days: value })} placeholder="Expired dalam hari" />
                          <NumberInput value={draft.usage_limit_per_user} onChange={(value: number) => setCampaignDraft({ ...draft, usage_limit_per_user: value })} placeholder="Limit per user" />
                          <NumberInput value={draft.risk_block_threshold} onChange={(value: number) => setCampaignDraft({ ...draft, risk_block_threshold: value })} placeholder="Risk block threshold" />
                          {draft.key === 'BDAYGIFT' && (
                            <NumberInput value={draft.birthday_claim_window_days} onChange={(value: number) => setCampaignDraft({ ...draft, birthday_claim_window_days: value })} placeholder="Window birthday" />
                          )}
                          {draft.key === 'MEYYABDAY' && (
                            <>
                              <NumberInput value={draft.brand_month} onChange={(value: number) => setCampaignDraft({ ...draft, brand_month: value })} placeholder="Bulan ulang tahun Meyya" />
                              <NumberInput value={draft.brand_day} onChange={(value: number) => setCampaignDraft({ ...draft, brand_day: value })} placeholder="Tanggal ulang tahun Meyya" />
                              <NumberInput value={draft.window_before_days} onChange={(value: number) => setCampaignDraft({ ...draft, window_before_days: value })} placeholder="H- window" />
                              <NumberInput value={draft.window_after_days} onChange={(value: number) => setCampaignDraft({ ...draft, window_after_days: value })} placeholder="H+ window" />
                            </>
                          )}
                          <textarea value={draft.description || ''} onChange={e => setCampaignDraft({ ...draft, description: e.target.value })} className="md:col-span-2 xl:col-span-4 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" rows={2} placeholder="Deskripsi campaign" />
                          <label className="flex items-center gap-2 text-xs text-black/60">
                            <input type="checkbox" checked={!!draft.enabled} onChange={e => setCampaignDraft({ ...draft, enabled: e.target.checked })} className="accent-ink" />
                            Aktif
                          </label>
                          <label className="flex items-center gap-2 text-xs text-black/60">
                            <input type="checkbox" checked={!!draft.requires_verified_wa} onChange={e => setCampaignDraft({ ...draft, requires_verified_wa: e.target.checked })} className="accent-ink" />
                            Wajib WA verified
                          </label>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm font-medium">{campaign.title}</p>
                          <p className="mt-1 text-xs text-black/50">{campaign.description}</p>
                          <p className="mt-2 text-xs text-black/60">
                            {campaign.discount_type === 'SPIN' ? 'Spin reward' : `${campaign.discount_type} ${Number(campaign.discount_value || 0).toLocaleString('id-ID')}`}
                            {' '}· Min Rp {Number(campaign.min_purchase || 0).toLocaleString('id-ID')}
                            {Number(campaign.max_discount || 0) > 0 ? ` · Max Rp ${Number(campaign.max_discount || 0).toLocaleString('id-ID')}` : ''}
                            {' '}· Risk block {Number(campaign.risk_block_threshold || 70)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCampaign(campaign)}
                        disabled={savingCampaignKey === campaign.key}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${Number(campaign.enabled || 0) === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-black/45'} disabled:opacity-50`}
                      >
                        {Number(campaign.enabled || 0) === 1 ? 'Aktif' : 'Off'}
                      </button>
                      {editing ? (
                        <>
                          <button type="button" onClick={() => { setEditingCampaignKey(null); setCampaignDraft(null); }} className="rounded-full bg-black/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Batal</button>
                          <button type="button" onClick={saveCampaignDraft} disabled={savingCampaignKey === campaign.key} className="rounded-full bg-ink px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white disabled:opacity-50">Simpan</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => beginCampaignEdit(campaign)} className="rounded-full bg-black/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Edit</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Array.isArray(wheelPrizes) && wheelPrizes.length > 0 && (
        <div className="bg-white/50 p-6 md:p-8 rounded-[2rem] border border-black/5">
          <div className="mb-5">
            <h3 className="text-lg font-medium font-heading">Wheel of Fortune Prizes</h3>
            <p className="text-sm text-black/55 mt-1">Atur hadiah, voucher code, expiry, dan probability untuk first spin dan spin berikutnya.</p>
          </div>
          <div className="space-y-3">
            {wheelPrizes.map((prize: any) => {
              const editing = editingPrizeKey === prize.key && prizeDraft;
              const draft = editing ? prizeDraft : prize;
              return (
                <div key={prize.key} className="rounded-2xl border border-black/5 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs font-semibold text-ink">{prize.key}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${Number(prize.enabled || 0) === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-black/45'}`}>{Number(prize.enabled || 0) === 1 ? 'Aktif' : 'Off'}</span>
                      </div>
                      {editing ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <input value={draft.label || ''} onChange={e => setPrizeDraft({ ...draft, label: e.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" placeholder="Label hadiah" />
                          <input value={draft.voucher_code || ''} onChange={e => setPrizeDraft({ ...draft, voucher_code: e.target.value.toUpperCase() })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-mono uppercase" placeholder="Kode voucher" />
                          <select value={draft.discount_type || 'FIXED'} onChange={e => setPrizeDraft({ ...draft, discount_type: e.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                            <option value="PERCENTAGE">Percentage</option>
                            <option value="FIXED">Fixed</option>
                            <option value="FREE_SHIPPING">Free Shipping</option>
                            <option value="NONE">Zonk / Coba Lagi</option>
                          </select>
                          <NumberInput value={draft.discount_value} onChange={(value: number) => setPrizeDraft({ ...draft, discount_value: value })} placeholder="Nilai hadiah" />
                          <NumberInput value={draft.min_purchase} onChange={(value: number) => setPrizeDraft({ ...draft, min_purchase: value })} placeholder="Min purchase" />
                          <NumberInput value={draft.weight_first_spin} onChange={(value: number) => setPrizeDraft({ ...draft, weight_first_spin: value })} placeholder="Bobot first spin" />
                          <NumberInput value={draft.weight_repeat_spin} onChange={(value: number) => setPrizeDraft({ ...draft, weight_repeat_spin: value })} placeholder="Bobot repeat spin" />
                          <NumberInput value={draft.expires_in_days} onChange={(value: number) => setPrizeDraft({ ...draft, expires_in_days: value })} placeholder="Expired hari" />
                          <select value={draft.max_discount_formula || ''} onChange={e => setPrizeDraft({ ...draft, max_discount_formula: e.target.value || null })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                            <option value="">Tanpa max formula</option>
                            <option value="LAST_ORDER_SUBTOTAL_20_PERCENT">Max 20% transaksi terakhir</option>
                            <option value="LAST_ORDER_SUBTOTAL_10_PERCENT">Max 10% transaksi terakhir</option>
                          </select>
                          <select value={draft.min_purchase_formula || ''} onChange={e => setPrizeDraft({ ...draft, min_purchase_formula: e.target.value || null })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                            <option value="">Min manual</option>
                            <option value="LAST_ORDER_SUBTOTAL">Min transaksi terakhir</option>
                          </select>
                          <label className="flex items-center gap-2 text-xs text-black/60">
                            <input type="checkbox" checked={!!draft.enabled} onChange={e => setPrizeDraft({ ...draft, enabled: e.target.checked })} className="accent-ink" />
                            Aktif
                          </label>
                          {draft.key === 'FREE_PRODUCT_10_LAST_ORDER' && (
                            <div className="md:col-span-2 xl:col-span-4 rounded-2xl border border-black/5 bg-black/[0.02] p-3">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-black/45">Product Pool Hadiah</p>
                              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                                {products.map((product: any) => {
                                  const pool = Array.isArray(draft.product_pool_ids) ? draft.product_pool_ids.map(Number) : [];
                                  const selected = pool.includes(Number(product.id));
                                  return (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        setPrizeDraft({
                                          ...draft,
                                          product_pool_ids: selected ? pool.filter((id: number) => id !== Number(product.id)) : [...pool, Number(product.id)],
                                        });
                                      }}
                                      className={`rounded-xl border px-3 py-2 text-left text-xs ${selected ? 'border-ink bg-ink text-white' : 'border-black/10 bg-white text-ink hover:bg-black/5'}`}
                                    >
                                      <span className="block line-clamp-1 font-medium">{product.name}</span>
                                      <span className={`block text-[10px] ${selected ? 'text-white/70' : 'text-black/45'}`}>Rp {Number(product.base_price || 0).toLocaleString('id-ID')} · Stok {Number(product.stock || 0)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2 text-[10px] text-black/45">Server akan memilih produk aktif, non-preorder, stok tersedia, dan harga maksimal 10% transaksi terakhir customer.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm font-medium">{prize.label}</p>
                          <p className="mt-2 text-xs text-black/60">
                            {prize.voucher_code || 'No voucher'} · {prize.discount_type} {Number(prize.discount_value || 0).toLocaleString('id-ID')}
                            {' '}· First {Number(prize.weight_first_spin || 0)} / Repeat {Number(prize.weight_repeat_spin || 0)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {editing ? (
                        <>
                          <button type="button" onClick={() => { setEditingPrizeKey(null); setPrizeDraft(null); }} className="rounded-full bg-black/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Batal</button>
                          <button type="button" onClick={savePrizeDraft} disabled={savingCampaignKey === prize.key} className="rounded-full bg-ink px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white disabled:opacity-50">Simpan</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => beginPrizeEdit(prize)} className="rounded-full bg-black/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Edit</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Array.isArray(riskLogs) && (
        <div className="bg-white/50 p-6 md:p-8 rounded-[2rem] border border-black/5">
          <div className="mb-5">
            <h3 className="text-lg font-medium font-heading">Welcome Coupon Risk Logs</h3>
            <p className="text-sm text-black/55 mt-1">Audit klaim MEYYAWELCOME yang diblokir oleh risk guard.</p>
          </div>
          {riskLogs.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white/60 px-4 py-6 text-center text-sm text-black/45">Belum ada blocked claim.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40">
                    <th className="pb-3 pr-4 font-medium">Waktu</th>
                    <th className="pb-3 px-4 font-medium">Customer</th>
                    <th className="pb-3 px-4 font-medium">Score</th>
                    <th className="pb-3 px-4 font-medium">Alasan</th>
                    <th className="pb-3 pl-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riskLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-black/5 last:border-0">
                      <td className="py-3 pr-4 text-xs text-black/50">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium">{log.customer_name || log.email || log.clerk_id}</p>
                        <p className="mt-0.5 text-[10px] text-black/40">{log.phone_wa || 'No WA'} {log.phone_wa_verified_at ? '· verified' : ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{Number(log.risk_score || 0)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(log.reasons) ? log.reasons : []).map((reason: string) => (
                            <span key={reason} className="rounded-full bg-black/5 px-2 py-1 text-[10px] text-black/55">{reason}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        {log.active_welcome_entitlement_id ? (
                          <button type="button" onClick={() => revokeEntitlement(log.active_welcome_entitlement_id)} className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-700">
                            Revoke
                          </button>
                        ) : (
                          <button type="button" onClick={() => issueWelcomeOverride(log)} className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                            Override
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white/50 p-6 md:p-8 rounded-[2rem] border border-black/5">
        <div className="mb-5">
          <h3 className="text-lg font-medium font-heading">Manual Entitlement Override</h3>
          <p className="text-sm text-black/55 mt-1">Berikan MEYYAWELCOME manual untuk exception customer service meski tidak ada row risk log.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="text-[10px] uppercase tracking-widest text-black/45 font-semibold">
            <ExplainedLabel tooltip={<ClerkIdTooltip />}>Clerk ID Customer</ExplainedLabel>
            <input
              value={manualEntitlementClerkId}
              onChange={(event) => setManualEntitlementClerkId(event.target.value)}
              placeholder="user_xxx"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal focus:outline-none focus:border-ink"
            />
          </label>
          <label className="text-[10px] uppercase tracking-widest text-black/45 font-semibold">
            Alasan Override
            <input
              value={manualEntitlementReason}
              onChange={(event) => setManualEntitlementReason(event.target.value)}
              placeholder="False positive / CS exception"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm normal-case tracking-normal focus:outline-none focus:border-ink"
            />
          </label>
          <button
            type="button"
            onClick={issueManualWelcomeOverride}
            disabled={issuingManualEntitlement || !manualEntitlementClerkId.trim()}
            className="rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-black/80 disabled:opacity-50"
          >
            {issuingManualEntitlement ? 'Issue...' : 'Issue Welcome'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white/60 p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm slide-down mb-8">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2"><Tag size={20} /> Form Pembuatan Voucher</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Nama Promosi (Opsional)</label>
              <input type="text" value={formVoucher.name || ''} onChange={e => setFormVoucher({...formVoucher, name: e.target.value})} placeholder="Misal: Flash Sale Ramadhan" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">
                <ExplainedLabel tooltip={<VoucherTooltip />}>Kode Voucher (Publik)</ExplainedLabel>
              </label>
              <input type="text" disabled={isEditing} value={formVoucher.code || ''} onChange={e => setFormVoucher({...formVoucher, code: e.target.value.toUpperCase()})} placeholder="Misal: RAMADHAN50" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink uppercase font-mono disabled:opacity-50 disabled:bg-black/5" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Tipe Diskon</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] as VoucherType[]).map(type => (
                  <button 
                    key={type}
                    onClick={() => setFormVoucher({...formVoucher, type})}
                    className={`py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                      formVoucher.type === type ? 'border-ink bg-black/5 text-ink' : 'border-black/10 hover:border-black/30 text-black/60'
                    }`}
                  >
                    {type === 'PERCENTAGE' && <Percent size={14}/>}
                    {type === 'FIXED' && <DollarSign size={14}/>}
                    {type === 'FREE_SHIPPING' && <Tag size={14}/>}
                    {type === 'PERCENTAGE' ? 'Persen (%)' : type === 'FIXED' ? 'Nominal (Rp)' : 'Ongkir'}
                  </button>
                ))}
              </div>
            </div>

            {formVoucher.type !== 'FREE_SHIPPING' && (
              <div>
                 <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Nilai Diskon</label>
                 <div className="relative">
                    {formVoucher.type === 'FIXED' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>}
                    <NumberInput 
                      value={formVoucher.value}
                      onChange={(val: number) => setFormVoucher({...formVoucher, value: val})}
                      placeholder={formVoucher.type === 'PERCENTAGE' ? "Misal: 20" : "Misal: 50.000"}
                      prefixClassName={`w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink ${formVoucher.type === 'FIXED' ? 'pl-10' : ''}`}
                    />
                    {formVoucher.type === 'PERCENTAGE' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-50">%</span>}
                 </div>
              </div>
            )}
            
            {formVoucher.type === 'PERCENTAGE' && (
              <div>
                 <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Maksimal Diskon (Opsional)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>
                    <NumberInput 
                      value={formVoucher.maxDiscount}
                      onChange={(val: number) => setFormVoucher({...formVoucher, maxDiscount: val})}
                      placeholder="Misal: 50.000"
                      prefixClassName="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink"
                    />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika tidak ada batas maksimal</p>
              </div>
            )}

            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Minimal Belanja (Opsional)</label>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-50">Rp</span>
                  <NumberInput 
                     value={formVoucher.minPurchase}
                     onChange={(val: number) => setFormVoucher({...formVoucher, minPurchase: val})}
                     placeholder="Misal: 100.000"
                     prefixClassName="w-full bg-white border border-black/10 rounded-xl py-3 pl-10 px-4 text-sm focus:outline-none focus:border-ink"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tanggal Mulai</label>
                <input type="date" disabled={formVoucher.disableStartDate} value={formVoucher.disableStartDate ? '' : formVoucher.startDate || ''} onChange={e => setFormVoucher({...formVoucher, startDate: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink disabled:bg-black/5 disabled:text-black/30" />
                <label className="mt-2 flex items-center gap-2 text-[11px] text-black/60">
                  <input type="checkbox" checked={!!formVoucher.disableStartDate} onChange={e => setFormVoucher({...formVoucher, disableStartDate: e.target.checked})} className="accent-ink" />
                  Tanpa tanggal mulai
                </label>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium"><Clock size={12} className="inline mr-1" />Tgl Kedaluwarsa</label>
                <input type="date" disabled={formVoucher.disableEndDate} value={formVoucher.disableEndDate ? '' : formVoucher.endDate || ''} onChange={e => setFormVoucher({...formVoucher, endDate: e.target.value})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink disabled:bg-black/5 disabled:text-black/30" />
                <label className="mt-2 flex items-center gap-2 text-[11px] text-black/60">
                  <input type="checkbox" checked={!!formVoucher.disableEndDate} onChange={e => setFormVoucher({...formVoucher, disableEndDate: e.target.checked})} className="accent-ink" />
                  Tanpa kedaluwarsa
                </label>
              </div>
            </div>
            
            <div>
               <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Batas Penggunaan (Kuota)</label>
               <NumberInput 
                  value={formVoucher.usageLimit}
                  onChange={(val: number) => setFormVoucher({...formVoucher, usageLimit: val})}
                  placeholder="Misal: 100 (Kosong/0 = Tanpa Batas)"
               />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">
                <ExplainedLabel tooltip={<SegmentTooltip />}>Target Pengguna</ExplainedLabel>
              </label>
              <select value={formVoucher.targetUserRole || 'ALL'} onChange={e => setFormVoucher({...formVoucher, targetUserRole: e.target.value as any})} className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink">
                <option value="ALL">Semua Pengguna</option>
                <option value="NEW_USER">Pengguna Baru / Belum Pernah Belanja</option>
                <option value="VIP">Pengguna VIP / Pelanggan Setia</option>
                <option value="BIRTHDAY">Birthday / Ulang Tahun</option>
              </select>
            </div>

            {formVoucher.targetUserRole === 'BIRTHDAY' && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Window Klaim Birthday</label>
                <NumberInput
                  value={formVoucher.birthdayClaimWindowDays}
                  onChange={(val: number) => setFormVoucher({ ...formVoucher, birthdayClaimWindowDays: val })}
                  placeholder="Misal: 7 hari setelah ulang tahun"
                />
                <p className="text-[10px] text-gray-500 mt-1">Contoh: isi 7 berarti voucher bisa diklaim dari hari ulang tahun sampai 7 hari setelahnya.</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">
                <ExplainedLabel tooltip={<ClerkIdTooltip />}>Target Clerk ID (Opsional)</ExplainedLabel>
              </label>
              <input type="text" value={formVoucher.targetClerkId || ''} onChange={e => setFormVoucher({...formVoucher, targetClerkId: e.target.value})} placeholder="user_xxx untuk kupon personal" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink font-mono" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">
                <ExplainedLabel tooltip={<SegmentTooltip />}>Segment Label (Opsional)</ExplainedLabel>
              </label>
              <input type="text" disabled={formVoucher.targetUserRole === 'BIRTHDAY'} value={formVoucher.targetUserRole === 'BIRTHDAY' ? 'BIRTHDAY' : formVoucher.targetSegment || ''} onChange={e => setFormVoucher({...formVoucher, targetSegment: e.target.value})} placeholder="VIP, NEW_USER, RETENTION" className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-ink disabled:bg-black/5 disabled:text-black/40" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2 font-medium">Produk yang Berlaku (Opsional)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-2xl border border-black/5 bg-white/40 p-3">
                {products.map((product: any) => {
                  const selected = (formVoucher.applicableProductIds || []).map(Number).includes(Number(product.id));
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        const current = (formVoucher.applicableProductIds || []).map(Number);
                        setFormVoucher({
                          ...formVoucher,
                          applicableProductIds: selected ? current.filter((id) => id !== Number(product.id)) : [...current, Number(product.id)]
                        });
                      }}
                      className={`text-left rounded-xl border px-3 py-2 text-xs transition-colors ${selected ? 'border-ink bg-ink text-white' : 'border-black/10 bg-white hover:bg-black/5 text-ink'}`}
                    >
                      <span className="line-clamp-1 font-medium">{product.name}</span>
                      <span className={`block font-mono text-[10px] ${selected ? 'text-white/70' : 'text-black/40'}`}>Rp {Number(product.base_price || 0).toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
                {products.length === 0 && <p className="text-xs text-black/50 p-3">Belum ada produk untuk dipilih.</p>}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika voucher berlaku untuk semua produk. Pilih produk khusus jika ingin promo birthday hanya berlaku untuk gift tertentu.</p>
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-2">
            {isEditing && (
               <button type="button" onClick={() => setShowForm(false)} className="bg-black/5 text-ink px-8 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/10 transition-colors shadow-m">
                 Batal Edit
               </button>
            )}
            <button disabled={loading} onClick={handleSubmit} className="bg-ink text-white px-8 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-m disabled:opacity-50">
              {loading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Voucher')}
            </button>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="bg-white/40 p-6 md:p-8 rounded-[2rem] border border-black/5">
        <h3 className="text-lg font-medium mb-6 font-heading">Daftar Voucher Aktif & Riwayat</h3>
        
        {vouchers.length === 0 && !isLoading && (
          <div className="text-center py-12 text-black/50">
             <Tag size={48} className="mx-auto mb-4 opacity-30" />
             <p className="mb-2">Belum ada promo voucher di sistem D1 Anda.</p>
             <p className="text-sm opacity-80">Klik tombol "Buat Voucher Baru" di atas untuk menambahkan promo pertama Anda.</p>
          </div>
        )}

        {vouchers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-widest opacity-50">
                <th className="font-medium pb-4 pr-4">Kode</th>
                <th className="font-medium pb-4 px-4">Tipe Diskon</th>
                <th className="font-medium pb-4 px-4">Min. Belanja</th>
                <th className="font-medium pb-4 px-4">Masa Berlaku</th>
                <th className="font-medium pb-4 px-4">Pemakaian</th>
                <th className="font-medium pb-4 px-4">Status</th>
                <th className="font-medium pb-4 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v: any) => (
                <tr key={v.id} className="border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors group">
                  <td className="py-4 pr-4">
                    <div className="font-mono font-semibold text-ink/90">{v.code}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{v.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    {v.type === 'PERCENTAGE' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-medium">{v.value}% OFF</span>}
                    {v.type === 'FIXED' && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-medium">Rp {(v.value / 1000).toFixed(0)}K OFF</span>}
                    {v.type === 'FREE_SHIPPING' && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded font-medium">GRATIS ONGKIR</span>}
                    
                    {v.maxDiscount > 0 && v.type === 'PERCENTAGE' && (
                      <div className="text-[10px] text-gray-400 mt-1">Maks Rp {(v.maxDiscount/1000)}k</div>
                    )}
                    {v.birthdayClaimWindowDays > 0 && <div className="text-[10px] text-pink-600 mt-1">Birthday {v.birthdayClaimWindowDays} hari</div>}
                    {Array.isArray(v.applicableProductIds) && v.applicableProductIds.length > 0 && <div className="text-[10px] text-gray-400 mt-1">{v.applicableProductIds.length} produk khusus</div>}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {v.minPurchase > 0 ? `Rp ${(v.minPurchase / 1000).toFixed(0)}k` : 'Rp 0'}
                  </td>
                  <td className="py-4 px-4">
                     <div className="text-xs text-gray-600">{v.startDate ? new Date(v.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : 'Kapan pun'}</div>
                     <div className="text-[10px] text-gray-400">s/d</div>
                     <div className="text-xs text-ink font-medium">{v.endDate ? new Date(v.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : 'Tanpa batas'}</div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`font-semibold ${v.usageLimit > 0 && v.usedCount >= v.usageLimit ? 'text-red-500' : 'text-emerald-600'}`}>{v.usedCount}</span>
                    <span className="text-gray-400 text-xs"> / {v.usageLimit === 0 ? '∞' : v.usageLimit}</span>
                  </td>
                  <td className="py-4 px-4">
                    {v.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(v)} className="p-2 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                        <Edit2 size={16} className="text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(v.code)} className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Hapus">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

function parseJson(value: any, fallback: any) {
  try {
    return value ? JSON.parse(String(value)) : fallback;
  } catch {
    return fallback;
  }
}
