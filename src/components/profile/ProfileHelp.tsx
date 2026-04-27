import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileHelp() {
  return (
    <div>
      <h3 className="text-xl font-light mb-6 border-b border-black/10 pb-4">Pusat Bantuan & CS</h3>
      <div className="space-y-4 text-sm">
        <Link to="/faq" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
          <span>Pertanyaan Umum (FAQ)</span>
          <span className="opacity-50">→</span>
        </Link>
        <Link to="/shipping" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
          <span>Info Pengiriman & Retur</span>
          <span className="opacity-50">→</span>
        </Link>
        <Link to="/contact" className="flex items-center justify-between p-4 bg-white/40 rounded-2xl hover:bg-white/60 transition-colors border border-black/5">
          <span>Hubungi Customer Service</span>
          <span className="opacity-50">→</span>
        </Link>
        
        <div className="mt-8 p-6 bg-ink text-white rounded-3xl flex flex-col items-center text-center">
          <HelpCircle size={32} className="opacity-50 mb-4" />
          <h4 className="font-medium mb-2">Butuh bantuan langsung?</h4>
          <p className="text-xs opacity-70 mb-6">CS kami aktif Senin-Jumat, Pukul 09:00 - 17:00 WIB.</p>
          <button className="text-xs bg-white text-ink px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors">Chat Admin WhatsApp</button>
        </div>
      </div>
    </div>
  );
}
