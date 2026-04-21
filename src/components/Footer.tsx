import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowRight, HelpCircle, MapPin, FileText, Lock, Mail, Tag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 pt-16 pb-8 px-4 bg-transparent text-ink">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1">
             <Link to="/" className="text-[28px] tracking-[0.3em] font-[200] uppercase block mb-4" style={{fontFamily: 'var(--font-logo)'}}>
              MEYYA
            </Link>
            <p className="text-sm opacity-70 mb-4 font-light leading-relaxed">
              Memberdayakan muslimah modern dengan mode (<i>modest fashion</i>) yang elegan, minimalis, dan dibuat dengan indah.
              Dirancang dengan ketelitian dan penuh perhatian.
            </p>
            <Link to="/tentang-kami" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest hover:opacity-70 transition-opacity mb-8 border-b border-ink pb-1">
              Tentang Kami <ArrowRight size={14} />
            </Link>
            <div className="flex gap-4">
              <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href="#" className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading uppercase tracking-widest text-xs font-semibold mb-6">Koleksi (<i>Explore</i>)</h4>
            <ul className="space-y-4 text-sm font-light opacity-80">
              <li><Link to="/?kategori=pashmina" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Tag size={12} /> Pashmina</Link></li>
              <li><Link to="/?kategori=abaya" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Tag size={12} /> Abaya</Link></li>
              <li><Link to="/?kategori=khimar" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Tag size={12} /> Khimar</Link></li>
              <li><Link to="/?kategori=inner" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Tag size={12} /> Inner</Link></li>
              <li><Link to="/?kategori=aksesoris" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Tag size={12} /> Aksesoris</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-heading uppercase tracking-widest text-xs font-semibold mb-6">Layanan Pelanggan (<i>Care</i>)</h4>
            <ul className="space-y-4 text-sm font-light opacity-80">
              <li><Link to="/faq" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><HelpCircle size={14} /> FAQ & Ukuran</Link></li>
              <li><Link to="/shipping" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><MapPin size={14} /> Kirim & Retur</Link></li>
              <li><Link to="/terms" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><FileText size={14} /> Syarat & Ketentuan</Link></li>
              <li><Link to="/contact" className="hover:opacity-100 hover:underline underline-offset-4 flex items-center gap-2"><Mail size={14} /> Hubungi Kami</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading uppercase tracking-widest text-xs font-semibold mb-6">Tetap Terhubung (<i>Stay Connected</i>)</h4>
            <p className="text-sm opacity-70 mb-4 font-light">
              Berlangganan <i>newsletter</i> kami untuk informasi rilis eksklusif, akses awal promo diskon (<i>sales</i>), dan katalog busana editorial kami.
            </p>
            <form className="flex border border-black/20 rounded-full p-1 focus-within:border-black/50 transition-colors">
              <input 
                type="email" 
                placeholder="Alamat email Anda..." 
                className="bg-transparent flex-1 px-4 py-2 text-sm focus:outline-none placeholder:text-black/40"
              />
              <button 
                type="submit" 
                className="bg-ink text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Berlangganan"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light opacity-60">
          <p>&copy; {new Date().getFullYear()} MEYYA.ID. Hak cipta dilindungi (<i>All rights reserved</i>).</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:opacity-100 flex items-center gap-1"><Lock size={12} /> Kebijakan Privasi</Link>
            <Link to="/terms" className="hover:opacity-100 flex items-center gap-1"><FileText size={12} /> Ketentuan Layanan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
