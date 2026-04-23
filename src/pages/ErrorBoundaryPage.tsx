import { useRouteError } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';

export default function ErrorBoundaryPage() {
  const error: any = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="glass-panel p-8 md:p-12 rounded-[40px] max-w-xl w-full text-center">
        <h1 className="text-3xl font-light font-heading mb-4 text-ink">Oops! Terjadi Kesalahan</h1>
        <p className="text-gray-600 mb-8 font-light text-sm">
          Maaf, ada sesuatu yang tidak berjalan semestinya pada sistem kami.
          Tim teknis kami telah disiagakan untuk menangani masalah ini.
        </p>
        
        {/* Error Details if available */}
        {error?.message && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-left text-xs font-mono overflow-auto max-h-40">
             {error.message}
          </div>
        )}

        <button 
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-ink text-white rounded-full uppercase tracking-widest text-xs font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <RefreshCcw size={16} />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
