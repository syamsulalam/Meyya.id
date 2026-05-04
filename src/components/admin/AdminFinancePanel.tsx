import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import useSWR, { mutate } from 'swr';
import { Banknote, Download, Lock, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';
import { buildImageUploadFormData } from '../../lib/imageCompression';
import { buildPdfAwareUploadFormData } from '../../lib/pdfCompression';

const emptyForm = {
  transaction_date: new Date().toISOString().slice(0, 10),
  type: 'EXPENSE',
  category: '',
  description: '',
  amount: 0,
  attachment_url: '',
};

const fieldClass = 'w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink';
const expenseCategories = ['Packaging', 'Ads', 'Bahan Baku', 'Ongkir Subsidi', 'Refund', 'Operasional', 'Gaji', 'Lain-lain'];
const incomeCategories = ['Penjualan Manual', 'Modal Masuk', 'Refund Supplier', 'Lain-lain'];

export default function AdminFinancePanel() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast, showConfirm } = useStore();
  const [range, setRange] = useState('month');
  const [form, setForm] = useState<any>(emptyForm);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);
  const { data, isLoading } = useSWR(`/api/admin/finance?range=${range}`, fetcher);
  const statement = data?.statement || {};
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const closings = Array.isArray(data?.closings) ? data.closings : [];
  const currentPeriodKey = new Date().toISOString().slice(0, 7);
  const cashFlowRows = buildCashFlowRows(statement);

  const saveTransaction = async () => {
    try {
      const res = await authFetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Gagal menyimpan transaksi');
      setForm(emptyForm);
      mutate(`/api/admin/finance?range=${range}`);
      addToast('Transaksi keuangan tersimpan', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const deleteTransaction = async (id: number) => {
    showConfirm({
      title: 'Hapus Transaksi',
      message: 'Transaksi manual ini akan dihapus dari laporan keuangan.',
      confirmLabel: 'Hapus',
      tone: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/finance?id=${id}`, { method: 'DELETE' });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(payload.error || 'Gagal menghapus transaksi');
          mutate(`/api/admin/finance?range=${range}`);
          addToast('Transaksi dihapus', 'success');
        } catch (error: any) {
          addToast(error.message, 'error');
        }
      },
    });
  };

  const uploadTransactionProof = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const formData = file.type.startsWith('image/')
        ? await buildImageUploadFormData(file)
        : await buildPdfAwareUploadFormData(file);
      formData.append('folder', 'finance');
      const res = await authFetch('/api/upload', { method: 'POST', body: formData });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) throw new Error(payload.error || 'Gagal upload bukti transaksi');
      setForm((prev: any) => ({ ...prev, attachment_url: payload.url }));
      addToast('Bukti transaksi berhasil diunggah', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setUploadingProof(false);
      event.target.value = '';
    }
  };

  const closeCurrentMonth = async () => {
    showConfirm({
      title: 'Tutup Buku Bulanan',
      message: `Periode ${currentPeriodKey} akan dikunci. Transaksi manual pada periode ini tidak bisa ditambah atau dihapus setelah ditutup.`,
      confirmLabel: 'Tutup Buku',
      tone: 'default',
      onConfirm: async () => {
        setClosingPeriod(true);
        try {
          const res = await authFetch('/api/admin/finance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CLOSE_PERIOD', period_key: currentPeriodKey }),
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(payload.error || 'Gagal tutup buku');
          mutate(`/api/admin/finance?range=${range}`);
          addToast(`Periode ${currentPeriodKey} berhasil ditutup buku`, 'success');
        } catch (error: any) {
          addToast(error.message, 'error');
        } finally {
          setClosingPeriod(false);
        }
      },
    });
  };

  const exportCsv = () => {
    const rows = [
      ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'],
      ...transactions.map((transaction: any) => [
        transaction.transaction_date,
        transaction.type,
        transaction.category || '',
        transaction.description || '',
        transaction.amount || 0,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meyya-finance-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportClosingCsv = (closing: any) => {
    const snapshot = closing.snapshot || {};
    const statementSnapshot = snapshot.statement || {};
    const rows = [
      ['Periode', closing.period_key],
      ['Ditutup Pada', closing.closed_at],
      ['Order Paid', statementSnapshot.orderCount || 0],
      ['Omset Produk Bersih', statementSnapshot.netProductRevenue || 0],
      ['HPP', statementSnapshot.hpp || 0],
      ['Manual Income', statementSnapshot.manualIncome || 0],
      ['Manual Expense', statementSnapshot.manualExpense || 0],
      ['Packaging Expense', statementSnapshot.packagingExpense || 0],
      ['Ads Expense', statementSnapshot.adsExpense || 0],
      ['Profit Bersih', statementSnapshot.netProfit || 0],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meyya-closing-${closing.period_key}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2">
            <Banknote size={24} /> Keuangan
          </h2>
          <p className="text-sm font-light text-black/60">Laporan laba rugi sederhana dari order, HPP, voucher, fee transaksi, dan transaksi manual.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={range} onChange={(event) => setRange(event.target.value)} className="bg-white border border-black/10 rounded-full px-4 py-2 text-sm outline-none">
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
          <button type="button" onClick={exportCsv} className="p-2 rounded-full bg-white border border-black/10 hover:bg-black/5" title="Export CSV">
            <Download size={16} />
          </button>
          <button type="button" onClick={closeCurrentMonth} disabled={closingPeriod} className="px-4 py-2 rounded-full bg-ink text-white text-[10px] uppercase tracking-widest hover:bg-black/80 disabled:opacity-50 flex items-center gap-2">
            <Lock size={14} /> Tutup Buku
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-black/50">Memuat laporan keuangan...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Omset Produk Bersih" value={statement.netProductRevenue} note="Subtotal + order bump - voucher" />
            <MetricCard label="HPP" value={statement.hpp} note="Dari HPP item saat order dibuat" tone="expense" />
            <MetricCard label="Profit Bersih Sederhana" value={statement.netProfit} note="Termasuk transaksi manual" tone={Number(statement.netProfit || 0) >= 0 ? 'income' : 'expense'} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SmallMetric label="Order Paid" value={`${Number(statement.orderCount || 0).toLocaleString('id-ID')} order`} />
            <SmallMetric label="Voucher" value={formatCurrency(statement.discountAmount)} />
            <SmallMetric label="Fee Transaksi" value={formatCurrency(statement.adminFeeCollected)} />
            <SmallMetric label="Margin Kotor" value={`${Number(statement.marginPercent || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`} />
            <SmallMetric label="Ongkir Ditagihkan" value={formatCurrency(statement.shippingCharged)} />
            <SmallMetric label="Uang Masuk Manual" value={formatCurrency(statement.manualIncome)} />
            <SmallMetric label="Uang Keluar Manual" value={formatCurrency(statement.manualExpense)} />
            <SmallMetric label="Total Terbayar" value={formatCurrency(statement.totalPaidCollected)} />
            <SmallMetric label="Packaging / Order" value={formatCurrency(statement.packagingCostPerOrder)} />
            <SmallMetric label="Ads / Order" value={formatCurrency(statement.adsCostPerOrder)} />
            <SmallMetric label="Total Packaging" value={formatCurrency(statement.packagingExpense)} />
            <SmallMetric label="Total Ads" value={formatCurrency(statement.adsExpense)} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="bg-white/40 border border-black/5 rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Plus size={16} /> Transaksi Manual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal">
              <input type="date" value={form.transaction_date} onChange={(event) => setForm({ ...form, transaction_date: event.target.value })} className={fieldClass} />
            </Field>
            <Field label="Tipe">
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className={fieldClass}>
                <option value="EXPENSE">Uang Keluar</option>
                <option value="INCOME">Uang Masuk</option>
              </select>
            </Field>
            <Field label="Kategori">
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Packaging, Ads, Bahan..." className={fieldClass} />
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.type === 'INCOME' ? incomeCategories : expenseCategories).map((category) => (
                  <button key={category} type="button" onClick={() => setForm({ ...form, category })} className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border transition-colors ${form.category === category ? 'bg-ink text-white border-ink' : 'bg-white/70 border-black/10 text-black/50 hover:bg-black/5'}`}>
                    {category}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Nominal">
              <input type="number" value={form.amount || 0} onChange={(event) => setForm({ ...form, amount: Number(event.target.value || 0) })} className={`${fieldClass} font-mono`} />
            </Field>
          </div>
          <Field label="Catatan">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} placeholder="Contoh: beli bubble wrap, biaya ads, refund manual..." className={`${fieldClass} resize-none`} />
          </Field>
          <Field label="URL Bukti Opsional">
            <input value={form.attachment_url} onChange={(event) => setForm({ ...form, attachment_url: event.target.value })} placeholder="https://..." className={fieldClass} />
            <p className="mt-2 text-xs text-black/45">PDF dikompresi di browser dengan batas 8 MB dan 10 halaman sebelum upload.</p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-black/5">
                <Upload size={14} /> {uploadingProof ? 'Mengunggah...' : 'Upload Bukti'}
                <input type="file" accept="image/*,application/pdf" onChange={uploadTransactionProof} className="hidden" disabled={uploadingProof} />
              </label>
              {form.attachment_url && (
                <a href={form.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-black/5 text-xs font-semibold uppercase tracking-widest hover:bg-black/10">
                  Lihat Bukti
                </a>
              )}
            </div>
          </Field>
          <button type="button" onClick={saveTransaction} className="w-full py-3 rounded-full bg-ink text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors flex items-center justify-center gap-2">
            <Save size={14} /> Simpan Transaksi
          </button>
        </div>

        <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Buku Kas Manual</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-black/40 border-b border-black/5">
                <tr>
                  <th className="py-3 pr-4 font-medium">Tanggal</th>
                  <th className="py-3 pr-4 font-medium">Kategori</th>
                  <th className="py-3 pr-4 font-medium">Tipe</th>
                  <th className="py-3 pr-4 font-medium text-right">Nominal</th>
                  <th className="py-3 pl-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {transactions.map((transaction: any) => (
                  <tr key={transaction.id}>
                    <td className="py-3 pr-4 whitespace-nowrap">{transaction.transaction_date}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{transaction.category || '-'}</div>
                      {transaction.description && <div className="text-xs text-black/45 line-clamp-1">{transaction.description}</div>}
                      {transaction.attachment_url && <a href={transaction.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">Bukti transaksi</a>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${transaction.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {transaction.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{formatCurrency(transaction.amount)}</td>
                    <td className="py-3 pl-4 text-right">
                      <button type="button" onClick={() => deleteTransaction(transaction.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-black/45">Belum ada transaksi manual pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Arus Kas Sederhana</h3>
        <div className="space-y-3">
          {cashFlowRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl bg-white/60 border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{row.label}</p>
                <p className="text-xs text-black/45">{row.note}</p>
              </div>
              <p className={`font-mono font-semibold ${row.type === 'out' ? 'text-red-700' : 'text-emerald-700'}`}>
                {row.type === 'out' ? '-' : '+'}{formatCurrency(row.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Riwayat Tutup Buku</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {closings.map((closing: any) => (
            <div key={closing.id} className="rounded-2xl bg-white/60 border border-black/5 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-semibold text-ink">{closing.period_key}</p>
                <span className="text-[10px] uppercase tracking-widest bg-black/5 px-2 py-1 rounded-full">Locked</span>
              </div>
              <p className="text-xs text-black/50">Ditutup: {new Date(closing.closed_at).toLocaleString('id-ID')}</p>
              <p className="text-sm font-semibold mt-3">{formatCurrency(closing.snapshot?.statement?.netProfit || 0)}</p>
              <p className="text-xs text-black/45">Profit bersih snapshot</p>
              <button type="button" onClick={() => exportClosingCsv(closing)} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 text-[10px] uppercase tracking-widest hover:bg-black/10">
                <Download size={12} /> Export CSV
              </button>
            </div>
          ))}
          {closings.length === 0 && <p className="text-sm text-black/45">Belum ada periode yang ditutup buku.</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, note, tone = 'income' }: { label: string; value: any; note: string; tone?: 'income' | 'expense' }) {
  return (
    <div className={`rounded-3xl border p-6 ${tone === 'expense' ? 'bg-red-50/60 border-red-100' : 'bg-white/60 border-black/5'}`}>
      <p className="text-[10px] uppercase tracking-widest text-black/45 font-bold mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${tone === 'expense' ? 'text-red-700' : 'text-ink'}`}>{formatCurrency(value)}</p>
      <p className="text-xs text-black/45 mt-2">{note}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/50 border border-black/5 p-4">
      <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{label}</p>
      <p className="text-sm font-semibold text-ink mt-1">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-black/45 mb-2">{label}</span>
      {children}
    </label>
  );
}

function buildCashFlowRows(statement: any) {
  return [
    {
      label: 'Kas Masuk dari Order',
      note: 'Total paid dari order paid/processing/shipped/completed',
      amount: Number(statement.totalPaidCollected || 0),
      type: 'in',
    },
    {
      label: 'Uang Masuk Manual',
      note: 'Modal/refund supplier/penjualan manual',
      amount: Number(statement.manualIncome || 0),
      type: 'in',
    },
    {
      label: 'Estimasi HPP',
      note: 'HPP item dari order pada periode ini',
      amount: Number(statement.hpp || 0),
      type: 'out',
    },
    {
      label: 'Uang Keluar Manual',
      note: 'Packaging, ads, operasional, refund, dan biaya lain',
      amount: Number(statement.manualExpense || 0),
      type: 'out',
    },
    {
      label: 'Net Cash Sederhana',
      note: 'Kas masuk order + manual income - HPP - manual expense',
      amount: Number(statement.totalPaidCollected || 0) + Number(statement.manualIncome || 0) - Number(statement.hpp || 0) - Number(statement.manualExpense || 0),
      type: Number(statement.totalPaidCollected || 0) + Number(statement.manualIncome || 0) - Number(statement.hpp || 0) - Number(statement.manualExpense || 0) >= 0 ? 'in' : 'out',
    },
  ];
}

function formatCurrency(value: any) {
  return `Rp ${Math.abs(Number(value || 0)).toLocaleString('id-ID')}`;
}
