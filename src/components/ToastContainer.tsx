import { useStore } from '../store';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: any) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);
  
  const isError = toast.type === 'error' || toast.message.toLowerCase().includes('gagal');
  const Icon = isError ? AlertCircle : (toast.type === 'success' ? CheckCircle2 : Info);
  
  return (
    <div className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium animate-slide-up bg-ink text-white border border-white/10" style={{ animation: 'slide-up 0.3s ease-out forwards' }}>
      <Icon size={18} className={isError ? "text-red-400" : "text-green-400"} />
      <span className="flex-1 max-w-sm">{toast.message}</span>
      <button onClick={onRemove} className="opacity-50 hover:opacity-100 transition-opacity ml-2">
        <X size={16}/>
      </button>
    </div>
  );
}
