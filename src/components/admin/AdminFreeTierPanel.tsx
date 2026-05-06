import { useState } from 'react';
import useSWR from 'swr';
import { Activity, Archive, Database, HardDrive, RefreshCw, Scissors, Users } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';
import {
  ClerkUsersTooltip,
  ApiCoIdFreeTierTooltip,
  D1StorageTooltip,
  ExplainedLabel,
  FreeTierGuardTooltip,
  R2StorageTooltip,
  SafePruningTooltip,
} from '../term-tooltips';

type FreeTierPanelProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

export default function AdminFreeTierPanel({ compact = false, onNavigate }: FreeTierPanelProps) {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = isLoaded && isSignedIn;
  const { addToast } = useStore();
  const { data, error, isLoading, mutate } = useSWR(authReady ? '/api/admin/free-tier' : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 15 * 60 * 1000,
  });
  const [isPruning, setIsPruning] = useState(false);
  const [includeAuditLogs, setIncludeAuditLogs] = useState(false);
  const [backfillStartDate, setBackfillStartDate] = useState('');
  const [backfillEndDate, setBackfillEndDate] = useState('');
  const [backfillDryRun, setBackfillDryRun] = useState(true);
  const [backfillReplace, setBackfillReplace] = useState(true);
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [archiveStartDate, setArchiveStartDate] = useState('');
  const [archiveEndDate, setArchiveEndDate] = useState('');
  const [archiveDryRun, setArchiveDryRun] = useState(true);
  const [archiveDeleteAfter, setArchiveDeleteAfter] = useState(false);
  const [archiveResult, setArchiveResult] = useState<any>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const runPruning = async () => {
    setIsPruning(true);
    try {
      const res = await authFetch('/api/admin/free-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeAuditLogs }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Pruning gagal');
      const totalDeleted = Object.values(payload.changes || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
      addToast(`Pruning selesai: ${totalDeleted} row dihapus.`, 'success');
      mutate();
    } catch (error: any) {
      addToast(error.message || 'Gagal menjalankan pruning', 'error');
    } finally {
      setIsPruning(false);
    }
  };

  const runAnalyticsBackfill = async () => {
    setIsBackfilling(true);
    try {
      const res = await authFetch('/api/admin/analytics-backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: backfillStartDate,
          end_date: backfillEndDate,
          dry_run: backfillDryRun,
          replace: backfillReplace,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Backfill analytics gagal');
      setBackfillResult(payload.result);
      addToast(backfillDryRun ? 'Dry-run backfill selesai.' : 'Backfill analytics selesai.', 'success');
      mutate();
    } catch (error: any) {
      addToast(error.message || 'Gagal menjalankan backfill analytics', 'error');
    } finally {
      setIsBackfilling(false);
    }
  };

  const runAnalyticsArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await authFetch('/api/admin/analytics-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: archiveStartDate,
          end_date: archiveEndDate,
          dry_run: archiveDryRun,
          delete_after_archive: archiveDeleteAfter,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Archive analytics gagal');
      setArchiveResult(payload.result);
      addToast(archiveDryRun ? 'Dry-run archive selesai.' : 'Archive raw event selesai.', 'success');
      mutate();
    } catch (error: any) {
      addToast(error.message || 'Gagal archive raw event', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  if (!authReady || isLoading) {
    return (
      <div className="bg-white/40 border border-black/5 rounded-2xl p-4 text-sm text-black/50 flex items-center gap-2">
        <RefreshCw size={16} className="animate-spin" /> {!authReady ? 'Menunggu sesi admin...' : 'Memuat limit free tier...'}
      </div>
    );
  }

  if (error || data?.error) {
    const message = data?.error || error?.message || 'Gagal membaca limit free tier';
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
        Limit free tier gagal dimuat: {message}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-sm text-yellow-700">
        Limit free tier belum menerima data dari API. Klik refresh setelah sesi admin siap.
      </div>
    );
  }

  const cards = buildUsageCards(data);

  if (compact) {
    return (
      <div className="bg-white/40 border border-black/5 rounded-3xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              <ExplainedLabel tooltip={<FreeTierGuardTooltip />}>Free Tier Guard</ExplainedLabel>
            </h3>
            <p className="text-xs text-black/50 mt-1">Pantau Clerk, D1, dan R2 supaya operasional tetap efisien.</p>
          </div>
          {onNavigate && (
            <button type="button" onClick={onNavigate} className="px-4 py-2 rounded-full bg-ink text-white text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors">
              Lihat Detail
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.slice(0, 3).map((card) => (
            <UsageCard key={card.label} {...card} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2">
            <HardDrive size={24} />
            <ExplainedLabel tooltip={<FreeTierGuardTooltip />}>Limit Free Tier</ExplainedLabel>
          </h2>
          <p className="text-sm font-light text-black/60">Pantau pemakaian Cloudflare D1, R2, dan Clerk dari data yang bisa dibaca aplikasi.</p>
        </div>
        <button
          type="button"
          onClick={() => mutate(fetcher('/api/admin/free-tier?refresh=1'), { revalidate: false })}
          className="px-4 py-2 rounded-full bg-white border border-black/10 text-xs uppercase tracking-widest hover:bg-black/5 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <UsageCard key={card.label} {...card} />
        ))}
      </div>

      <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Activity size={16} />
          <ExplainedLabel tooltip={<ApiCoIdFreeTierTooltip />}>API.CO.ID Free Tier</ExplainedLabel>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.externalApis?.usage || []).map((api: any) => (
            <div key={`${api.provider}-${api.product}`} className="rounded-2xl bg-white/60 border border-black/5 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">{api.label}</p>
                  <p className="text-xl font-semibold text-ink">{Number(api.calls || 0).toLocaleString('id-ID')} / {Number(api.limit || 0).toLocaleString('id-ID')} hit</p>
                </div>
                <span className="text-[10px] rounded-full bg-black/5 px-2 py-1 text-black/50">{api.period}</span>
              </div>
              <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                <div className={`h-full rounded-full ${api.percentage > 80 ? 'bg-red-500' : api.percentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${api.percentage}%` }} />
              </div>
              <p className="text-xs text-black/45 mt-3">{api.note}</p>
              <p className="text-[10px] text-black/35 mt-1">Sisa bulan ini: {Number(api.remaining || 0).toLocaleString('id-ID')} hit • limit {api.rpsLimit} rps</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-black/5 p-4 text-xs text-black/55 space-y-1">
          {(data?.externalApis?.strategy || []).map((line: string) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
        <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
            <ExplainedLabel tooltip={<D1StorageTooltip />}>Tabel Terbesar Berdasarkan Row</ExplainedLabel>
          </h3>
          <div className="space-y-2">
            {(data?.d1?.tableStats || []).slice(0, 10).map((row: any) => (
              <div key={row.table} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
                <span className="font-mono text-xs">{row.table}</span>
                <span className="font-semibold">{Number(row.rows || 0).toLocaleString('id-ID')} row</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-black/45 mt-4">Ukuran D1 memprioritaskan Cloudflare API, lalu fallback ke `PRAGMA page_count * page_size`. Data panel ini di-cache 15 menit agar API tidak dipanggil berulang.</p>
        </div>

        <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Scissors size={16} />
            <ExplainedLabel tooltip={<SafePruningTooltip />}>Pruning Aman</ExplainedLabel>
          </h3>
          <p className="text-sm text-black/60 leading-relaxed mb-5">
            Pruning menghapus event lama, snapshot cart lama yang sudah converted, snapshot cart kosong yang stale, dan cache wilayah lama. Data order, user, alamat, stok, voucher usage, dan retur tidak dihapus.
          </p>
          <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-black/5 p-4 text-sm mb-5">
            <input type="checkbox" checked={includeAuditLogs} onChange={(event) => setIncludeAuditLogs(event.target.checked)} className="mt-1" />
            <span>
              <span className="font-medium block">Ikut pangkas audit log lama</span>
              <span className="text-xs text-black/50">Default off. Aktifkan hanya jika ukuran DB mulai mendekati limit dan audit lama sudah tidak dibutuhkan.</span>
            </span>
          </label>
          <button
            type="button"
            onClick={runPruning}
            disabled={isPruning}
            className="w-full py-3 rounded-full bg-ink text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {isPruning ? 'Menjalankan Pruning...' : 'Jalankan Pruning Aman'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Activity size={16} />
            Backfill Analytics Chart
          </h3>
          <p className="text-sm text-black/60 leading-relaxed mb-5">
            Hitung ulang aggregate harian dari raw user_events untuk window tanggal tertentu. Ini dipakai kalau histori event lama perlu masuk chart admin.
          </p>
          <DateWindowControls
            startDate={backfillStartDate}
            endDate={backfillEndDate}
            onStartDate={setBackfillStartDate}
            onEndDate={setBackfillEndDate}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-black/5 p-4 text-sm">
              <input type="checkbox" checked={backfillDryRun} onChange={(event) => setBackfillDryRun(event.target.checked)} className="mt-1" />
              <span>
                <span className="font-medium block">Dry-run dulu</span>
                <span className="text-xs text-black/50">Cek jumlah row tanpa menulis aggregate.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-black/5 p-4 text-sm">
              <input type="checkbox" checked={backfillReplace} onChange={(event) => setBackfillReplace(event.target.checked)} className="mt-1" />
              <span>
                <span className="font-medium block">Replace window</span>
                <span className="text-xs text-black/50">Hapus aggregate window itu dulu agar hasil chart tidak dobel.</span>
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={runAnalyticsBackfill}
            disabled={isBackfilling || !backfillStartDate || !backfillEndDate}
            className="w-full py-3 rounded-full bg-ink text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {isBackfilling ? 'Menjalankan Backfill...' : 'Jalankan Backfill'}
          </button>
          <OperationResult result={backfillResult} />
        </div>

        <div className="bg-white/40 border border-black/5 rounded-3xl p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Archive size={16} />
            Archive Raw Event ke R2
          </h3>
          <p className="text-sm text-black/60 leading-relaxed mb-5">
            Simpan raw user_events lama sebagai JSONL di R2 sebelum dihapus dari D1. Aggregate chart tetap ada di D1, raw log lama tidak memenuhi database.
          </p>
          <DateWindowControls
            startDate={archiveStartDate}
            endDate={archiveEndDate}
            onStartDate={setArchiveStartDate}
            onEndDate={setArchiveEndDate}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-black/5 p-4 text-sm">
              <input type="checkbox" checked={archiveDryRun} onChange={(event) => setArchiveDryRun(event.target.checked)} className="mt-1" />
              <span>
                <span className="font-medium block">Dry-run dulu</span>
                <span className="text-xs text-black/50">Hitung row dan ukuran export tanpa upload R2.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-white/60 border border-black/5 p-4 text-sm">
              <input type="checkbox" checked={archiveDeleteAfter} onChange={(event) => setArchiveDeleteAfter(event.target.checked)} className="mt-1" />
              <span>
                <span className="font-medium block">Hapus setelah archive</span>
                <span className="text-xs text-black/50">Aktifkan setelah dry-run aman dan archive sukses.</span>
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={runAnalyticsArchive}
            disabled={isArchiving || !archiveStartDate || !archiveEndDate}
            className="w-full py-3 rounded-full bg-ink text-white text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {isArchiving ? 'Menjalankan Archive...' : 'Archive Raw Event'}
          </button>
          <OperationResult result={archiveResult} />
        </div>
      </div>
    </div>
  );
}

function DateWindowControls({ startDate, endDate, onStartDate, onEndDate }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-xs uppercase tracking-widest text-black/40 font-bold">
        Tanggal Mulai
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDate(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-black/40 font-bold">
        Tanggal Akhir
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDate(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink"
        />
      </label>
    </div>
  );
}

function OperationResult({ result }: { result: any }) {
  if (!result) return null;
  const rows = Object.entries(result).filter(([, value]) => value !== null && value !== undefined);
  return (
    <div className="mt-4 rounded-2xl bg-black/5 p-4 text-xs text-black/60 space-y-1">
      {rows.map(([key, value]) => (
        <p key={key}>
          <span className="font-mono text-black/40">{key}</span>: {formatResultValue(value)}
        </p>
      ))}
    </div>
  );
}

function buildUsageCards(data: any) {
  return [
    {
      icon: Users,
      label: 'Clerk Users',
      value: Number(data?.clerk?.users || 0),
      limit: Number(data?.clerk?.limit || 50000),
      formatter: formatNumber,
      note: 'Proxy dari user yang sinkron ke D1.',
    },
    {
      icon: Database,
      label: 'D1 Database',
      value: data?.d1?.databaseBytes ?? null,
      limit: Number(data?.d1?.databaseLimitBytes || 500 * 1024 * 1024),
      formatter: formatBytes,
      note: data?.d1?.databaseBytes === null ? d1UnavailableNote(data) : d1SourceNote(data, 'database'),
    },
    {
      icon: Archive,
      label: 'R2 Storage',
      value: data?.r2?.storageBytes ?? null,
      limit: Number(data?.r2?.storageLimitBytes || 10 * 1024 * 1024 * 1024),
      formatter: formatBytes,
      note: data?.r2?.available ? `${Number(data?.r2?.objectCount || 0).toLocaleString('id-ID')} object` : 'Binding R2 belum terbaca.',
    },
    {
      icon: HardDrive,
      label: 'D1 Account',
      value: data?.d1?.accountStorageBytes ?? null,
      limit: Number(data?.d1?.accountStorageLimitBytes || 5 * 1024 * 1024 * 1024),
      formatter: formatBytes,
      note: data?.d1?.accountStorageBytes === null ? d1UnavailableNote(data) : d1SourceNote(data, 'account'),
    },
  ];
}

function UsageCard({ icon: Icon, label, value, limit, formatter, note, compact = false }: any) {
  const percentage = value === null ? 0 : Math.min(100, (Number(value || 0) / Number(limit || 1)) * 100);
  const tooltip = getUsageTooltip(label);
  return (
    <div className="rounded-2xl bg-white/60 border border-black/5 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-ink">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">
            {tooltip ? <ExplainedLabel tooltip={tooltip}>{label}</ExplainedLabel> : label}
          </p>
          <p className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-ink`}>
            {value === null ? 'Belum tersedia' : `${formatter(value)} / ${formatter(limit)}`}
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
        <div className={`h-full rounded-full ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }} />
      </div>
      {!compact && <p className="text-xs text-black/45 mt-3">{note}</p>}
    </div>
  );
}

function getUsageTooltip(label: string) {
  if (label === 'Clerk Users') return <ClerkUsersTooltip />;
  if (label === 'D1 Database' || label === 'D1 Account') return <D1StorageTooltip />;
  if (label === 'R2 Storage') return <R2StorageTooltip />;
  return null;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatBytes(value: number) {
  const bytes = Number(value || 0);
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 2 })} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB`;
  return `${bytes.toLocaleString('id-ID')} B`;
}

function formatResultValue(value: any) {
  if (typeof value === 'boolean') return value ? 'ya' : 'tidak';
  if (typeof value === 'number') return value.toLocaleString('id-ID');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function d1SourceNote(data: any, scope: 'database' | 'account') {
  if (data?.d1?.source === 'cloudflare_api') {
    const name = data?.d1?.cloudflareApi?.databaseName;
    return scope === 'account'
      ? 'Total file_size semua D1 database dari Cloudflare API.'
      : `Dibaca dari Cloudflare API${name ? `: ${name}` : ''}.`;
  }
  return 'Dibaca dari PRAGMA page_count * page_size runtime D1.';
}

function d1UnavailableNote(data: any) {
  return data?.d1?.cloudflareApi?.note || data?.d1?.cloudflareApi?.error || 'Ukuran D1 belum tersedia.';
}
