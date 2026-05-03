import { AlertTriangle, X } from 'lucide-react';
import { useStore } from '../store';

export default function ConfirmDialog() {
  const { confirmDialog, hideConfirm } = useStore();

  if (!confirmDialog) return null;

  const isDanger = confirmDialog.tone === 'danger';

  const handleConfirm = async () => {
    await confirmDialog.onConfirm();
    hideConfirm();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl border border-black/10 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-50 text-red-600' : 'bg-black/5 text-ink'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-heading font-light text-ink">{confirmDialog.title}</h2>
              <button type="button" onClick={hideConfirm} className="p-1 rounded-full text-black/40 hover:bg-black/5 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-black/60">{confirmDialog.message}</p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={hideConfirm}
            className="px-5 py-2.5 rounded-full border border-black/10 bg-white text-xs font-semibold uppercase tracking-widest hover:bg-black/5 transition-colors"
          >
            {confirmDialog.cancelLabel || 'Batal'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest text-white transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-ink hover:bg-black/80'}`}
          >
            {confirmDialog.confirmLabel || 'Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
