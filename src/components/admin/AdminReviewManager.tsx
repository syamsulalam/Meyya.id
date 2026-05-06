import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { EyeOff, MessageSquareReply, Star } from 'lucide-react';
import { useAuthFetch, useAuthFetcher } from '../../hooks/useAuthFetch';
import { useStore } from '../../store';
import {
  AdminReplyTooltip,
  ExplainedLabel,
  FeaturedReviewTooltip,
  ReviewModerationTooltip,
} from '../term-tooltips';

export default function AdminReviewManager() {
  const fetcher = useAuthFetcher();
  const authFetch = useAuthFetch();
  const { addToast } = useStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const { data, error, isLoading } = useSWR(`/api/admin/reviews${statusFilter ? `?status=${statusFilter}` : ''}`, fetcher);
  const reviews = Array.isArray(data) ? data : [];

  const updateReview = async (id: number, payload: any) => {
    try {
      const res = await authFetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Gagal update review');
      mutate(`/api/admin/reviews${statusFilter ? `?status=${statusFilter}` : ''}`);
      addToast('Review berhasil diperbarui.', 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-light font-heading text-ink">
            <ExplainedLabel tooltip={<ReviewModerationTooltip />}>Review Produk</ExplainedLabel>
          </h2>
          <p className="mt-1 text-sm text-black/55">Moderasi ulasan, balas customer, dan pilih review featured untuk product page.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter status review"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
        >
          <option value="">Semua status</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING">Pending</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>

      {isLoading && <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">Memuat review...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Gagal memuat review: {error.message}</div>}
      {!isLoading && reviews.length === 0 && (
        <div className="rounded-3xl border border-black/5 bg-white/50 py-12 text-center text-black/45">
          Belum ada review pada filter ini.
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review: any) => {
          const draft = replyDrafts[review.id] ?? review.admin_reply ?? '';
          return (
            <div key={review.id} className="rounded-3xl border border-black/5 bg-white/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-black/50">{review.status}</span>
                    {Number(review.is_featured || 0) === 1 && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                        <ExplainedLabel tooltip={<FeaturedReviewTooltip />}>Featured</ExplainedLabel>
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-black/35">{new Date(review.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{review.product_name || `Produk #${review.product_id}`}</h3>
                  <p className="mt-1 text-xs text-black/45">{review.customer_name || review.email || review.clerk_id} · Order {review.order_id || '-'}</p>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={15} className={index < Number(review.rating || 0) ? 'fill-yellow-400 stroke-yellow-500' : 'stroke-black/20'} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">{review.review_text || 'Tanpa catatan tambahan.'}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateReview(review.id, { status: review.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED' })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink hover:bg-black/10"
                  >
                    <EyeOff size={13} /> <ExplainedLabel tooltip={<ReviewModerationTooltip />}>{review.status === 'PUBLISHED' ? 'Hide' : 'Publish'}</ExplainedLabel>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReview(review.id, { is_featured: Number(review.is_featured || 0) !== 1 })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-amber-800 hover:bg-amber-100"
                  >
                    <Star size={13} /> <ExplainedLabel tooltip={<FeaturedReviewTooltip />}>{Number(review.is_featured || 0) === 1 ? 'Unfeature' : 'Feature'}</ExplainedLabel>
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/5 bg-white/70 p-4">
                <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-black/45">
                  <MessageSquareReply size={13} /> <ExplainedLabel tooltip={<AdminReplyTooltip />}>Balasan Meyya</ExplainedLabel>
                </label>
                <textarea
                  value={draft}
                  onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-ink"
                  placeholder="Tulis balasan public untuk customer..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => updateReview(review.id, { admin_reply: draft })}
                    className="rounded-full bg-ink px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-white"
                  >
                    Simpan Balasan
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
