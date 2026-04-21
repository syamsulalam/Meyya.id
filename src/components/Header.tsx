import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LayoutGrid, LogIn, LogOut } from 'lucide-react';
import { useStore } from '../store';

export default function Header() {
  const { cart, user, logout } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 px-4 py-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        
        {/* Top Row: Left Icons | Logo | Right Icons */}
        <div className="flex items-center justify-between">
          
          {/* Left Icons */}
          <div className="flex items-center gap-4 w-1/3 justify-start">
            <a href="/#katalog" className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block" title="Katalog Produk">
              <LayoutGrid size={20} strokeWidth={1.5} />
            </a>
            <Link to="/search" className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block" title="Cari Produk (Search)">
              <Search size={20} strokeWidth={1.5} />
            </Link>
            <Link to="/wishlist" className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block" title="Wishlist Tersimpan">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
          </div>

          {/* Center Logo */}
          <div className="w-1/3 text-center flex justify-center">
            <Link to="/" className="text-[32px] tracking-[0.3em] font-[200] uppercase" style={{fontFamily: 'var(--font-logo)'}} title="Beranda MEYYA.ID">
              MEYYA<span className="text-xs font-sans tracking-normal opacity-50 ml-1">.ID</span>
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4 w-1/3 justify-end">
            <Link to="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative" title="Keranjang Belanja (Cart)">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to="/profil" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Profil Akun">
              <User size={20} strokeWidth={1.5} />
            </Link>

            {user ? (
               <button onClick={() => logout()} className="p-2 hover:bg-black/5 rounded-full transition-colors text-red-500" title="Keluar (Log Out)">
                 <LogOut size={20} strokeWidth={1.5} />
               </button>
            ) : (
               <Link to="/login" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Masuk / Daftar">
                 <LogIn size={20} strokeWidth={1.5} />
               </Link>
            )}
          </div>
        </div>

        {/* Bottom Row: Centered Navigation */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-[10px] sm:text-xs uppercase tracking-[0.1em] font-medium opacity-70">
          <Link to="/?kategori=pashmina" className="hover:opacity-100 transition-opacity">Pashmina</Link>
          <Link to="/?kategori=abaya" className="hover:opacity-100 transition-opacity">Abaya</Link>
          <Link to="/?kategori=khimar" className="hover:opacity-100 transition-opacity">Khimar</Link>
          <Link to="/?kategori=inner" className="hover:opacity-100 transition-opacity">Inner</Link>
          <Link to="/?kategori=aksesoris" className="hover:opacity-100 transition-opacity">Aksesoris</Link>
        </nav>

      </div>
    </header>
  );
}
