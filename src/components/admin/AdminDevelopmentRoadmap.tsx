import { CheckCircle2, Clock3, ListChecks, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { developmentRoadmap, RoadmapStatus } from '../../data/developmentRoadmap';

const statusMeta: Record<RoadmapStatus, { label: string; className: string; icon: ReactNode }> = {
  done: { label: 'Sudah Ada', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={14} /> },
  in_progress: { label: 'Dikerjakan', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Wrench size={14} /> },
  planned: { label: 'Akan Ada', className: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock3 size={14} /> },
};

type SortMode = 'planned_first' | 'done_first' | 'area';

const statusRank: Record<RoadmapStatus, number> = {
  planned: 0,
  in_progress: 1,
  done: 2,
};

export default function AdminDevelopmentRoadmap() {
  const [sortMode, setSortMode] = useState<SortMode>('planned_first');
  const doneCount = developmentRoadmap.filter((item) => item.status === 'done').length;
  const plannedCount = developmentRoadmap.filter((item) => item.status === 'planned').length;
  const sortedRoadmap = useMemo(() => {
    return [...developmentRoadmap].sort((a, b) => {
      if (sortMode === 'done_first') {
        return statusRank[b.status] - statusRank[a.status] || a.area.localeCompare(b.area) || a.title.localeCompare(b.title);
      }
      if (sortMode === 'area') {
        return a.area.localeCompare(b.area) || statusRank[a.status] - statusRank[b.status] || a.title.localeCompare(b.title);
      }
      return statusRank[a.status] - statusRank[b.status] || a.area.localeCompare(b.area) || a.title.localeCompare(b.title);
    });
  }, [sortMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-light mb-2 flex items-center gap-2">
            <ListChecks size={24} /> Roadmap Pengembangan
          </h2>
          <p className="text-sm text-black/60">Daftar fitur yang sudah ada dan penguatan yang masih direncanakan untuk Meyya.id.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/50 border border-black/5 rounded-2xl px-5 py-3">
            <p className="text-[10px] uppercase tracking-widest text-black/40">Sudah Ada</p>
            <p className="text-2xl font-light">{doneCount}</p>
          </div>
          <div className="bg-white/50 border border-black/5 rounded-2xl px-5 py-3">
            <p className="text-[10px] uppercase tracking-widest text-black/40">Akan Ada</p>
            <p className="text-2xl font-light">{plannedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/40 border border-black/5 rounded-[2rem] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-black/40">Urutan Roadmap</p>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-ink focus:outline-none focus:border-ink"
          >
            <option value="planned_first">Akan Ada di Atas</option>
            <option value="done_first">Sudah Ada di Atas</option>
            <option value="area">Area Fitur</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 text-[10px] uppercase tracking-widest text-black/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Fitur</th>
                <th className="px-6 py-4 font-semibold">Area</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {sortedRoadmap.map((item) => {
                const meta = statusMeta[item.status];
                return (
                  <tr key={`${item.area}-${item.title}`} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-widest text-black/60">{item.area}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${meta.className}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-black/60">{item.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
