import { useRouteError } from 'react-router-dom';
import { RefreshCcw, Bug } from 'lucide-react';

export default function ErrorBoundaryPage() {
  const error: any = useRouteError();
  
  if (error) {
    console.error("Router caught an error:", error);
  }

  const handleReportBug = () => {
    const errText = error ? (error.stack || error.message || String(error)) : 'Unknown Error';
    const reportText = `Bug Report:\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}\n\nError Details:\n${errText}`;
    console.log(reportText);
    prompt('Silakan salin detail error di bawah ini untuk dilaporkan ke tim (dan error telah dicetak di console log):', reportText);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="glass-panel p-8 md:p-12 rounded-[40px] max-w-xl w-full text-center">
        <h1 className="text-3xl font-light font-heading mb-4 text-ink">Oops! Terjadi Kesalahan</h1>
        <p className="text-gray-600 mb-8 font-light text-sm">
          Maaf, ada sesuatu yang tidak berjalan semestinya pada sistem kami.<br/>
          Jangan khawatir, coba refresh halaman ini atau laporkan bug ke kami.
        </p>
        
        {/* Error Details if available */}
        {error?.message && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-left text-xs font-mono overflow-auto max-h-40 border border-red-100">
             {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-ink text-white rounded-full uppercase tracking-widest text-xs font-medium hover:bg-black/80 transition-all hover:scale-105 active:scale-95 shadow-lg w-full sm:w-auto"
          >
            <RefreshCcw size={16} />
            Kembali ke Beranda
          </button>
          <button 
            onClick={handleReportBug}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-ink border border-gray-200 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto"
          >
            <Bug size={16} />
            Lapor Bug
          </button>
        </div>
      </div>
    </div>
  );
}
