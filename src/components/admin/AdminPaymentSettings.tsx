import React, { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { CreditCard, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';
import {
  AdminFeeTooltip,
  ExplainedLabel,
  PaymentExpiryTooltip,
  QrisTooltip,
} from '../term-tooltips';

const emptyBank = {
  bank_name: '',
  account_number: '',
  account_holder: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminPaymentSettings() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast, showConfirm } = useStore();
  const { data: settings, isLoading: settingsLoading } = useSWR('/api/admin/payment-settings', fetcher);
  const { data: banks, isLoading: banksLoading } = useSWR('/api/admin/payment-bank-accounts', fetcher);

  const [form, setForm] = useState<any>({
    transfer_instruction: '',
    payment_expiry_minutes: 1440,
    transfer_admin_fee: 0,
    qris_admin_fee: 0,
    qris_image_url: '',
    qris_is_active: false,
  });
  const [bankForm, setBankForm] = useState<any>(emptyBank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        transfer_instruction: settings.transfer_instruction || '',
        payment_expiry_minutes: Number(settings.payment_expiry_minutes || 1440),
        transfer_admin_fee: Number(settings.transfer_admin_fee || 0),
        qris_admin_fee: Number(settings.qris_admin_fee || 0),
        qris_image_url: settings.qris_image_url || '',
        qris_is_active: settings.qris_is_active === 1,
      });
    }
  }, [settings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menyimpan setting pembayaran');
      mutate('/api/admin/payment-settings');
      mutate('/api/payment/options');
      addToast('Setting pembayaran berhasil disimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadQris = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Gagal upload QRIS');
      setForm((prev: any) => ({ ...prev, qris_image_url: data.url }));
      addToast('QRIS berhasil diunggah', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const saveBank = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_holder) {
      addToast('Lengkapi nama bank, nomor rekening, dan pemilik rekening', 'error');
      return;
    }

    try {
      const isEdit = Boolean(bankForm.id);
      const res = await authFetch(isEdit ? `/api/admin/payment-bank-accounts/${bankForm.id}` : '/api/admin/payment-bank-accounts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menyimpan rekening');
      setBankForm(emptyBank);
      mutate('/api/admin/payment-bank-accounts');
      mutate('/api/payment/options');
      addToast('Rekening pembayaran berhasil disimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const deleteBank = async (id: number) => {
    showConfirm({
      title: 'Hapus Rekening',
      message: 'Rekening ini tidak akan tampil lagi sebagai opsi pembayaran transfer.',
      confirmLabel: 'Hapus',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/payment-bank-accounts/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus rekening');
          mutate('/api/admin/payment-bank-accounts');
          mutate('/api/payment/options');
          addToast('Rekening dihapus', 'success');
        } catch (error: any) {
          addToast(error.message, 'error');
        }
      },
    });
  };

  const bankAccounts = Array.isArray(banks) ? banks : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light mb-2 flex items-center gap-2"><CreditCard size={24} /> Pengaturan Pembayaran</h2>
        <p className="text-sm font-light text-black/60">Kelola rekening transfer, instruksi pembayaran, admin fee, dan QRIS.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6 space-y-5">
          <h3 className="text-sm uppercase tracking-widest font-semibold">
            <ExplainedLabel tooltip={<AdminFeeTooltip />}>Instruksi & Fee</ExplainedLabel>
          </h3>
          {settingsLoading ? (
            <p className="text-sm text-black/50">Memuat setting pembayaran...</p>
          ) : (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-black/50 mb-2">Instruksi Transfer</label>
                <textarea
                  rows={5}
                  value={form.transfer_instruction}
                  onChange={(event) => setForm({ ...form, transfer_instruction: event.target.value })}
                  className="w-full bg-white border border-black/10 rounded-xl p-4 text-sm focus:outline-none focus:border-ink resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberField label="Expiry Menit" tooltip={<PaymentExpiryTooltip />} value={form.payment_expiry_minutes} onChange={(value) => setForm({ ...form, payment_expiry_minutes: value })} />
                <NumberField label="Fee Transfer" tooltip={<AdminFeeTooltip />} value={form.transfer_admin_fee} onChange={(value) => setForm({ ...form, transfer_admin_fee: value })} />
                <NumberField label="Fee QRIS" tooltip={<QrisTooltip />} value={form.qris_admin_fee} onChange={(value) => setForm({ ...form, qris_admin_fee: value })} />
              </div>
              <div className="border-t border-black/5 pt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.qris_is_active} onChange={(event) => setForm({ ...form, qris_is_active: event.target.checked })} />
                    <ExplainedLabel tooltip={<QrisTooltip />}>QRIS aktif</ExplainedLabel>
                  </label>
                  <label className="px-4 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-black/5 flex items-center gap-2">
                    <Upload size={14} /> Upload QRIS
                    <input type="file" accept="image/*" onChange={uploadQris} className="hidden" />
                  </label>
                </div>
                {form.qris_image_url && (
                  <div className="flex gap-4 items-center bg-white/60 border border-black/5 rounded-xl p-3">
                    <img src={form.qris_image_url} alt="QRIS" className="w-20 h-20 object-cover rounded-lg border border-black/10" />
                    <input value={form.qris_image_url} onChange={(event) => setForm({ ...form, qris_image_url: event.target.value })} className="flex-1 bg-white border border-black/10 rounded-xl px-3 py-2 text-xs" />
                  </div>
                )}
              </div>
              <button onClick={saveSettings} disabled={saving} className="w-full bg-ink text-white py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-black/80 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Setting'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white/40 border border-black/5 rounded-[2rem] p-6 space-y-5">
          <h3 className="text-sm uppercase tracking-widest font-semibold">Rekening Bank</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Bank" value={bankForm.bank_name} onChange={(value) => setBankForm({ ...bankForm, bank_name: value })} placeholder="BCA" />
            <TextField label="Nomor Rekening" value={bankForm.account_number} onChange={(value) => setBankForm({ ...bankForm, account_number: value })} placeholder="1234567890" />
            <TextField label="Pemilik Rekening" value={bankForm.account_holder} onChange={(value) => setBankForm({ ...bankForm, account_holder: value })} placeholder="PT ..." />
            <NumberField label="Urutan" value={bankForm.sort_order} onChange={(value) => setBankForm({ ...bankForm, sort_order: value })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={bankForm.is_active} onChange={(event) => setBankForm({ ...bankForm, is_active: event.target.checked })} />
            Rekening aktif
          </label>
          <button onClick={saveBank} className="w-full bg-ink text-white py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-black/80 flex items-center justify-center gap-2">
            <Plus size={14} /> {bankForm.id ? 'Update Rekening' : 'Tambah Rekening'}
          </button>

          <div className="border-t border-black/5 pt-4 space-y-3">
            {banksLoading && <p className="text-sm text-black/50">Memuat rekening...</p>}
            {!banksLoading && bankAccounts.length === 0 && <p className="text-sm text-black/50 text-center py-6">Belum ada rekening pembayaran.</p>}
            {bankAccounts.map((bank: any) => (
              <div key={bank.id} className="bg-white/60 border border-black/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{bank.bank_name}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest ${bank.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{bank.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  <p className="font-mono text-sm mt-1">{bank.account_number}</p>
                  <p className="text-xs text-black/50">a.n. {bank.account_holder}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setBankForm({ ...bank, is_active: bank.is_active === 1 })} className="px-3 py-2 rounded-xl bg-black/5 text-xs font-semibold hover:bg-black/10">Edit</button>
                  <button onClick={() => deleteBank(bank.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-black/50 mb-2">{label}</label>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
    </div>
  );
}

function NumberField({ label, value, onChange, tooltip }: { label: string; value: number; onChange: (value: number) => void; tooltip?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-black/50 mb-2">
        {tooltip ? <ExplainedLabel tooltip={tooltip}>{label}</ExplainedLabel> : label}
      </label>
      <input type="number" value={value || 0} onChange={(event) => onChange(Number(event.target.value || 0))} className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink" />
    </div>
  );
}
